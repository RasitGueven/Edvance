import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from '../behaviorAnalysis'
import type { BehaviorSnapshot, BehaviorAnalysis, DiagnosisTask } from '@/types/diagnosis'

// ── Factories ──────────────────────────────────────────────────

function snap(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 0,
    task_duration_ms: 5000,
    revision_count: 0,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 20,
    time_after_completion_ms: 0,
    answer_text: '',
    coach_rating: null,
    ...overrides,
  }
}

function analysis(overrides: Partial<BehaviorAnalysis> = {}): BehaviorAnalysis {
  return {
    confidence_score: 50,
    effort_score: 50,
    frustration_index: 0,
    mastery_signal: 'developing',
    flags: [],
    ...overrides,
  }
}

function task(overrides: Partial<DiagnosisTask> = {}): DiagnosisTask {
  return {
    id: 'task-1',
    skill_id: 'skill-1',
    skill_cluster: 'Zahlenraum',
    question: 'q',
    solution: 's',
    common_errors: '',
    coach_hint: '',
    estimated_minutes: 3,
    ...overrides,
  }
}

// ── analyzeBehavior ─────────────────────────────────────────────

describe('analyzeBehavior – confidence_score', () => {
  it('starts at 50 base', () => {
    const result = analyzeBehavior(snap())
    // No bonuses or penalties → base 50
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
  })

  it('adds 20 for thinking_time > 3000ms', () => {
    const a = analyzeBehavior(snap({ thinking_time_ms: 3001, revision_count: 10 }))
    const b = analyzeBehavior(snap({ thinking_time_ms: 1000, revision_count: 10 }))
    expect(a.confidence_score).toBeGreaterThan(b.confidence_score)
  })

  it('adds 15 for revision_count < 3', () => {
    const withFew = analyzeBehavior(snap({ revision_count: 1 }))
    const withMany = analyzeBehavior(snap({ revision_count: 5 }))
    expect(withFew.confidence_score).toBeGreaterThan(withMany.confidence_score)
  })

  it('subtracts 20 for very short task with short answer', () => {
    const quick = analyzeBehavior(snap({ task_duration_ms: 5000, answer_length: 5 }))
    const normal = analyzeBehavior(snap({ task_duration_ms: 20000, answer_length: 20 }))
    expect(quick.confidence_score).toBeLessThan(normal.confidence_score)
  })

  it('clamps confidence to 0-100', () => {
    const max = analyzeBehavior(snap({ thinking_time_ms: 9999, revision_count: 0 }))
    expect(max.confidence_score).toBeLessThanOrEqual(100)
    expect(max.confidence_score).toBeGreaterThanOrEqual(0)
  })
})

describe('analyzeBehavior – effort_score', () => {
  it('adds 20 for answer_length > 30', () => {
    const long = analyzeBehavior(snap({ answer_length: 50 }))
    const short = analyzeBehavior(snap({ answer_length: 10 }))
    expect(long.effort_score).toBeGreaterThan(short.effort_score)
  })

  it('adds 15 for time_after_completion > 2000', () => {
    const checked = analyzeBehavior(snap({ time_after_completion_ms: 3000 }))
    const unchecked = analyzeBehavior(snap({ time_after_completion_ms: 0 }))
    expect(checked.effort_score).toBeGreaterThan(unchecked.effort_score)
  })

  it('subtracts 20 for answer_length < 8', () => {
    const tiny = analyzeBehavior(snap({ answer_length: 5 }))
    const normal = analyzeBehavior(snap({ answer_length: 20 }))
    expect(tiny.effort_score).toBeLessThan(normal.effort_score)
  })
})

describe('analyzeBehavior – frustration_index', () => {
  it('is 0 for calm snapshot', () => {
    const result = analyzeBehavior(snap())
    expect(result.frustration_index).toBe(0)
  })

  it('adds 30 for high revision_count', () => {
    const a = analyzeBehavior(snap({ revision_count: 9 }))
    const b = analyzeBehavior(snap({ revision_count: 1 }))
    expect(a.frustration_index).toBeGreaterThan(b.frustration_index)
  })

  it('adds 25 for high rewrite_count', () => {
    const a = analyzeBehavior(snap({ rewrite_count: 2 }))
    expect(a.frustration_index).toBeGreaterThanOrEqual(25)
  })

  it('adds 20 for very long task duration', () => {
    const a = analyzeBehavior(snap({ task_duration_ms: 200_000 }))
    expect(a.frustration_index).toBeGreaterThanOrEqual(20)
  })

  it('clamps frustration to 0-100', () => {
    const worst = analyzeBehavior(
      snap({
        revision_count: 10,
        rewrite_count: 5,
        task_duration_ms: 300_000,
        hint_used: true,
        hint_request_time_ms: 1000,
        coach_rating: 1,
      }),
    )
    expect(worst.frustration_index).toBeLessThanOrEqual(100)
    expect(worst.frustration_index).toBeGreaterThanOrEqual(0)
  })
})

describe('analyzeBehavior – mastery_signal', () => {
  it('returns "secure" for high coach rating and confidence', () => {
    const result = analyzeBehavior(
      snap({ coach_rating: 4, thinking_time_ms: 5000, revision_count: 1 }),
    )
    expect(result.mastery_signal).toBe('secure')
  })

  it('returns "guessing" for very fast, very short answer', () => {
    const result = analyzeBehavior(snap({ task_duration_ms: 5000, answer_length: 3 }))
    expect(result.mastery_signal).toBe('guessing')
  })

  it('returns "gap" for low rating with enough effort', () => {
    const result = analyzeBehavior(snap({ coach_rating: 1, answer_length: 50 }))
    expect(result.mastery_signal).toBe('gap')
  })

  it('returns "developing" as default', () => {
    const result = analyzeBehavior(snap({ task_duration_ms: 30_000, answer_length: 25 }))
    expect(result.mastery_signal).toBe('developing')
  })
})

describe('analyzeBehavior – flags', () => {
  it('flags "Gibt schnell auf" for early hint request', () => {
    const result = analyzeBehavior(
      snap({ hint_used: true, hint_request_time_ms: 3000 }),
    )
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('flags "Überprüft Ergebnisse" for long post-completion time', () => {
    const result = analyzeBehavior(snap({ time_after_completion_ms: 5000 }))
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('flags "Arbeitet strukturiert" for long answer', () => {
    const result = analyzeBehavior(snap({ answer_length: 50 }))
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('flags "Zeigt Rechenweg selten" for short answer', () => {
    const result = analyzeBehavior(snap({ answer_length: 10 }))
    expect(result.flags).toContain('Zeigt Rechenweg selten')
  })

  it('flags "Hohe Frustrationstoleranz" for very long duration', () => {
    const result = analyzeBehavior(snap({ task_duration_ms: 150_000 }))
    expect(result.flags).toContain('Hohe Frustrationstoleranz')
  })

  it('flags "Unsicheres Schreibverhalten" for high revision count', () => {
    const result = analyzeBehavior(snap({ revision_count: 7 }))
    expect(result.flags).toContain('Unsicheres Schreibverhalten')
  })
})

// ── aggregateOverallFlags ───────────────────────────────────────

describe('aggregateOverallFlags', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('includes flag that meets 40% threshold', () => {
    const analyses = [
      analysis({ flags: ['A', 'B'] }),
      analysis({ flags: ['A'] }),
      analysis({ flags: ['A'] }),
      analysis({ flags: ['C'] }),
      analysis({ flags: ['C'] }),
    ]
    const overall = aggregateOverallFlags(analyses)
    expect(overall).toContain('A')
  })

  it('excludes flag below threshold', () => {
    const analyses = [
      analysis({ flags: ['Rare'] }),
      analysis({ flags: [] }),
      analysis({ flags: [] }),
      analysis({ flags: [] }),
      analysis({ flags: [] }),
      analysis({ flags: [] }),
    ]
    const overall = aggregateOverallFlags(analyses)
    expect(overall).not.toContain('Rare')
  })

  it('sorts by frequency descending', () => {
    const analyses = [
      analysis({ flags: ['B', 'A'] }),
      analysis({ flags: ['B', 'A'] }),
      analysis({ flags: ['B'] }),
    ]
    const overall = aggregateOverallFlags(analyses)
    expect(overall[0]).toBe('B')
  })

  it('applies min 2 threshold for small sets', () => {
    // 3 analyses, threshold = max(2, ceil(3*0.4)) = max(2,2) = 2
    const analyses = [
      analysis({ flags: ['X'] }),
      analysis({ flags: ['X'] }),
      analysis({ flags: ['Y'] }),
    ]
    const overall = aggregateOverallFlags(analyses)
    expect(overall).toContain('X')
    expect(overall).not.toContain('Y')
  })
})

// ── averageMetrics ──────────────────────────────────────────────

describe('averageMetrics', () => {
  it('returns zeros for empty input', () => {
    expect(averageMetrics([])).toEqual({
      avgConfidence: 0,
      avgEffort: 0,
      avgFrustration: 0,
    })
  })

  it('computes averages correctly', () => {
    const analyses: BehaviorAnalysis[] = [
      analysis({ confidence_score: 60, effort_score: 40, frustration_index: 10 }),
      analysis({ confidence_score: 80, effort_score: 60, frustration_index: 30 }),
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(50)
    expect(result.avgFrustration).toBe(20)
  })

  it('rounds to integer', () => {
    const analyses: BehaviorAnalysis[] = [
      analysis({ confidence_score: 33, effort_score: 50, frustration_index: 0 }),
      analysis({ confidence_score: 34, effort_score: 50, frustration_index: 0 }),
    ]
    const result = averageMetrics(analyses)
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
  })
})

// ── deriveSkillLevels ───────────────────────────────────────────

describe('deriveSkillLevels', () => {
  it('returns empty for empty inputs', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })

  it('maps coach_rating 4 + high confidence to "Sicher"', () => {
    const tasks = [task({ skill_cluster: 'Zahlen' })]
    const snaps = [snap({ coach_rating: 4, thinking_time_ms: 5000, revision_count: 1 })]
    const analyses = snaps.map(analyzeBehavior)
    const levels = deriveSkillLevels(tasks, snaps, analyses)
    expect(levels[0].label).toBe('Sicher')
    expect(levels[0].level).toBeGreaterThan(6)
  })

  it('maps coach_rating 1 + low confidence to "Lücke"', () => {
    const tasks = [task({ skill_cluster: 'Brüche' })]
    const snaps = [
      snap({ coach_rating: 1, task_duration_ms: 5000, answer_length: 5, revision_count: 0 }),
    ]
    const analyses = snaps.map(analyzeBehavior)
    const levels = deriveSkillLevels(tasks, snaps, analyses)
    expect(levels[0].label).toBe('Lücke')
  })

  it('groups tasks by skill_cluster', () => {
    const tasks = [
      task({ skill_cluster: 'A', id: '1' }),
      task({ skill_cluster: 'A', id: '2' }),
      task({ skill_cluster: 'B', id: '3' }),
    ]
    const snaps = [
      snap({ coach_rating: 3 }),
      snap({ coach_rating: 3 }),
      snap({ coach_rating: 2 }),
    ]
    const analyses = snaps.map(analyzeBehavior)
    const levels = deriveSkillLevels(tasks, snaps, analyses)
    expect(levels).toHaveLength(2)
    const clusters = levels.map(l => l.skill_cluster)
    expect(clusters).toContain('A')
    expect(clusters).toContain('B')
  })
})

// ── recommendFocus ──────────────────────────────────────────────

describe('recommendFocus', () => {
  it('returns 2 weakest clusters', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 1, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('D')
    expect(result[1].skill_cluster).toBe('B')
  })

  it('does not mutate input array', () => {
    const levels = [
      { skill_cluster: 'A', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'B', level: 7, label: 'Sicher' as const },
    ]
    const copy = [...levels]
    recommendFocus(levels)
    expect(levels).toEqual(copy)
  })

  it('returns all if fewer than 2', () => {
    const levels = [{ skill_cluster: 'Only', level: 4, label: 'Erkennbar' as const }]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(1)
  })
})

// ── buildDiagnosisResult ────────────────────────────────────────

describe('buildDiagnosisResult', () => {
  it('builds a complete diagnosis result', () => {
    const tasks = [task()]
    const snaps = [snap({ coach_rating: 3, thinking_time_ms: 4000, revision_count: 1 })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots: snaps,
      studentName: 'Anna Schmidt',
      subject: 'Mathematik',
      date: '2024-06-06',
      coachNote: 'Gut gemacht!',
    })
    expect(result.student_name).toBe('Anna Schmidt')
    expect(result.subject).toBe('Mathematik')
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
  })
})
