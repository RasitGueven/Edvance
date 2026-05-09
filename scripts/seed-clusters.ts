// Seed: Die 5 KMK-Kompetenzbereiche fuer Mathematik (Kl. 8-10).
//
// Nutzung (empfohlen):
//   npm run seed:clusters
// Manuell:
//   npx tsx --env-file=.env scripts/seed-clusters.ts
//
// Idempotent: Cluster werden via (subject_id, name) gematched.
// Mikroskills werden hier NICHT geseedet – die kommen mit der spaeteren
// Makro/Mikro-Migration separat.
//
// Voraussetzung: schema_content.sql + migrations/001_competency_areas.sql
// sind im Supabase SQL Editor ausgefuehrt.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const CLASS_LEVEL_MIN = 8
const CLASS_LEVEL_MAX = 10

type ClusterSpec = { name: string; sortOrder: number }

const CLUSTERS: ClusterSpec[] = [
  { name: 'Zahl & Rechnen', sortOrder: 1 },
  { name: 'Algebra & Funktionen', sortOrder: 2 },
  { name: 'Geometrie & Messen', sortOrder: 3 },
  { name: 'Daten & Zufall', sortOrder: 4 },
  { name: 'Sachrechnen & Modellieren', sortOrder: 5 },
]

type Stats = {
  created: number
  existing: number
  errors: number
}

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
    .insert({ name: 'Mathematik' })
    .select('id')
    .single()
  if (insertError) throw new Error(`subjects insert: ${insertError.message}`)
  return created.id as string
}

async function ensureCluster(
  supabase: SupabaseClient,
  subjectId: string,
  spec: ClusterSpec,
  stats: Stats,
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('skill_clusters')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('name', spec.name)
    .maybeSingle()
  if (selectError) {
    console.error(`  ✗ Cluster select "${spec.name}": ${selectError.message}`)
    stats.errors += 1
    return
  }
  if (existing?.id) {
    stats.existing += 1
    console.log(`  • Cluster vorhanden: ${spec.name}`)
    return
  }

  const { error: insertError } = await supabase.from('skill_clusters').insert({
    subject_id: subjectId,
    name: spec.name,
    class_level_min: CLASS_LEVEL_MIN,
    class_level_max: CLASS_LEVEL_MAX,
    sort_order: spec.sortOrder,
  })
  if (insertError) {
    console.error(`  ✗ Cluster insert "${spec.name}": ${insertError.message}`)
    stats.errors += 1
    return
  }
  stats.created += 1
  console.log(`  ✓ Cluster angelegt: ${spec.name}`)
}

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

  const stats: Stats = { created: 0, existing: 0, errors: 0 }

  console.log('▶ Mathematik-Subject sicherstellen ...')
  const subjectId = await ensureMathematikSubject(supabase)

  console.log('▶ Seede 5 KMK-Kompetenzbereiche (Kl. 8-10) ...')
  for (const spec of CLUSTERS) {
    await ensureCluster(supabase, subjectId, spec, stats)
  }

  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  SEED FERTIG')
  console.log('═══════════════════════════════════════════')
  console.log(`  Cluster neu angelegt : ${stats.created}`)
  console.log(`  Cluster vorhanden    : ${stats.existing}`)
  console.log(`  Fehler (geloggt)     : ${stats.errors}`)
  console.log('═══════════════════════════════════════════')
}

main().catch((err) => {
  console.error('Fataler Fehler:', err)
  process.exit(1)
})
