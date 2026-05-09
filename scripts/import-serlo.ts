// Einmaliger Import: Serlo-Mathematik-Inhalte → Supabase tasks.
//
// Mapping-Strategie (Option A):
//   Edvance hat 5 fixe Kompetenzbereiche (Cluster). Serlo's Taxonomie
//   ist viel granularer und wird beim Import per Keyword-Heuristik auf
//   genau einen dieser 5 Cluster gemapped. Tasks ohne Match landen mit
//   cluster_id = NULL (Admin sortiert spaeter ein).
//
// Fetch-Strategie:
//   Serlo's GraphQL API limitiert Query-Komplexitaet. Tief verschachtelte
//   Queries mit Leaf-Content (Exercise.currentRevision etc.) auf >2 Ebenen
//   werden mit HTTP 400 abgelehnt. Daher: rekursive flache Queries pro Node.
//
// Nutzung (empfohlen):
//   npm run seed:serlo
// Manuell:
//   npx tsx --env-file=.env scripts/import-serlo.ts
//
// Voraussetzungen:
//   - schema_content.sql + migrations/001_competency_areas.sql ausgefuehrt
//   - npm run seed:clusters einmal gelaufen (5 Kompetenzbereiche existieren)
//
// ENV-Vars in .env:
//   SUPABASE_URL (oder VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY  (NICHT der anon key – server-only)
//   SERLO_MAX_LEAVES (optional, default 500) – Sicherheits-Cap fuer Leaf-Imports
//   SERLO_MAX_DEPTH  (optional, default 6)   – Sicherheits-Cap fuer Tiefe

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SERLO_GRAPHQL_URL = 'https://api.serlo.org/graphql'
const SERLO_MATHEMATIK_ROOT = 5
const SERLO_PUBLIC_BASE = 'https://de.serlo.org'

const MAX_LEAVES = Number(process.env.SERLO_MAX_LEAVES ?? 500)
const MAX_DEPTH = Number(process.env.SERLO_MAX_DEPTH ?? 6)

// ── Keyword-Mapping: Serlo-Pfad → Edvance-Kompetenzbereich ───────────────────

const COMPETENCY_KEYWORDS: { name: string; keywords: string[] }[] = [
  {
    name: 'Daten & Zufall',
    keywords: [
      'stochastik', 'statistik', 'wahrscheinlichkeit', 'diagramm',
      'mittelwert', 'median', 'zufall', 'baumdiagramm', 'häufigkeit',
    ],
  },
  {
    name: 'Geometrie & Messen',
    keywords: [
      'geometrie', 'fläche', 'volumen', 'pythagoras', 'strahlensatz',
      'kreis', 'trigonom', 'winkel', 'dreieck', 'viereck', 'körper',
      'raum', 'längenberechnung',
    ],
  },
  {
    name: 'Algebra & Funktionen',
    keywords: [
      'term', 'gleichung', 'funktion', 'variable', 'linear', 'quadrat',
      'potenz', 'wurzel', 'exponential', 'ungleichung', 'algebra',
    ],
  },
  {
    name: 'Zahl & Rechnen',
    keywords: [
      'rational', 'bruch', 'dezimal', 'prozent', 'zins', 'rechnen',
      'ganze zahl', 'natürliche zahl', 'negative zahl', 'rechenoperation',
      'zahlen und größen',
    ],
  },
  {
    name: 'Sachrechnen & Modellieren',
    keywords: [
      'sachaufgabe', 'sachrechn', 'modell', 'dreisatz', 'tarif',
      'anwendung', 'textaufgabe',
    ],
  },
]

function mapPathToCluster(path: string[]): string | null {
  const text = path.join(' ').toLowerCase()
  for (const { name, keywords } of COMPETENCY_KEYWORDS) {
    if (keywords.some((kw) => text.includes(kw))) return name
  }
  return null
}

// ── Typen ────────────────────────────────────────────────────────────────────

type LeafType = 'Exercise' | 'Article' | 'Video'
type ChildRef = { __typename?: string | null; id?: number | null; name?: string | null }
type ShallowTaxonomy = {
  __typename: 'TaxonomyTerm'
  id: number
  name: string
  children: ChildRef[]
}
type LeafDetails = {
  __typename: LeafType
  id: number
  title: string | null
  content: string | null
  url: string | null
  solutionContent: string | null
}

type ContentType = 'exercise' | 'article' | 'video'

const TYPE_MAP: Record<LeafType, ContentType> = {
  Exercise: 'exercise',
  Article: 'article',
  Video: 'video',
}

type TaskInsert = {
  cluster_id: string | null
  serlo_uuid: number | null
  serlo_url: string | null
  content_type: ContentType
  title: string | null
  question: string | null
  solution: string | null
}

type Stats = {
  taxonomies: number
  exercise: number
  article: number
  video: number
  matched: number
  unmapped: number
  errors: number
  skipped: number
}

// ── Serlo Fetch ──────────────────────────────────────────────────────────────

async function gql<T>(query: string): Promise<T> {
  const res = await fetch(SERLO_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Serlo API HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = (await res.json()) as { data?: T; errors?: unknown }
  if (json.errors) throw new Error(`Serlo GraphQL Errors: ${JSON.stringify(json.errors)}`)
  if (!json.data) throw new Error('Serlo GraphQL: leere data response')
  return json.data
}

// Holt einen Knoten mit __typename + (falls TaxonomyTerm) direkten Kind-Refs.
async function fetchNodeShallow(id: number): Promise<ShallowTaxonomy | { __typename: LeafType } | null> {
  const query = `query {
    uuid(id: ${id}) {
      __typename
      ... on TaxonomyTerm {
        id
        name
        children {
          nodes {
            __typename
            ... on TaxonomyTerm { id name }
            ... on Exercise { id }
            ... on Article { id }
            ... on Video { id }
          }
        }
      }
    }
  }`
  type Resp = {
    uuid:
      | (ShallowTaxonomy & { children: { nodes: ChildRef[] } })
      | { __typename: LeafType }
      | null
  }
  const data = await gql<Resp>(query)
  const node = data.uuid
  if (!node) return null
  if (node.__typename === 'TaxonomyTerm') {
    const tn = node as ShallowTaxonomy & { children: { nodes: ChildRef[] } }
    return {
      __typename: 'TaxonomyTerm',
      id: tn.id,
      name: tn.name,
      children: tn.children?.nodes ?? [],
    }
  }
  return { __typename: node.__typename as LeafType }
}

async function fetchLeafDetails(id: number, type: LeafType): Promise<LeafDetails | null> {
  // Serlo-Schema (Stand 2026): Exercise hat title direkt; solution ist nicht
  // mehr separat — sie ist Teil von currentRevision.content (JSON-encoded).
  // Wir uebernehmen den Inhalt als question und lassen solution leer.
  const fragment =
    type === 'Exercise'
      ? '... on Exercise { id title currentRevision { content } }'
      : type === 'Article'
      ? '... on Article { id currentRevision { title content } }'
      : '... on Video { id currentRevision { title url } }'

  const query = `query { uuid(id: ${id}) { __typename ${fragment} } }`
  type Resp = {
    uuid:
      | (
          | { __typename: 'Exercise'; id: number; title?: string | null; currentRevision?: { content?: string | null } | null }
          | { __typename: 'Article'; id: number; currentRevision?: { title?: string | null; content?: string | null } | null }
          | { __typename: 'Video'; id: number; currentRevision?: { title?: string | null; url?: string | null } | null }
        )
      | null
  }
  const data = await gql<Resp>(query)
  const node = data.uuid
  if (!node) return null

  if (node.__typename === 'Exercise') {
    return {
      __typename: 'Exercise',
      id: node.id,
      title: node.title ?? null,
      content: node.currentRevision?.content ?? null,
      url: null,
      solutionContent: null,
    }
  }
  if (node.__typename === 'Article') {
    return {
      __typename: 'Article',
      id: node.id,
      title: node.currentRevision?.title ?? null,
      content: node.currentRevision?.content ?? null,
      url: null,
      solutionContent: null,
    }
  }
  return {
    __typename: 'Video',
    id: node.id,
    title: node.currentRevision?.title ?? null,
    content: null,
    url: node.currentRevision?.url ?? null,
    solutionContent: null,
  }
}

// ── Supabase Helpers ─────────────────────────────────────────────────────────

async function getMathematikSubjectId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', 'Mathematik')
    .maybeSingle()
  if (error) throw new Error(`subjects select: ${error.message}`)
  if (!data?.id) {
    throw new Error(
      'Mathematik-Subject nicht gefunden. Fuehre erst schema.sql + seed:clusters aus.',
    )
  }
  return data.id as string
}

async function loadClusterMap(
  supabase: SupabaseClient,
  subjectId: string,
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('skill_clusters')
    .select('id, name')
    .eq('subject_id', subjectId)
  if (error) throw new Error(`skill_clusters select: ${error.message}`)
  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row?.name && row?.id) map[row.name as string] = row.id as string
  }
  if (Object.keys(map).length === 0) {
    throw new Error(
      'Keine skill_clusters fuer Mathematik gefunden. Fuehre erst seed:clusters aus.',
    )
  }
  return map
}

async function taskExists(supabase: SupabaseClient, serloUuid: number): Promise<boolean> {
  const { data } = await supabase.from('tasks').select('id').eq('serlo_uuid', serloUuid).maybeSingle()
  return data?.id != null
}

async function insertTask(
  supabase: SupabaseClient,
  payload: TaskInsert,
  stats: Stats,
): Promise<void> {
  const { error } = await supabase.from('tasks').insert(payload)
  if (error) {
    const label = payload.title ?? `serlo:${payload.serlo_uuid ?? '?'}`
    console.error(`  ✗ Task ${payload.content_type} "${label}": ${error.message}`)
    stats.errors += 1
    return
  }
  stats[payload.content_type] += 1
  if (payload.cluster_id) stats.matched += 1
  else stats.unmapped += 1
  const total = stats.exercise + stats.article + stats.video
  if (total % 10 === 0) {
    console.log(
      `     · ${total} importiert  (mapped ${stats.matched} / ohne Cluster ${stats.unmapped} / skipped ${stats.skipped})`,
    )
  }
}

// ── Walker (rekursiv mit flachen Queries) ────────────────────────────────────

type WalkContext = {
  supabase: SupabaseClient
  clusterMap: Record<string, string>
  visitedTaxonomies: Set<number>
  visitedLeaves: Set<number>
  stats: Stats
}

async function exploreTaxonomy(
  ctx: WalkContext,
  id: number,
  pathSoFar: string[],
  depth: number,
): Promise<void> {
  if (ctx.visitedTaxonomies.has(id)) return
  ctx.visitedTaxonomies.add(id)
  if (depth > MAX_DEPTH) {
    console.log(`  ⚠ Max-Depth ${MAX_DEPTH} erreicht bei "${pathSoFar.join(' / ')}", brich Subtree ab`)
    return
  }
  if (ctx.stats.exercise + ctx.stats.article + ctx.stats.video >= MAX_LEAVES) return

  let node: Awaited<ReturnType<typeof fetchNodeShallow>>
  try {
    node = await fetchNodeShallow(id)
  } catch (err) {
    console.error(`  ✗ fetchNodeShallow(${id}): ${err instanceof Error ? err.message : err}`)
    ctx.stats.errors += 1
    return
  }
  if (!node) return
  if (node.__typename !== 'TaxonomyTerm') return

  ctx.stats.taxonomies += 1
  const newPath = [...pathSoFar, node.name]
  const indent = '  '.repeat(depth)
  console.log(`${indent}📂 ${node.name}  (${node.children.length} children)`)

  for (const child of node.children) {
    if (ctx.stats.exercise + ctx.stats.article + ctx.stats.video >= MAX_LEAVES) {
      console.log(`  ⚠ MAX_LEAVES ${MAX_LEAVES} erreicht, breche Import ab`)
      return
    }
    if (!child?.__typename || child?.id == null) continue

    if (child.__typename === 'TaxonomyTerm') {
      await exploreTaxonomy(ctx, child.id, newPath, depth + 1)
      continue
    }

    if (child.__typename !== 'Exercise' && child.__typename !== 'Article' && child.__typename !== 'Video') {
      continue
    }
    const leafType = child.__typename as LeafType
    const leafId = child.id

    if (ctx.visitedLeaves.has(leafId)) continue
    ctx.visitedLeaves.add(leafId)

    if (await taskExists(ctx.supabase, leafId)) {
      ctx.stats.skipped += 1
      continue
    }

    let details: LeafDetails | null
    try {
      details = await fetchLeafDetails(leafId, leafType)
    } catch (err) {
      console.error(`  ✗ fetchLeafDetails(${leafId}, ${leafType}): ${err instanceof Error ? err.message : err}`)
      ctx.stats.errors += 1
      continue
    }
    if (!details) continue

    const matchedClusterName = mapPathToCluster(newPath)
    const clusterId = matchedClusterName ? (ctx.clusterMap[matchedClusterName] ?? null) : null
    const serloUrl = `${SERLO_PUBLIC_BASE}/${details.id}`

    await insertTask(
      ctx.supabase,
      {
        cluster_id: clusterId,
        serlo_uuid: details.id,
        serlo_url: serloUrl,
        content_type: TYPE_MAP[details.__typename],
        title: details.title,
        question: details.__typename === 'Video' ? details.url : details.content,
        solution: details.solutionContent,
      },
      ctx.stats,
    )
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Fehlende ENV-Vars in .env: SUPABASE_URL (oder VITE_SUPABASE_URL) und SUPABASE_SERVICE_ROLE_KEY.',
    )
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const stats: Stats = {
    taxonomies: 0,
    exercise: 0,
    article: 0,
    video: 0,
    matched: 0,
    unmapped: 0,
    errors: 0,
    skipped: 0,
  }

  console.log('▶ Mathematik-Subject + Edvance-Cluster laden ...')
  const subjectId = await getMathematikSubjectId(supabase)
  const clusterMap = await loadClusterMap(supabase, subjectId)
  console.log(`  Edvance-Cluster gefunden: ${Object.keys(clusterMap).join(', ')}`)
  console.log(`  Limits: MAX_LEAVES=${MAX_LEAVES}, MAX_DEPTH=${MAX_DEPTH}`)

  console.log('▶ Walke Serlo-Mathematik-Taxonomie rekursiv ...')
  const ctx: WalkContext = {
    supabase,
    clusterMap,
    visitedTaxonomies: new Set(),
    visitedLeaves: new Set(),
    stats,
  }
  await exploreTaxonomy(ctx, SERLO_MATHEMATIK_ROOT, [], 0)

  const total = stats.exercise + stats.article + stats.video
  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  IMPORT FERTIG')
  console.log('═══════════════════════════════════════════')
  console.log(`  Taxonomies besucht : ${stats.taxonomies}`)
  console.log(`  Exercises          : ${stats.exercise}`)
  console.log(`  Articles           : ${stats.article}`)
  console.log(`  Videos             : ${stats.video}`)
  console.log(`  -------------------`)
  console.log(`  Total Tasks neu    : ${total}`)
  console.log(`  → Cluster gemapped : ${stats.matched}`)
  console.log(`  → ohne Cluster     : ${stats.unmapped}`)
  console.log(`  Bereits importiert : ${stats.skipped}  (uebersprungen)`)
  console.log(`  Fehler (geloggt)   : ${stats.errors}`)
  console.log('═══════════════════════════════════════════')
}

main().catch((err) => {
  console.error('Fataler Fehler:', err)
  process.exit(1)
})
