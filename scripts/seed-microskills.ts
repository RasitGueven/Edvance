// Seed: Mikroskills + zugehoerige Cluster fuer Mathematik Klasse 8.
//
// Nutzung (empfohlen):
//   npm run seed:skills
// Manuell:
//   npx tsx --env-file=.env scripts/seed-microskills.ts
//
// Idempotent: bereits vorhandene Cluster (Match via subject_id+name) und
// Microskills (Match via code) werden uebersprungen, nicht doppelt angelegt.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const CLASS_LEVEL = 8

type SkillSpec = { code: string; name: string }
type ClusterSpec = { cluster: string; skills: SkillSpec[] }

const SEED: ClusterSpec[] = [
  {
    cluster: 'Rationale Zahlen',
    skills: [
      { code: 'M8.RZ.01', name: 'Negative Zahlen verstehen' },
      { code: 'M8.RZ.02', name: 'Addition und Subtraktion negativer Zahlen' },
      { code: 'M8.RZ.03', name: 'Multiplikation und Division negativer Zahlen' },
      { code: 'M8.RZ.04', name: 'Gemischte Rechenoperationen mit rationalen Zahlen' },
    ],
  },
  {
    cluster: 'Terme & Gleichungen',
    skills: [
      { code: 'M8.TG.01', name: 'Terme aufstellen und vereinfachen' },
      { code: 'M8.TG.02', name: 'Distributivgesetz anwenden' },
      { code: 'M8.TG.03', name: 'Lineare Gleichungen lösen' },
      { code: 'M8.TG.04', name: 'Gleichungen mit Klammern' },
      { code: 'M8.TG.05', name: 'Textaufgaben in Gleichungen übersetzen' },
    ],
  },
  {
    cluster: 'Proportionalität',
    skills: [
      { code: 'M8.PR.01', name: 'Direkte Proportionalität erkennen' },
      { code: 'M8.PR.02', name: 'Dreisatz anwenden' },
      { code: 'M8.PR.03', name: 'Antiproportionalität' },
    ],
  },
  {
    cluster: 'Prozentrechnung',
    skills: [
      { code: 'M8.PZ.01', name: 'Prozentwert berechnen' },
      { code: 'M8.PZ.02', name: 'Grundwert berechnen' },
      { code: 'M8.PZ.03', name: 'Prozentsatz berechnen' },
      { code: 'M8.PZ.04', name: 'Rabatt und Aufschlag' },
    ],
  },
  {
    cluster: 'Lineare Funktionen',
    skills: [
      { code: 'M8.LF.01', name: 'Funktion als Zuordnung verstehen' },
      { code: 'M8.LF.02', name: 'Funktionsgraph zeichnen' },
      { code: 'M8.LF.03', name: 'Steigung und y-Achsenabschnitt' },
      { code: 'M8.LF.04', name: 'Schnittpunkte berechnen' },
    ],
  },
]

type Stats = {
  clustersCreated: number
  clustersExisting: number
  skillsCreated: number
  skillsExisting: number
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
  name: string,
  subjectId: string,
  stats: Stats,
): Promise<string | null> {
  const { data: existing, error: selectError } = await supabase
    .from('skill_clusters')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('name', name)
    .maybeSingle()
  if (selectError) {
    console.error(`  ✗ Cluster select "${name}": ${selectError.message}`)
    stats.errors += 1
    return null
  }
  if (existing?.id) {
    stats.clustersExisting += 1
    console.log(`  • Cluster vorhanden: ${name}`)
    return existing.id as string
  }

  const { data: created, error: insertError } = await supabase
    .from('skill_clusters')
    .insert({
      subject_id: subjectId,
      name,
      class_level_min: CLASS_LEVEL,
      class_level_max: CLASS_LEVEL,
    })
    .select('id')
    .single()
  if (insertError) {
    console.error(`  ✗ Cluster insert "${name}": ${insertError.message}`)
    stats.errors += 1
    return null
  }
  stats.clustersCreated += 1
  console.log(`  ✓ Cluster angelegt: ${name}`)
  return created.id as string
}

async function ensureMicroskill(
  supabase: SupabaseClient,
  clusterId: string,
  code: string,
  name: string,
  sortOrder: number,
  stats: Stats,
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('microskills')
    .select('id')
    .eq('code', code)
    .maybeSingle()
  if (selectError) {
    console.error(`    ✗ Microskill select "${code}": ${selectError.message}`)
    stats.errors += 1
    return
  }
  if (existing?.id) {
    stats.skillsExisting += 1
    return
  }

  const { error: insertError } = await supabase.from('microskills').insert({
    cluster_id: clusterId,
    code,
    name,
    class_level: CLASS_LEVEL,
    sort_order: sortOrder,
  })
  if (insertError) {
    console.error(`    ✗ Microskill insert "${code}": ${insertError.message}`)
    stats.errors += 1
    return
  }
  stats.skillsCreated += 1
  console.log(`    ✓ ${code} – ${name}`)
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

  const stats: Stats = {
    clustersCreated: 0,
    clustersExisting: 0,
    skillsCreated: 0,
    skillsExisting: 0,
    errors: 0,
  }

  console.log('▶ Mathematik-Subject sicherstellen ...')
  const subjectId = await ensureMathematikSubject(supabase)

  console.log('▶ Seede Cluster und Microskills (Klasse 8) ...')
  for (const { cluster, skills } of SEED) {
    const clusterId = await ensureCluster(supabase, cluster, subjectId, stats)
    if (!clusterId) continue
    let order = 0
    for (const { code, name } of skills) {
      await ensureMicroskill(supabase, clusterId, code, name, order, stats)
      order += 1
    }
  }

  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  SEED FERTIG')
  console.log('═══════════════════════════════════════════')
  console.log(`  Cluster neu angelegt : ${stats.clustersCreated}`)
  console.log(`  Cluster vorhanden    : ${stats.clustersExisting}`)
  console.log(`  Skills neu angelegt  : ${stats.skillsCreated}`)
  console.log(`  Skills vorhanden     : ${stats.skillsExisting}`)
  console.log(`  Fehler (geloggt)     : ${stats.errors}`)
  console.log('═══════════════════════════════════════════')
}

main().catch((err) => {
  console.error('Fataler Fehler:', err)
  process.exit(1)
})
