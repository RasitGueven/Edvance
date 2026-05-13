// Seed: Mikroskill-Taxonomie aus JSON in Supabase microskills.
//
// Nutzung:
//   npm run seed:taxonomy
// Manuell:
//   npx tsx --env-file=.env scripts/seed-taxonomy.ts
//
// Voraussetzungen:
//   - schema_content.sql + migration 001 (Cluster) + migration 005 (diagnostic fields)
//   - npm run seed:clusters (5 KMK-Bereiche existieren)
//
// Verhalten:
//   - Liest src/lib/taxonomy/nrw_math_klasse8.json
//   - Validiert via validateTaxonomy()
//   - Bei errors: Abbruch ohne Insert
//   - Pro Cluster: lookup via name → cluster_id; pro Mikroskill upsert via code
//   - prerequisite_topic_ids → prerequisite_ids (Mikroskill-UUIDs nach 2-Pass-Resolve)

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  summarize,
  validateTaxonomy,
  type RawMicroskill,
  type RawTaxonomy,
} from '../src/lib/taxonomy/validate.ts'

type Stats = {
  clustersResolved: number
  skillsCreated: number
  skillsUpdated: number
  prereqsLinked: number
  errors: number
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

  const taxonomyPath = resolve(process.cwd(), 'src/lib/taxonomy/nrw_math_klasse8.json')
  const raw = readFileSync(taxonomyPath, 'utf-8')
  const taxonomy = JSON.parse(raw) as RawTaxonomy

  console.log(`▶ Validiere Taxonomie ${taxonomyPath}`)
  const issues = validateTaxonomy(taxonomy)
  for (const issue of issues) {
    const tag = issue.severity === 'error' ? '✗' : '⚠'
    const where = issue.topic_id ? ` [${issue.topic_id}]` : ''
    console.log(`  ${tag}${where} ${issue.message}`)
  }
  const sum = summarize(issues)
  if (sum.errors > 0) {
    console.error(`\n${sum.errors} Fehler – Seed abgebrochen.`)
    process.exit(1)
  }
  console.log(`✓ ${sum.warnings} Warnung(en), 0 Fehler – fahre fort.\n`)

  const subjectId = await getMathSubjectId(supabase)
  const clusterByName = await loadClusterMap(supabase, subjectId)
  const stats: Stats = {
    clustersResolved: 0,
    skillsCreated: 0,
    skillsUpdated: 0,
    prereqsLinked: 0,
    errors: 0,
  }

  // PASS 1: alle Mikroskills upserten (ohne prerequisite_ids)
  const codeToId = new Map<string, string>()
  for (const cluster of taxonomy.competency_areas) {
    const clusterId = clusterByName[cluster.cluster_name]
    if (!clusterId) {
      console.error(`✗ Cluster "${cluster.cluster_name}" nicht in DB. Bitte seed:clusters laufen lassen.`)
      stats.errors += 1
      continue
    }
    stats.clustersResolved += 1
    console.log(`▶ Cluster "${cluster.cluster_name}" (${cluster.microskills.length} Mikroskills)`)
    for (const skill of cluster.microskills) {
      const id = await upsertMicroskill(supabase, clusterId, skill, taxonomy.grade, stats)
      if (id) codeToId.set(skill.topic_id, id)
    }
  }

  // PASS 2: prerequisite_ids als UUIDs nachtragen
  console.log('\n▶ Verknuepfe Vorbedingungen ...')
  for (const cluster of taxonomy.competency_areas) {
    for (const skill of cluster.microskills) {
      if (skill.prerequisite_topic_ids.length === 0) continue
      const ownId = codeToId.get(skill.topic_id)
      if (!ownId) continue
      const prereqUuids = skill.prerequisite_topic_ids
        .map((tid) => codeToId.get(tid))
        .filter((u): u is string => u != null)
      if (prereqUuids.length === 0) continue
      const { error } = await supabase
        .from('microskills')
        .update({ prerequisite_ids: prereqUuids })
        .eq('id', ownId)
      if (error) {
        console.error(`  ✗ prereq update "${skill.topic_id}": ${error.message}`)
        stats.errors += 1
        continue
      }
      stats.prereqsLinked += 1
    }
  }

  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  TAXONOMY SEED FERTIG')
  console.log('═══════════════════════════════════════════')
  console.log(`  Cluster aufgeloest      : ${stats.clustersResolved}`)
  console.log(`  Mikroskills neu         : ${stats.skillsCreated}`)
  console.log(`  Mikroskills aktualisiert: ${stats.skillsUpdated}`)
  console.log(`  Vorbedingungen verknuept: ${stats.prereqsLinked}`)
  console.log(`  Fehler (geloggt)        : ${stats.errors}`)
  console.log('═══════════════════════════════════════════')
}

async function getMathSubjectId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', 'Mathematik')
    .maybeSingle()
  if (error) throw new Error(`subjects select: ${error.message}`)
  if (!data?.id) throw new Error('Mathematik-Subject nicht gefunden – schema.sql ausfuehren.')
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
  return map
}

async function upsertMicroskill(
  supabase: SupabaseClient,
  clusterId: string,
  skill: RawMicroskill,
  grade: number,
  stats: Stats,
): Promise<string | null> {
  const payload = {
    cluster_id: clusterId,
    code: skill.topic_id,
    name: skill.topic_label,
    description: skill.description ?? null,
    class_level: grade,
    cognitive_type: skill.cognitive_type,
    estimated_minutes: skill.estimated_minutes,
    curriculum_ref: skill.curriculum_ref,
  }

  const { data: existing, error: selectError } = await supabase
    .from('microskills')
    .select('id')
    .eq('code', skill.topic_id)
    .maybeSingle()
  if (selectError) {
    console.error(`  ✗ select "${skill.topic_id}": ${selectError.message}`)
    stats.errors += 1
    return null
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('microskills')
      .update(payload)
      .eq('id', existing.id)
    if (updateError) {
      console.error(`  ✗ update "${skill.topic_id}": ${updateError.message}`)
      stats.errors += 1
      return null
    }
    stats.skillsUpdated += 1
    console.log(`    ↻ ${skill.topic_id} – ${skill.topic_label}`)
    return existing.id as string
  }

  const { data: created, error: insertError } = await supabase
    .from('microskills')
    .insert(payload)
    .select('id')
    .single()
  if (insertError) {
    console.error(`  ✗ insert "${skill.topic_id}": ${insertError.message}`)
    stats.errors += 1
    return null
  }
  stats.skillsCreated += 1
  console.log(`    ✓ ${skill.topic_id} – ${skill.topic_label}`)
  return created.id as string
}

main().catch((err) => {
  console.error('Fataler Fehler:', err)
  process.exit(1)
})
