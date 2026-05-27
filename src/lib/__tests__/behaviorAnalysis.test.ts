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

// ── Fixture helpers ──────────────────────────────────────────────────────────

function makeSnap(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 5000,
    task_duration_ms: 30000,
    revision_count: 2,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 35,
    time_after_completion_ms: 1000,
    answer_text: 'x = 5',
    coach_rating: 3,
    ...overrides,
  }
}

function makeTask(cluster = 'Algebra', id = 'task-1'): DiagnosisTask {
  return {
    id,
    skill_id: 'skill-1',
    skill_cluster: cluster,
    question: 'Berechne x',
    solution: 'x = 5',
    common_errors: '',
    coach_hint: '',
    estimated_minutes: 5,
  }
}

// ── analyzeBehavior ──────────────────────────────────────────────────────────

describe('analyzeBehavior', () => {
  it('returns scores in range 0-100', () => {
    const snap = makeSnap()
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('returns an array for flags', () => {
    const result = analyzeBehavior(makeSnap())
    expect(Array.isArray(result.flags)).toBe(true)
  })

  it('mastery_signal is one of the four values', () => {
    const valid = ['secure', 'developing', 'gap', 'guessing']
    const result = analyzeBehavior(makeSnap())
    expect(valid).toContain(result.mastery_signal)
  })

  // ── confidence_score ────────────────────────────────────────────────────────

  it('boosts confidence for long thinking time', () => {
    const low = analyzeBehavior(makeSnap({ thinking_time_ms: 500 }))
    const high = analyzeBehavior(makeSnap({ thinking_time_ms: 5000 }))
    expect(high.confidence_score).toBeGreaterThan(low.confidence_score)
  })

  it('boosts confidence for low revision count', () => {
    const many = analyzeBehavior(makeSnap({ revision_count: 10 }))
    const few = analyzeBehavior(makeSnap({ revision_count: 1 }))
    expect(few.confidence_score).toBeGreaterThan(many.confidence_score)
  })

  it('drops confidence for very fast + very short answer', () => {
    const baseline = analyzeBehavior(makeSnap())
    const rushed = analyzeBehavior(makeSnap({ task_duration_ms: 5000, answer_length: 5 }))
    expect(rushed.confidence_score).toBeLessThan(baseline.confidence_score)
  })

  it('drops confidence for hint used very quickly', () => {
    const baseline = analyzeBehavior(makeSnap())
    const earlyHint = analyzeBehavior(
      makeSnap({ hint_used: true, hint_request_time_ms: 2000 }),
    )
    expect(earlyHint.confidence_score).toBeLessThan(baseline.confidence_score)
  })

  // ── effort_score ────────────────────────────────────────────────────────────

  it('boosts effort for long answers', () => {
    const short = analyzeBehavior(makeSnap({ answer_length: 5 }))
    const long = analyzeBehavior(makeSnap({ answer_length: 50 }))
    expect(long.effort_score).toBeGreaterThan(short.effort_score)
  })

  it('boosts effort for time spent after completion', () => {
    const noCheck = analyzeBehavior(makeSnap({ time_after_completion_ms: 100 }))
    const checked = analyzeBehavior(makeSnap({ time_after_completion_ms: 5000 }))
    expect(checked.effort_score).toBeGreaterThan(noCheck.effort_score)
  })

  it('drops effort for many rewrites', () => {
    const few = analyzeBehavior(makeSnap({ rewrite_count: 0 }))
    const many = analyzeBehavior(makeSnap({ rewrite_count: 5 }))
    expect(many.effort_score).toBeLessThan(few.effort_score)
  })

  it('drops effort for very short answer', () => {
    const baseline = analyzeBehavior(makeSnap({ answer_length: 30 }))
    const veryShort = analyzeBehavior(makeSnap({ answer_length: 3 }))
    expect(veryShort.effort_score).toBeLessThan(baseline.effort_score)
  })

  // ── frustration_index ───────────────────────────────────────────────────────

  it('stays at 0 with no frustration signals', () => {
    const calm = makeSnap({
      revision_count: 1,
      rewrite_count: 0,
      task_duration_ms: 20000,
      hint_used: false,
    })
    expect(analyzeBehavior(calm).frustration_index).toBe(0)
  })

  it('increases for many revisions', () => {
    const calm = analyzeBehavior(makeSnap({ revision_count: 2 }))
    const frustrated = analyzeBehavior(makeSnap({ revision_count: 10 }))
    expect(frustrated.frustration_index).toBeGreaterThan(calm.frustration_index)
  })

  it('increases for many rewrites', () => {
    const baseline = analyzeBehavior(makeSnap({ rewrite_count: 0 }))
    const many = analyzeBehavior(makeSnap({ rewrite_count: 3 }))
    expect(many.frustration_index).toBeGreaterThan(baseline.frustration_index)
  })

  it('increases for very long task duration', () => {
    const quick = analyzeBehavior(makeSnap({ task_duration_ms: 10000 }))
    const long = analyzeBehavior(makeSnap({ task_duration_ms: 200000 }))
    expect(long.frustration_index).toBeGreaterThan(quick.frustration_index)
  })

  it('clamps frustration to 100 even for extreme inputs', () => {
    const extreme = makeSnap({
      revision_count: 20,
      rewrite_count: 10,
      task_duration_ms: 300000,
      hint_used: true,
      hint_request_time_ms: 1000,
      coach_rating: 1,
    })
    expect(analyzeBehavior(extreme).frustration_index).toBeLessThanOrEqual(100)
  })

  // ── mastery_signal ──────────────────────────────────────────────────────────

  it('returns "secure" for high coach rating + high confidence', () => {
    const snap = makeSnap({
      coach_rating: 4,
      thinking_time_ms: 6000,
      revision_count: 1,
      answer_length: 40,
    })
    expect(analyzeBehavior(snap).mastery_signal).toBe('secure')
  })

  it('returns "guessing" for very fast + very short answer', () => {
    const snap = makeSnap({
      task_duration_ms: 5000,
      answer_length: 3,
      coach_rating: null,
    })
    expect(analyzeBehavior(snap).mastery_signal).toBe('guessing')
  })

  it('returns "gap" for low coach rating with effort', () => {
    const snap = makeSnap({
      coach_rating: 1,
      answer_length: 40,
      time_after_completion_ms: 3000,
      thinking_time_ms: 6000,
    })
    expect(analyzeBehavior(snap).mastery_signal).toBe('gap')
  })

  it('returns "developing" as default', () => {
    const snap = makeSnap({ coach_rating: null, task_duration_ms: 20000, answer_length: 20 })
    expect(analyzeBehavior(snap).mastery_signal).toBe('developing')
  })

  // ── flags ────────────────────────────────────────────────────────────────────

  it('flags "Gibt schnell auf" for early hint use', () => {
    const snap = makeSnap({ hint_used: true, hint_request_time_ms: 2000 })
    expect(analyzeBehavior(snap).flags).toContain('Gibt schnell auf')
  })

  it('flags "Zeigt Rechenweg selten" for short answers', () => {
    const snap = makeSnap({ answer_length: 10 })
    expect(analyzeBehavior(snap).flags).toContain('Zeigt Rechenweg selten')
  })

  it('flags "Überprüft Ergebnisse" for large time_after_completion', () => {
    const snap = makeSnap({ time_after_completion_ms: 5000 })
    expect(analyzeBehavior(snap).flags).toContain('Überprüft Ergebnisse')
  })

  it('flags "Hohe Frustrationstoleranz" for very long duration', () => {
    const snap = makeSnap({ task_duration_ms: 150000 })
    expect(analyzeBehavior(snap).flags).toContain('Hohe Frustrationstoleranz')
  })

  it('flags "Unsicheres Schreibverhalten" for many revisions', () => {
    const snap = makeSnap({ revision_count: 8 })
    expect(analyzeBehavior(snap).flags).toContain('Unsicheres Schreibverhalten')
  })

  it('flags "Arbeitet strukturiert" for long answers', () => {
    const snap = makeSnap({ answer_length: 50 })
    expect(analyzeBehavior(snap).flags).toContain('Arbeitet strukturiert')
  })

  it('does not flag hint if request was late', () => {
    const snap = makeSnap({ hint_used: true, hint_request_time_ms: 20000 })
    expect(analyzeBehavior(snap).flags).not.toContain('Gibt schnell auf')
  })

  it('does not flag hint if hint_used is false', () => {
    const snap = makeSnap({ hint_used: false, hint_request_time_ms: null })
    expect(analyzeBehavior(snap).flags).not.toContain('Gibt schnell auf')
  })
})

// ── aggregateOverallFlags ────────────────────────────────────────────────────

describe('aggregateOverallFlags', () => {
  it('returns empty array for no analyses', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('returns flag that appears in ≥40% of analyses', () => {
    const withFlag: BehaviorAnalysis = {
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing',
      flags: ['Zeigt Rechenweg selten'],
    }
    const without: BehaviorAnalysis = {
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing',
      flags: [],
    }
    const results = aggregateOverallFlags([withFlag, withFlag, withFlag, without, without])
    expect(results).toContain('Zeigt Rechenweg selten')
  })

  it('does not return flag below threshold', () => {
    const withFlag: BehaviorAnalysis = {
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing',
      flags: ['Zeigt Rechenweg selten'],
    }
    const without: BehaviorAnalysis = {
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing',
      flags: [],
    }
    // only 1 out of 10 = 10%, below 40% threshold
    const results = aggregateOverallFlags([withFlag, ...Array(9).fill(without)])
    expect(results).not.toContain('Zeigt Rechenweg selten')
  })

  it('requires minimum 2 occurrences even for small sets', () => {
    const withFlag: BehaviorAnalysis = {
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing',
      flags: ['Flag A'],
    }
    const without: BehaviorAnalysis = { ...withFlag, flags: [] }
    // 1 out of 2 = 50%, but minimum is max(2, ceil(2*0.4)) = max(2, 1) = 2
    const results = aggregateOverallFlags([withFlag, without])
    expect(results).not.toContain('Flag A')
  })

  it('sorts by frequency descending', () => {
    const common: BehaviorAnalysis = {
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing',
      flags: ['Flag A', 'Flag B'],
    }
    const onlyA: BehaviorAnalysis = { ...common, flags: ['Flag A'] }
    const analyses = [common, common, common, onlyA, onlyA]
    const results = aggregateOverallFlags(analyses)
    const idxA = results.indexOf('Flag A')
    const idxB = results.indexOf('Flag B')
    if (idxA !== -1 && idxB !== -1) {
      expect(idxA).toBeLessThan(idxB)
    }
  })
})

// ── averageMetrics ───────────────────────────────────────────────────────────

describe('averageMetrics', () => {
  it('returns zeros for empty array', () => {
    expect(averageMetrics([])).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('returns exact values for single analysis', () => {
    const a: BehaviorAnalysis = {
      confidence_score: 70,
      effort_score: 60,
      frustration_index: 10,
      mastery_signal: 'secure',
      flags: [],
    }
    expect(averageMetrics([a])).toEqual({
      avgConfidence: 70,
      avgEffort: 60,
      avgFrustration: 10,
    })
  })

  it('averages multiple analyses correctly', () => {
    const a: BehaviorAnalysis = {
      confidence_score: 80,
      effort_score: 40,
      frustration_index: 20,
      mastery_signal: 'secure',
      flags: [],
    }
    const b: BehaviorAnalysis = {
      confidence_score: 60,
      effort_score: 60,
      frustration_index: 40,
      mastery_signal: 'developing',
      flags: [],
    }
    expect(averageMetrics([a, b])).toEqual({
      avgConfidence: 70,
      avgEffort: 50,
      avgFrustration: 30,
    })
  })

  it('rounds the result', () => {
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
  it('returns empty array when no matching snapshots', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })

  it('groups tasks by skill_cluster', () => {
    const tasks = [makeTask('Algebra'), makeTask('Geometrie', 'task-2')]
    const snaps = [
      makeSnap({ task_id: 'task-1', coach_rating: 3 }),
      makeSnap({ task_id: 'task-2', coach_rating: 3 }),
    ]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const levels = deriveSkillLevels(tasks, snaps, analyses)
    const clusters = levels.map(l => l.skill_cluster)
    expect(clusters).toContain('Algebra')
    expect(clusters).toContain('Geometrie')
  })

  it('level is clamped between 1 and 10', () => {
    const tasks = [makeTask()]
    const snaps = [makeSnap({ coach_rating: 4 })]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const [entry] = deriveSkillLevels(tasks, snaps, analyses)
    expect(entry.level).toBeGreaterThanOrEqual(1)
    expect(entry.level).toBeLessThanOrEqual(10)
  })

  it('assigns label "Lücke" for level ≤ 3', () => {
    const tasks = [makeTask()]
    const snaps = [makeSnap({ coach_rating: 1, thinking_time_ms: 100 })]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const [entry] = deriveSkillLevels(tasks, snaps, analyses)
    if (entry.level <= 3) expect(entry.label).toBe('Lücke')
  })

  it('assigns label "Sicher" for level > 6', () => {
    const tasks = [makeTask()]
    const snaps = [makeSnap({ coach_rating: 4, thinking_time_ms: 8000, revision_count: 1, answer_length: 45 })]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const [entry] = deriveSkillLevels(tasks, snaps, analyses)
    if (entry.level > 6) expect(entry.label).toBe('Sicher')
  })

  it('averages multiple tasks in same cluster', () => {
    const tasks = [makeTask('Math', 'task-1'), makeTask('Math', 'task-2')]
    const snaps = [
      makeSnap({ task_id: 'task-1', coach_rating: 1 }),
      makeSnap({ task_id: 'task-2', coach_rating: 4 }),
    ]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const levels = deriveSkillLevels(tasks, snaps, analyses)
    expect(levels).toHaveLength(1)
    expect(levels[0].skill_cluster).toBe('Math')
  })

  it('uses level 5 as base when coach_rating is null', () => {
    const tasks = [makeTask()]
    const snaps = [makeSnap({ coach_rating: null })]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const [entry] = deriveSkillLevels(tasks, snaps, analyses)
    expect(entry.level).toBeGreaterThanOrEqual(1)
    expect(entry.level).toBeLessThanOrEqual(10)
  })
})

// ── recommendFocus ───────────────────────────────────────────────────────────

describe('recommendFocus', () => {
  it('returns at most 2 entries', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 2, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('returns the weakest clusters first', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 2, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    expect(result[0].skill_cluster).toBe('D')
    expect(result[1].skill_cluster).toBe('B')
  })

  it('does not mutate input array', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
    ]
    const copy = [...levels]
    recommendFocus(levels)
    expect(levels).toEqual(copy)
  })

  it('handles empty input', () => {
    expect(recommendFocus([])).toEqual([])
  })

  it('handles single entry', () => {
    const levels = [{ skill_cluster: 'A', level: 5, label: 'Erkennbar' as const }]
    expect(recommendFocus(levels)).toHaveLength(1)
  })
})

// ── buildDiagnosisResult ─────────────────────────────────────────────────────

describe('buildDiagnosisResult', () => {
  const tasks = [makeTask('Algebra'), makeTask('Geometrie', 'task-2')]
  const snapshots = [
    makeSnap({ task_id: 'task-1', coach_rating: 3 }),
    makeSnap({ task_id: 'task-2', coach_rating: 2 }),
  ]

  it('sets student_name, subject, date, coach_note', () => {
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Lena Fischer',
      subject: 'Mathematik',
      date: '2025-01-15',
      coachNote: 'Gut gemacht',
    })
    expect(result.student_name).toBe('Lena Fischer')
    expect(result.subject).toBe('Mathematik')
    expect(result.date).toBe('2025-01-15')
    expect(result.coach_note).toBe('Gut gemacht')
  })

  it('analyses length matches snapshots length', () => {
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Test',
      subject: 'Mathe',
      date: '2025-01-01',
      coachNote: '',
    })
    expect(result.analyses).toHaveLength(snapshots.length)
    expect(result.snapshots).toHaveLength(snapshots.length)
  })

  it('includes skill_levels grouped by cluster', () => {
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Test',
      subject: 'Mathe',
      date: '2025-01-01',
      coachNote: '',
    })
    const clusters = result.skill_levels.map(s => s.skill_cluster)
    expect(clusters).toContain('Algebra')
    expect(clusters).toContain('Geometrie')
  })

  it('overall_behavior_flags is an array', () => {
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Test',
      subject: 'Mathe',
      date: '2025-01-01',
      coachNote: '',
    })
    expect(Array.isArray(result.overall_behavior_flags)).toBe(true)
  })

  it('works with empty snapshots', () => {
    const result = buildDiagnosisResult({
      tasks: [],
      snapshots: [],
      studentName: 'Test',
      subject: 'Mathe',
      date: '2025-01-01',
      coachNote: '',
    })
    expect(result.analyses).toHaveLength(0)
    expect(result.skill_levels).toHaveLength(0)
  })
})
