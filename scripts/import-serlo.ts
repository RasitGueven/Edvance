// Einmaliger Import: Serlo-Mathematik-Inhalte → Supabase (skill_clusters + tasks).
//
// Nutzung (empfohlen):
//   npm run seed:serlo
// Manuell:
//   npx tsx --env-file=.env.local scripts/import-serlo.ts
//
// Benoetigte ENV-Vars in .env.local:
//   SUPABASE_URL (oder VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY  (NICHT der anon key – server-only)
//
// Verhalten:
//   - Idempotent: bereits importierte Cluster/Tasks werden uebersprungen
//     (Match via serlo_taxonomy_id bzw. serlo_uuid).
//   - Fehler pro Item werden geloggt, das Script bricht NICHT ab.

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
  clusters: number
  exercise: number
  exercise_group: number
  article: number
  video: number
  course: number
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

async function ensureMathematikSubject(supabase: SupabaseClient): Promise<string> {
  const { data: existing, error: selectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', 'Mathematik')
    .maybeSingle()
  if (selectError) throw new Error(`subjects select: ${selectError.message}`)
  if (existing?.id) return existing.id as string

  const { data: created, error: insertError } = await supabase
    .from('subjects')
    .insert({ name: 'Mathematik', serlo_id: SERLO_MATHEMATIK_ROOT })
    .select('id')
    .single()
  if (insertError) throw new Error(`subjects insert: ${insertError.message}`)
  return created.id as string
}

async function ensureCluster(
  supabase: SupabaseClient,
  name: string,
  serloId: number,
  subjectId: string,
  stats: Stats,
): Promise<string | null> {
  const { data: existing, error: selectError } = await supabase
    .from('skill_clusters')
    .select('id')
    .eq('serlo_taxonomy_id', serloId)
    .maybeSingle()
  if (selectError) {
    console.error(`  ✗ Cluster select "${name}" (${serloId}): ${selectError.message}`)
    stats.errors += 1
    return null
  }
  if (existing?.id) return existing.id as string

  const { data: created, error: insertError } = await supabase
    .from('skill_clusters')
    .insert({
      subject_id: subjectId,
      name,
      class_level_min: 5,
      class_level_max: 13,
      serlo_taxonomy_id: serloId,
    })
    .select('id')
    .single()
  if (insertError) {
    console.error(`  ✗ Cluster insert "${name}" (${serloId}): ${insertError.message}`)
    stats.errors += 1
    return null
  }
  stats.clusters += 1
  console.log(`  ✓ Cluster: ${name} (${serloId})`)
  return created.id as string
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
}

// ── Walker ───────────────────────────────────────────────────────────────────

async function walkTaxonomy(
  supabase: SupabaseClient,
  node: SerloNode,
  subjectId: string,
  parentClusterId: string | null,
  stats: Stats,
): Promise<void> {
  const children = node.children?.nodes ?? []
  for (const child of children) {
    if (isEmpty(child)) continue

    if (isTaxonomy(child)) {
      const clusterId = await ensureCluster(
        supabase,
        child.name ?? 'Unbenannt',
        child.id ?? 0,
        subjectId,
        stats,
      )
      if (clusterId) {
        await walkTaxonomy(supabase, child, subjectId, clusterId, stats)
      }
      continue
    }

    if (isExercise(child)) {
      await insertTask(
        supabase,
        {
          cluster_id: parentClusterId,
          serlo_uuid: child.id ?? null,
          serlo_url: child.id != null ? `${SERLO_PUBLIC_BASE}/${child.id}` : null,
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
          cluster_id: parentClusterId,
          serlo_uuid: child.id ?? null,
          serlo_url: child.id != null ? `${SERLO_PUBLIC_BASE}/${child.id}` : null,
          content_type: 'video',
          title: child.currentRevision?.title ?? null,
          // Video-URL im question-Feld ablegen (Schema hat kein dediziertes Video-URL-Feld).
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
          cluster_id: parentClusterId,
          serlo_uuid: child.id ?? null,
          serlo_url: child.id != null ? `${SERLO_PUBLIC_BASE}/${child.id}` : null,
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
      'Fehlende ENV-Vars in .env.local: SUPABASE_URL (oder VITE_SUPABASE_URL) und SUPABASE_SERVICE_ROLE_KEY.',
    )
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const stats: Stats = {
    clusters: 0,
    exercise: 0,
    exercise_group: 0,
    article: 0,
    video: 0,
    course: 0,
    errors: 0,
  }

  console.log('▶ Lade Serlo-Mathematik-Taxonomie ...')
  const root = await fetchSerlo()
  if (!root) {
    console.error('Keine Daten von Serlo erhalten.')
    process.exit(1)
  }

  console.log('▶ Mathematik-Subject sicherstellen ...')
  const subjectId = await ensureMathematikSubject(supabase)

  console.log('▶ Walke Taxonomie und importiere ...')
  await walkTaxonomy(supabase, root, subjectId, null, stats)

  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  IMPORT FERTIG')
  console.log('═══════════════════════════════════════════')
  console.log(`  Cluster importiert : ${stats.clusters}`)
  console.log(`  Exercises          : ${stats.exercise}`)
  console.log(`  Articles           : ${stats.article}`)
  console.log(`  Videos             : ${stats.video}`)
  console.log(`  Fehler (geloggt)   : ${stats.errors}`)
  console.log('═══════════════════════════════════════════')
}

main().catch((err) => {
  console.error('Fataler Fehler:', err)
  process.exit(1)
})
