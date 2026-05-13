// Diagnosetest-Generator nach PRD v1.1 (Algorithmus exakt 6 Steps).
//
// Input:  OnboardingData
// Output: { test, uncovered, warnings }
//
// Deterministisch via seed (mulberry32). Liest tasks/microskills/clusters
// aus Supabase. Tasks muessen is_diagnostic=true haben, sonst werden sie
// nicht beruecksichtigt.
//
// competency_level (1|2|3) wird aus difficulty (1-5) abgeleitet:
//   difficulty 1-2 → level 1, 3 → level 2, 4-5 → level 3

import { supabase } from '@/lib/supabase/client'
import type {
  CognitiveType,
  DiagnosticTask,
  DiagnosticTest,
  InputType,
  Microskill,
  OnboardingData,
  SkillCluster,
  Task,
} from '@/types'

const SUBJECT_MAP: Record<OnboardingData['subject'], string> = {
  MATH: 'Mathematik',
  GERMAN: 'Deutsch',
  ENGLISH: 'Englisch',
}

const TARGET_MIN_MINUTES = 16
const TARGET_MAX_MINUTES = 22
const REQUIRED_INPUT_TYPES: InputType[] = ['MC', 'STEPS', 'MATCHING']
const SEQUENCE_ORDER: InputType[] = ['MC', 'FREE_INPUT', 'STEPS', 'MATCHING', 'DRAW']
const COGNITIVE_PRIORITY: Record<CognitiveType, number> = {
  FACT: 1,
  TRANSFER: 2,
  ANALYSIS: 3,
}

export type GenerateOptions = {
  seed?: number
}

export type Pick = { task: Task; microskill: Microskill; cluster: SkillCluster }

export type GenerateResult = {
  test: DiagnosticTest
  uncovered: { topic_id: string; topic_label: string; reason: string }[]
  warnings: string[]
}

// ── Seeded RNG (mulberry32) ──────────────────────────────────────────────────

function makeRng(seed?: number): () => number {
  let s = (seed ?? Date.now()) | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickOne<T>(items: T[], rng: () => number): T | null {
  if (items.length === 0) return null
  const idx = Math.floor(rng() * items.length)
  return items[idx] ?? items[0] ?? null
}

// ── Difficulty <→ Competency Level Mapping ──────────────────────────────────

function difficultyToLevel(difficulty: number | null): 1 | 2 | 3 {
  if (difficulty == null) return 2
  if (difficulty <= 2) return 1
  if (difficulty === 3) return 2
  return 3
}

function levelDifficultyRange(level: 1 | 2 | 3): [number, number] {
  if (level === 1) return [1, 2]
  if (level === 2) return [3, 3]
  return [4, 5]
}

// ── STEP 2 – target_level Berechnung ─────────────────────────────────────────

function computeTargetLevel(
  microskillIds: Set<string>,
  onboarding: OnboardingData,
): 1 | 2 | 3 {
  let target: 1 | 2 | 3 = 2
  if (onboarding.last_grade_in_subject != null) {
    if (onboarding.last_grade_in_subject >= 4) target = 1
    else if (onboarding.last_grade_in_subject <= 2) target = 3
  }
  const weak = onboarding.known_weak_topics ?? []
  if (weak.some((tid) => microskillIds.has(tid))) target = 1
  return target
}

// ── DB Queries ──────────────────────────────────────────────────────────────

async function getSubjectId(subjectName: string): Promise<string | null> {
  const { data } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', subjectName)
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
}

async function getClustersForGrade(
  subjectId: string,
  grade: number,
): Promise<SkillCluster[]> {
  const { data } = await supabase
    .from('skill_clusters')
    .select('*')
    .eq('subject_id', subjectId)
    .lte('class_level_min', grade)
    .gte('class_level_max', grade)
    .order('sort_order', { ascending: true })
  return (data ?? []) as SkillCluster[]
}

async function getMicroskillsByCluster(clusterId: string): Promise<Microskill[]> {
  const { data } = await supabase
    .from('microskills')
    .select('*')
    .eq('cluster_id', clusterId)
    .order('sort_order', { ascending: true })
  return (data ?? []) as Microskill[]
}

async function getDiagnosticTasksForMicroskills(
  microskillIds: string[],
  level: 1 | 2 | 3,
): Promise<Task[]> {
  if (microskillIds.length === 0) return []
  const [minD, maxD] = levelDifficultyRange(level)
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .in('microskill_id', microskillIds)
    .eq('is_diagnostic', true)
    .eq('is_active', true)
    .gte('difficulty', minD)
    .lte('difficulty', maxD)
  return (data ?? []) as Task[]
}

// ── STEP 2 – Repraesentativ-Aufgabe pro Cluster ──────────────────────────────

async function pickRepresentativeForCluster(
  cluster: SkillCluster,
  microskills: Microskill[],
  onboarding: OnboardingData,
  rng: () => number,
): Promise<Pick | null> {
  const microskillIds = new Set(microskills.map((m) => m.code))
  const microskillUuids = microskills.map((m) => m.id)
  const target = computeTargetLevel(microskillIds, onboarding)

  // Bevorzuge target_level, dann ±1 als Fallback
  const tryLevels: (1 | 2 | 3)[] =
    target === 1 ? [1, 2] : target === 3 ? [3, 2] : [2, 1, 3]

  for (const level of tryLevels) {
    const tasks = await getDiagnosticTasksForMicroskills(microskillUuids, level)
    const chosen = pickOne(tasks, rng)
    if (chosen) {
      const microskill = microskills.find((m) => m.id === chosen.microskill_id)
      if (microskill) return { task: chosen, microskill, cluster }
    }
  }
  return null
}

// ── STEP 3 – Replacement nach Input-Type ─────────────────────────────────────

async function findReplacementByType(
  inputType: InputType,
  clusters: SkillCluster[],
  rng: () => number,
  alreadyPickedTaskIds: Set<string>,
): Promise<Pick | null> {
  for (const cluster of clusters) {
    const microskills = await getMicroskillsByCluster(cluster.id)
    if (microskills.length === 0) continue
    const microskillUuids = microskills.map((m) => m.id)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('microskill_id', microskillUuids)
      .eq('is_diagnostic', true)
      .eq('is_active', true)
      .eq('input_type', inputType)
    const candidates = ((data ?? []) as Task[]).filter((t) => !alreadyPickedTaskIds.has(t.id))
    const chosen = pickOne(candidates, rng)
    if (chosen) {
      const microskill = microskills.find((m) => m.id === chosen.microskill_id)
      if (microskill) return { task: chosen, microskill, cluster }
    }
  }
  return null
}

// ── STEP 4 – Filler bei Unter-Zeit ──────────────────────────────────────────

async function findFiller(
  clusters: SkillCluster[],
  level: 1 | 2 | 3,
  rng: () => number,
  alreadyPickedTaskIds: Set<string>,
): Promise<Pick | null> {
  for (const cluster of clusters) {
    const microskills = await getMicroskillsByCluster(cluster.id)
    if (microskills.length === 0) continue
    const microskillUuids = microskills.map((m) => m.id)
    const tasks = await getDiagnosticTasksForMicroskills(microskillUuids, level)
    const candidates = tasks.filter((t) => !alreadyPickedTaskIds.has(t.id))
    const chosen = pickOne(candidates, rng)
    if (chosen) {
      const microskill = microskills.find((m) => m.id === chosen.microskill_id)
      if (microskill) return { task: chosen, microskill, cluster }
    }
  }
  return null
}

function pickPriority(p: Pick): number {
  const ct = p.task.cognitive_type ?? p.microskill.cognitive_type ?? 'TRANSFER'
  return COGNITIVE_PRIORITY[ct]
}

function pickMinutes(p: Pick): number {
  return p.task.estimated_minutes ?? p.microskill.estimated_minutes ?? 3
}

// ── STEP 5 – Sequenzierung ──────────────────────────────────────────────────

function sequenceIndex(t: InputType | null): number {
  const i = SEQUENCE_ORDER.indexOf(t ?? 'STEPS')
  return i === -1 ? 99 : i
}

// ── Hauptfunktion ───────────────────────────────────────────────────────────

export async function generateDiagnosticTest(
  onboarding: OnboardingData,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const subjectName = SUBJECT_MAP[onboarding.subject]
  if (!subjectName) throw new Error(`Subject ${onboarding.subject} unbekannt`)
  const subjectId = await getSubjectId(subjectName)
  if (!subjectId) throw new Error(`Subject "${subjectName}" nicht in DB`)

  const rng = makeRng(options.seed)
  const warnings: string[] = []
  const uncovered: GenerateResult['uncovered'] = []

  // STEP 1 – Kernkompetenzen
  const clusters = await getClustersForGrade(subjectId, onboarding.grade)
  if (clusters.length === 0) {
    return {
      test: emptyTest(onboarding),
      uncovered: [],
      warnings: ['Keine Cluster fuer Subject + Grade gefunden.'],
    }
  }
  // Hinweis: Schulform-Filter (Gymnasium = alle, andere = Pflichtkompetenzen)
  // bleibt MVP: alle Cluster werden beruecksichtigt. PRD-Erweiterung folgt.

  // STEP 2 – pro Cluster eine Aufgabe
  const pickedTasks: Pick[] = []
  for (const cluster of clusters) {
    const microskills = await getMicroskillsByCluster(cluster.id)
    if (microskills.length === 0) {
      uncovered.push({
        topic_id: cluster.id,
        topic_label: cluster.name,
        reason: 'Keine Mikroskills im Cluster (seed:taxonomy laufen lassen).',
      })
      continue
    }
    const result = await pickRepresentativeForCluster(cluster, microskills, onboarding, rng)
    if (result) {
      pickedTasks.push(result)
    } else {
      uncovered.push({
        topic_id: cluster.id,
        topic_label: cluster.name,
        reason: 'Keine diagnostische Aufgabe gefunden (auch nicht im Fallback ±1).',
      })
    }
  }

  const pickedIds = new Set(pickedTasks.map((p) => p.task.id))

  // STEP 3 – Aufgabentypen-Mix (MC, STEPS, MATCHING als Pflicht)
  const presentTypes = new Set(
    pickedTasks.map((p) => p.task.input_type).filter((t): t is InputType => t != null),
  )
  for (const required of REQUIRED_INPUT_TYPES) {
    if (presentTypes.has(required)) continue
    const replacement = await findReplacementByType(required, clusters, rng, pickedIds)
    if (replacement) {
      pickedTasks.push(replacement)
      pickedIds.add(replacement.task.id)
      presentTypes.add(required)
    } else {
      warnings.push(`Pflicht-Inputtyp ${required} nicht in DB verfuegbar.`)
    }
  }
  // DRAW: 1 Aufgabe wenn Geometrie im Lehrplan
  const geoClusters = clusters.filter((c) => c.name.toLowerCase().includes('geometrie'))
  if (geoClusters.length > 0 && !presentTypes.has('DRAW')) {
    const draw = await findReplacementByType('DRAW', geoClusters, rng, pickedIds)
    if (draw) {
      pickedTasks.push(draw)
      pickedIds.add(draw.task.id)
    }
  }

  // STEP 4 – Zeitbudget (16-22 Min)
  let totalMin = pickedTasks.reduce((s, p) => s + pickMinutes(p), 0)
  while (totalMin > TARGET_MAX_MINUTES && pickedTasks.length > 1) {
    pickedTasks.sort((a, b) => pickPriority(a) - pickPriority(b))
    const removed = pickedTasks.shift()
    if (!removed) break
    totalMin -= pickMinutes(removed)
    warnings.push(
      `Aufgabe "${removed.task.title ?? removed.task.id}" wegen Zeitbudget (>${TARGET_MAX_MINUTES} Min) entfernt.`,
    )
  }
  let fillerGuard = 5
  while (totalMin < TARGET_MIN_MINUTES && fillerGuard > 0) {
    fillerGuard -= 1
    const filler = await findFiller(clusters, 1, rng, pickedIds)
    if (!filler) break
    pickedTasks.push(filler)
    pickedIds.add(filler.task.id)
    totalMin += pickMinutes(filler)
  }

  // STEP 5 – Sequenzierung
  const sequenced = [...pickedTasks].sort(
    (a, b) => sequenceIndex(a.task.input_type) - sequenceIndex(b.task.input_type),
  )

  // STEP 6 – DiagnosticTask bauen + Coach-Hints
  const tasks: DiagnosticTask[] = sequenced.map((p, i) => ({
    sequence: i + 1,
    task_id: p.task.id,
    topic_id: p.microskill.code,
    topic_label: p.microskill.name,
    input_type: p.task.input_type ?? 'FREE_INPUT',
    competency_level: difficultyToLevel(p.task.difficulty),
    estimated_minutes: pickMinutes(p),
    coach_hint:
      p.task.coach_note ?? p.task.hint ?? 'Achte auf Loesungsweg und Anzeichen von Unsicherheit.',
    typical_errors:
      p.task.typical_errors ??
      (p.task.common_errors ? p.task.common_errors.split(/\n+/).filter(Boolean) : []),
  }))

  const test: DiagnosticTest = {
    student_id: onboarding.student_id,
    subject: onboarding.subject,
    grade: onboarding.grade,
    generated_at: new Date().toISOString(),
    estimated_total_minutes: tasks.reduce((s, t) => s + t.estimated_minutes, 0),
    coverage: tasks.map((t) => ({
      topic_id: t.topic_id,
      topic_label: t.topic_label,
      task_id: t.task_id,
    })),
    tasks,
  }

  return { test, uncovered, warnings }
}

function emptyTest(onboarding: OnboardingData): DiagnosticTest {
  return {
    student_id: onboarding.student_id,
    subject: onboarding.subject,
    grade: onboarding.grade,
    generated_at: new Date().toISOString(),
    estimated_total_minutes: 0,
    coverage: [],
    tasks: [],
  }
}
