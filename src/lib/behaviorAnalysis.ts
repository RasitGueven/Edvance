import type {
  BehaviorAnalysis,
  BehaviorSnapshot,
  DiagnosisResult,
  MasterySignal,
  SkillLevelEntry,
} from '@/types/diagnosis'
import type { DiagnosisTask } from '@/types/diagnosis'

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

export function analyzeBehavior(snapshot: BehaviorSnapshot): BehaviorAnalysis {
  // ── confidence_score ─────────────────────────────────────────
  let confidence = 50
  if (snapshot.thinking_time_ms > 3000) confidence += 20
  if (snapshot.revision_count < 3) confidence += 15
  if (snapshot.task_duration_ms < 8000 && snapshot.answer_length < 10) confidence -= 20
  if (snapshot.hint_used && (snapshot.hint_request_time_ms ?? Infinity) < 5000) confidence -= 15

  // ── effort_score ─────────────────────────────────────────────
  let effort = 50
  if (snapshot.answer_length > 30) effort += 20
  if (snapshot.time_after_completion_ms > 2000) effort += 15
  if (snapshot.answer_length < 8) effort -= 20
  if (snapshot.rewrite_count > 2) effort -= 10

  // ── frustration_index ────────────────────────────────────────
  let frustration = 0
  if (snapshot.revision_count > 8) frustration += 30
  if (snapshot.rewrite_count > 1) frustration += 25
  if (snapshot.task_duration_ms > 180_000) frustration += 20
  if (
    snapshot.hint_used &&
    (snapshot.hint_request_time_ms ?? Infinity) < 5000 &&
    snapshot.coach_rating != null &&
    snapshot.coach_rating <= 2
  )
    frustration += 20

  confidence = clamp(confidence)
  effort = clamp(effort)
  frustration = clamp(frustration)

  // ── mastery_signal ───────────────────────────────────────────
  let mastery: MasterySignal
  if (snapshot.coach_rating != null && snapshot.coach_rating >= 3 && confidence > 65) {
    mastery = 'secure'
  } else if (snapshot.task_duration_ms < 10_000 && snapshot.answer_length < 8) {
    mastery = 'guessing'
  } else if (snapshot.coach_rating != null && snapshot.coach_rating <= 2 && effort > 40) {
    mastery = 'gap'
  } else {
    mastery = 'developing'
  }

  // ── flags ────────────────────────────────────────────────────
  const flags: string[] = []
  if (
    snapshot.hint_used &&
    snapshot.hint_request_time_ms != null &&
    snapshot.hint_request_time_ms < 5000
  )
    flags.push('Gibt schnell auf')
  if (snapshot.answer_length < 15) flags.push('Zeigt Rechenweg selten')
  if (snapshot.time_after_completion_ms > 3000) flags.push('Überprüft Ergebnisse')
  if (snapshot.task_duration_ms > 120_000) flags.push('Hohe Frustrationstoleranz')
  if (snapshot.revision_count > 6) flags.push('Unsicheres Schreibverhalten')
  if (snapshot.answer_length > 40) flags.push('Arbeitet strukturiert')

  return {
    confidence_score: confidence,
    effort_score: effort,
    frustration_index: frustration,
    mastery_signal: mastery,
    flags,
  }
}

// ── Aggregations ───────────────────────────────────────────────

export function aggregateOverallFlags(analyses: BehaviorAnalysis[]): string[] {
  const counts = new Map<string, number>()
  analyses.forEach(a => a.flags.forEach(f => counts.set(f, (counts.get(f) ?? 0) + 1)))
  // Flag wird "overall", wenn er in mind. 40% der Aufgaben auftaucht oder mind. 2x bei kleinem Set
  const threshold = Math.max(2, Math.ceil(analyses.length * 0.4))
  return [...counts.entries()]
    .filter(([, n]) => n >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([flag]) => flag)
}

export function averageMetrics(analyses: BehaviorAnalysis[]) {
  if (analyses.length === 0) {
    return { avgConfidence: 0, avgEffort: 0, avgFrustration: 0 }
  }
  const sum = analyses.reduce(
    (acc, a) => ({
      c: acc.c + a.confidence_score,
      e: acc.e + a.effort_score,
      f: acc.f + a.frustration_index,
    }),
    { c: 0, e: 0, f: 0 },
  )
  return {
    avgConfidence: Math.round(sum.c / analyses.length),
    avgEffort: Math.round(sum.e / analyses.length),
    avgFrustration: Math.round(sum.f / analyses.length),
  }
}

// Mastery-Signal pro Skill-Cluster → Level 1-10 (wir nehmen den Durchschnitt von rating + confidence)
export function deriveSkillLevels(
  tasks: DiagnosisTask[],
  snapshots: BehaviorSnapshot[],
  analyses: BehaviorAnalysis[],
): SkillLevelEntry[] {
  const byCluster = new Map<string, { sumLevel: number; n: number }>()
  tasks.forEach((task, idx) => {
    const snap = snapshots[idx]
    const ana = analyses[idx]
    if (!snap || !ana) return
    // Coach-Rating 1-4 → Level 1-10 mapping mit Confidence-Bonus
    const baseLevel = snap.coach_rating != null ? snap.coach_rating * 2 : 5
    const conf = ana.confidence_score / 100
    const level = clamp(Math.round(baseLevel + (conf - 0.5) * 4), 1, 10)
    const cur = byCluster.get(task.skill_cluster) ?? { sumLevel: 0, n: 0 }
    byCluster.set(task.skill_cluster, { sumLevel: cur.sumLevel + level, n: cur.n + 1 })
  })

  return [...byCluster.entries()].map(([cluster, { sumLevel, n }]) => {
    const level = Math.round(sumLevel / n)
    let label: SkillLevelEntry['label']
    if (level <= 3) label = 'Lücke'
    else if (level <= 6) label = 'Erkennbar'
    else label = 'Sicher'
    return { skill_cluster: cluster, level, label }
  })
}

// Empfehlung: 2 schwächste Skill-Cluster
export function recommendFocus(skillLevels: SkillLevelEntry[]): SkillLevelEntry[] {
  return [...skillLevels].sort((a, b) => a.level - b.level).slice(0, 2)
}

export function buildDiagnosisResult(args: {
  tasks: DiagnosisTask[]
  snapshots: BehaviorSnapshot[]
  studentName: string
  subject: string
  date: string
  coachNote: string
}): DiagnosisResult {
  const analyses = args.snapshots.map(s => analyzeBehavior(s))
  return {
    student_name: args.studentName,
    subject: args.subject,
    date: args.date,
    snapshots: args.snapshots,
    analyses,
    skill_levels: deriveSkillLevels(args.tasks, args.snapshots, analyses),
    overall_behavior_flags: aggregateOverallFlags(analyses),
    coach_note: args.coachNote,
  }
}
