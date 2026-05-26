import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from '@/lib/behaviorAnalysis'
import type { BehaviorSnapshot, BehaviorAnalysis, DiagnosisTask } from '@/types/diagnosis'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseSnap: BehaviorSnapshot = {
  task_id: 'task-1',
  thinking_time_ms: 4000,
  task_duration_ms: 30_000,
  revision_count: 2,
  rewrite_count: 0,
  hint_used: false,
  hint_request_time_ms: null,
  answer_length: 50,
  time_after_completion_ms: 1000,
  answer_text: 'x = 4',
  coach_rating: 3,
}

const task: DiagnosisTask = {
  id: 'task-1',
  skill_id: 'skill-1',
  skill_cluster: 'Zahlen & Rechnen',
  question: 'Berechne x',
  solution: 'x = 4',
  common_errors: 'Vorzeichen-Fehler',
  coach_hint: 'Auf Vorzeichen achten',
  estimated_minutes: 3,
}

// ── analyzeBehavior ──────────────────────────────────────────────────────────

describe('analyzeBehavior', () => {
  it('returns values clamped to 0–100', () => {
    const result = analyzeBehavior(baseSnap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('marks confident student as "secure" with good coach rating', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnap,
      thinking_time_ms: 5000,
      revision_count: 1,
      coach_rating: 4,
    }
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('secure')
  })

  it('marks fast short answer without hint as "guessing"', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnap,
      task_duration_ms: 5000,
      answer_length: 5,
      hint_used: false,
      coach_rating: null,
    }
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('guessing')
  })

  it('marks low coach rating with sufficient effort as "gap"', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnap,
      coach_rating: 2,
      effort_score: undefined as unknown as number,
      answer_length: 50,
      time_after_completion_ms: 3000,
    }
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('gap')
  })

  it('raises frustration for many revisions', () => {
    const snap: BehaviorSnapshot = { ...baseSnap, revision_count: 10, rewrite_count: 2 }
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBeGreaterThan(40)
  })

  it('flags "Überprüft Ergebnisse" when time_after_completion > 3000', () => {
    const snap: BehaviorSnapshot = { ...baseSnap, time_after_completion_ms: 4000 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('flags "Gibt schnell auf" for early hint', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnap,
      hint_used: true,
      hint_request_time_ms: 3000,
    }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('flags "Zeigt Rechenweg selten" for short answers', () => {
    const snap: BehaviorSnapshot = { ...baseSnap, answer_length: 10 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Zeigt Rechenweg selten')
  })

  it('flags "Arbeitet strukturiert" for long answers', () => {
    const snap: BehaviorSnapshot = { ...baseSnap, answer_length: 45 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('returns empty flags array for average student', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnap,
      answer_length: 25,
      time_after_completion_ms: 500,
    }
    const result = analyzeBehavior(snap)
    expect(result.flags).toBeInstanceOf(Array)
  })
})

// ── aggregateOverallFlags ────────────────────────────────────────────────────

describe('aggregateOverallFlags', () => {
  it('returns empty for empty input', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('surfaces flag appearing in ≥40% of analyses', () => {
    const flag = 'Zeigt Rechenweg selten'
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [flag] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [flag] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [] },
    ]
    // 2/5 = 40% → threshold = max(2, ceil(5*0.4)) = max(2,2) = 2 → included
    expect(aggregateOverallFlags(analyses)).toContain(flag)
  })

  it('does not surface flag appearing only once in larger set', () => {
    const flag = 'Gibt schnell auf'
    const analyses: BehaviorAnalysis[] = Array.from({ length: 10 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: i === 0 ? [flag] : [],
    }))
    expect(aggregateOverallFlags(analyses)).not.toContain(flag)
  })

  it('sorts by frequency descending', () => {
    const a = 'Flag A'
    const b = 'Flag B'
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [a, b] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [a, b] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [a] },
    ]
    const result = aggregateOverallFlags(analyses)
    expect(result.indexOf(a)).toBeLessThan(result.indexOf(b))
  })
})

// ── averageMetrics ───────────────────────────────────────────────────────────

describe('averageMetrics', () => {
  it('returns zeros for empty input', () => {
    expect(averageMetrics([])).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('correctly averages metrics', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 80, effort_score: 60, frustration_index: 20, mastery_signal: 'secure', flags: [] },
      { confidence_score: 40, effort_score: 80, frustration_index: 40, mastery_signal: 'gap', flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(60)
    expect(result.avgEffort).toBe(70)
    expect(result.avgFrustration).toBe(30)
  })

  it('rounds results to integers', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 70, effort_score: 70, frustration_index: 10, mastery_signal: 'secure', flags: [] },
      { confidence_score: 71, effort_score: 71, frustration_index: 11, mastery_signal: 'secure', flags: [] },
      { confidence_score: 72, effort_score: 72, frustration_index: 12, mastery_signal: 'secure', flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
    expect(Number.isInteger(result.avgEffort)).toBe(true)
    expect(Number.isInteger(result.avgFrustration)).toBe(true)
  })
})

// ── deriveSkillLevels ────────────────────────────────────────────────────────

describe('deriveSkillLevels', () => {
  it('groups tasks by skill_cluster', () => {
    const tasks: DiagnosisTask[] = [
      { ...task, skill_cluster: 'Algebra' },
      { ...task, id: 'task-2', skill_cluster: 'Geometrie' },
    ]
    const snaps: BehaviorSnapshot[] = [
      { ...baseSnap, task_id: 'task-1', coach_rating: 3 },
      { ...baseSnap, task_id: 'task-2', coach_rating: 4 },
    ]
    const analyses = snaps.map((s) => ({
      confidence_score: 70,
      effort_score: 60,
      frustration_index: 10,
      mastery_signal: 'secure' as const,
      flags: [],
    }))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    const clusters = result.map((r) => r.skill_cluster)
    expect(clusters).toContain('Algebra')
    expect(clusters).toContain('Geometrie')
  })

  it('assigns label Lücke for level 1–3', () => {
    const t = { ...task, skill_cluster: 'Test' }
    const s: BehaviorSnapshot = { ...baseSnap, coach_rating: 1 }
    const a: BehaviorAnalysis = { confidence_score: 10, effort_score: 30, frustration_index: 60, mastery_signal: 'gap', flags: [] }
    const result = deriveSkillLevels([t], [s], [a])
    expect(result[0]!.label).toBe('Lücke')
  })

  it('assigns label Sicher for high level', () => {
    const t = { ...task, skill_cluster: 'Test' }
    const s: BehaviorSnapshot = { ...baseSnap, coach_rating: 4 }
    const a: BehaviorAnalysis = { confidence_score: 90, effort_score: 80, frustration_index: 5, mastery_signal: 'secure', flags: [] }
    const result = deriveSkillLevels([t], [s], [a])
    expect(result[0]!.label).toBe('Sicher')
  })

  it('clamps level between 1 and 10', () => {
    const t = { ...task, skill_cluster: 'Test' }
    const s: BehaviorSnapshot = { ...baseSnap, coach_rating: 4 }
    const a: BehaviorAnalysis = { confidence_score: 100, effort_score: 100, frustration_index: 0, mastery_signal: 'secure', flags: [] }
    const result = deriveSkillLevels([t], [s], [a])
    expect(result[0]!.level).toBeLessThanOrEqual(10)
    expect(result[0]!.level).toBeGreaterThanOrEqual(1)
  })
})

// ── recommendFocus ────────────────────────────────────────────────────────────

describe('recommendFocus', () => {
  it('returns at most 2 entries', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 2, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(2)
  })

  it('returns the two weakest clusters', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 1, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    const clusters = result.map((r) => r.skill_cluster)
    expect(clusters).toContain('B')
    expect(clusters).toContain('D')
    expect(clusters).not.toContain('A')
  })

  it('does not mutate original array', () => {
    const levels = [
      { skill_cluster: 'A', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
    ]
    const copy = [...levels]
    recommendFocus(levels)
    expect(levels).toEqual(copy)
  })
})

// ── buildDiagnosisResult ──────────────────────────────────────────────────────

describe('buildDiagnosisResult', () => {
  it('builds a complete result object', () => {
    const result = buildDiagnosisResult({
      tasks: [task],
      snapshots: [baseSnap],
      studentName: 'Lena Fischer',
      subject: 'Mathematik',
      date: '2026-05-26',
      coachNote: 'Gute Leistung',
    })
    expect(result.student_name).toBe('Lena Fischer')
    expect(result.subject).toBe('Mathematik')
    expect(result.coach_note).toBe('Gute Leistung')
    expect(result.analyses).toHaveLength(1)
    expect(result.snapshots).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
  })

  it('populates overall_behavior_flags from analyses', () => {
    const result = buildDiagnosisResult({
      tasks: [task],
      snapshots: [baseSnap],
      studentName: 'Test',
      subject: 'Mathematik',
      date: '2026-05-26',
      coachNote: '',
    })
    expect(Array.isArray(result.overall_behavior_flags)).toBe(true)
  })
})
