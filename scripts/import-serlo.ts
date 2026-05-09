// Einmaliger Import: Serlo-Mathematik-Inhalte → Supabase tasks.
//
// Mapping-Strategie (Option A):
//   Edvance hat 5 fixe Kompetenzbereiche (Cluster). Serlo's Taxonomie
//   ist viel granularer und wird beim Import per Keyword-Heuristik auf
//   genau einen dieser 5 Cluster gemapped. Tasks ohne Match landen mit
//   cluster_id = NULL (Admin sortiert spaeter ein).
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

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SERLO_GRAPHQL_URL = 'https://api.serlo.org/graphql'
const SERLO_MATHEMATIK_ROOT = 5
const SERLO_PUBLIC_BASE = 'https://de.serlo.org'

const QUERY = `
query {
  uuid(id: ${SERLO_MATHEMATIK_ROOT}) {
    ... on TaxonomyTerm {
      id
      name
      children {
        nodes {
          ... on TaxonomyTerm {
            id
            name
            children {
              nodes {
                ... on TaxonomyTerm {
                  id
                  name
                  children {
                    nodes {
                      ... on Exercise {
                        id
                        currentRevision { content }
                        solution { currentRevision { content } }
                      }
                      ... on Article {
                        id
                        currentRevision { title content }
                      }
                      ... on Video {
                        id
                        currentRevision { title url }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`

// ── Keyword-Mapping: Serlo-Pfad → Edvance-Kompetenzbereich ───────────────────
//
// Reihenfolge zaehlt: spezifischere Bereiche (Daten & Zufall, Geometrie)
// werden vor allgemeineren (Algebra, Zahl) geprueft. Sachrechnen ganz zum
// Schluss als Fallback fuer Anwendungs-Themen.

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

type SerloRevision = { title?: string | null; content?: string | null; url?: string | null }
type SerloChildren = { nodes?: SerloNode[] | null } | null
type SerloNode = {
  id?: number | null
  name?: string | null
  children?: SerloChildren
  currentRevision?: SerloRevision | null
  solution?: { currentRevision?: SerloRevision | null } | null
}

type ContentType = 'exercise' | 'article' | 'video'

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
  exercise: number
  article: number
  video: number
  matched: number
  unmapped: number
  errors: number
}

// ── Type Guards ──────────────────────────────────────────────────────────────

function isEmpty(node: SerloNode | null | undefined): boolean {
  return node == null || Object.keys(node).length === 0
}

function isTaxonomy(node: SerloNode): boolean {
  return node.children != null && Array.isArray(node.children.nodes)
}

function isExercise(node: SerloNode): boolean {
  return node.solution !== undefined && node.solution !== null
}

function isVideo(node: SerloNode): boolean {
  return typeof node.currentRevision?.url === 'string'
}

function isArticle(node: SerloNode): boolean {
  if (isExercise(node) || isVideo(node)) return false
  return typeof node.currentRevision?.title === 'string'
}

// ── Serlo Fetch ──────────────────────────────────────────────────────────────

async function fetchSerlo(): Promise<SerloNode | null> {
  const res = await fetch(SERLO_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: QUERY }),
  })
  if (!res.ok) throw new Error(`Serlo API HTTP ${res.status}`)
  const json = (await res.json()) as { data?: { uuid?: SerloNode | null }; errors?: unknown }
  if (json.errors) throw new Error(`Serlo GraphQL Errors: ${JSON.stringify(json.errors)}`)
  return json.data?.uuid ?? null
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

async function insertTask(
  supabase: SupabaseClient,
  payload: TaskInsert,
  stats: Stats,
): Promise<void> {
  if (payload.serlo_uuid != null) {
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('serlo_uuid', payload.serlo_uuid)
      .maybeSingle()
    if (existing?.id) return
  }
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
}

// ── Walker ───────────────────────────────────────────────────────────────────

async function walkTaxonomy(
  supabase: SupabaseClient,
  node: SerloNode,
  pathSoFar: string[],
  clusterMap: Record<string, string>,
  stats: Stats,
): Promise<void> {
  const children = node.children?.nodes ?? []
  for (const child of children) {
    if (isEmpty(child)) continue

    if (isTaxonomy(child)) {
      const newPath = [...pathSoFar, child.name ?? '']
      await walkTaxonomy(supabase, child, newPath, clusterMap, stats)
      continue
    }

    const matchedClusterName = mapPathToCluster(pathSoFar)
    const clusterId = matchedClusterName ? (clusterMap[matchedClusterName] ?? null) : null
    const serloUrl = child.id != null ? `${SERLO_PUBLIC_BASE}/${child.id}` : null

    if (isExercise(child)) {
      await insertTask(
        supabase,
        {
          cluster_id: clusterId,
          serlo_uuid: child.id ?? null,
          serlo_url: serloUrl,
          content_type: 'exercise',
          title: null,
          question: child.currentRevision?.content ?? null,
          solution: child.solution?.currentRevision?.content ?? null,
        },
        stats,
      )
      continue
    }

    if (isVideo(child)) {
      await insertTask(
        supabase,
        {
          cluster_id: clusterId,
          serlo_uuid: child.id ?? null,
          serlo_url: serloUrl,
          content_type: 'video',
          title: child.currentRevision?.title ?? null,
          question: child.currentRevision?.url ?? null,
          solution: null,
        },
        stats,
      )
      continue
    }

    if (isArticle(child)) {
      await insertTask(
        supabase,
        {
          cluster_id: clusterId,
          serlo_uuid: child.id ?? null,
          serlo_url: serloUrl,
          content_type: 'article',
          title: child.currentRevision?.title ?? null,
          question: child.currentRevision?.content ?? null,
          solution: null,
        },
        stats,
      )
      continue
    }
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
    exercise: 0,
    article: 0,
    video: 0,
    matched: 0,
    unmapped: 0,
    errors: 0,
  }

  console.log('▶ Mathematik-Subject + Edvance-Cluster laden ...')
  const subjectId = await getMathematikSubjectId(supabase)
  const clusterMap = await loadClusterMap(supabase, subjectId)
  console.log(`  Edvance-Cluster gefunden: ${Object.keys(clusterMap).join(', ')}`)

  console.log('▶ Lade Serlo-Mathematik-Taxonomie ...')
  const root = await fetchSerlo()
  if (!root) {
    console.error('Keine Daten von Serlo erhalten.')
    process.exit(1)
  }

  console.log('▶ Walke Taxonomie und importiere Tasks ...')
  await walkTaxonomy(supabase, root, [root.name ?? 'Mathematik'], clusterMap, stats)

  const total = stats.exercise + stats.article + stats.video
  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  IMPORT FERTIG')
  console.log('═══════════════════════════════════════════')
  console.log(`  Exercises          : ${stats.exercise}`)
  console.log(`  Articles           : ${stats.article}`)
  console.log(`  Videos             : ${stats.video}`)
  console.log(`  -------------------`)
  console.log(`  Total Tasks        : ${total}`)
  console.log(`  → Cluster gemapped : ${stats.matched}`)
  console.log(`  → ohne Cluster     : ${stats.unmapped}  (Admin sortiert spaeter)`)
  console.log(`  Fehler (geloggt)   : ${stats.errors}`)
  console.log('═══════════════════════════════════════════')
}

main().catch((err) => {
  console.error('Fataler Fehler:', err)
  process.exit(1)
})
