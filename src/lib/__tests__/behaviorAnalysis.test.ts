import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from '@/lib/behaviorAnalysis'
import type { BehaviorSnapshot } from '@/types/diagnosis'

function makeSnapshot(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 2000,
    task_duration_ms: 15000,
    revision_count: 2,
    rewrite_count: 0,
    answer_length: 20,
    hint_used: false,
    hint_request_time_ms: null,
    time_after_completion_ms: 500,
    coach_rating: null,
    ...overrides,
  }
}

describe('analyzeBehavior – confidence_score', () => {
  it('starts at 50 for neutral snapshot', () => {
    const result = analyzeBehavior(makeSnapshot())
    expect(result.confidence_score).toBe(50 + 15) // revision_count < 3 → +15
  })

  it('increases confidence for long thinking time', () => {
    const result = analyzeBehavior(makeSnapshot({ thinking_time_ms: 4000 }))
    expect(result.confidence_score).toBeGreaterThan(50)
  })

  it('decreases confidence for quick+short answer', () => {
    const result = analyzeBehavior(
      makeSnapshot({ task_duration_ms: 5000, answer_length: 5 }),
    )
    expect(result.confidence_score).toBeLessThan(65)
  })

  it('decreases confidence for early hint use', () => {
    const result = analyzeBehavior(
      makeSnapshot({ hint_used: true, hint_request_time_ms: 3000 }),
    )
    expect(result.confidence_score).toBeLessThan(65)
  })

  it('clamps confidence to 0–100', () => {
    const result = analyzeBehavior(
      makeSnapshot({
        thinking_time_ms: 10000,
        revision_count: 0,
        answer_length: 50,
        time_after_completion_ms: 3000,
      }),
    )
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
  })
})

describe('analyzeBehavior – effort_score', () => {
  it('increases effort for long answer', () => {
    const result = analyzeBehavior(makeSnapshot({ answer_length: 50 }))
    expect(result.effort_score).toBeGreaterThan(50)
  })

  it('increases effort for review time', () => {
    const result = analyzeBehavior(makeSnapshot({ time_after_completion_ms: 3000 }))
    expect(result.effort_score).toBeGreaterThan(50)
  })

  it('decreases effort for short answer', () => {
    const result = analyzeBehavior(makeSnapshot({ answer_length: 5 }))
    expect(result.effort_score).toBeLessThan(50)
  })

  it('decreases effort for high rewrite count', () => {
    const result = analyzeBehavior(makeSnapshot({ rewrite_count: 3 }))
    expect(result.effort_score).toBeLessThan(50)
  })
})

describe('analyzeBehavior – frustration_index', () => {
  it('is 0 for calm, smooth snapshot', () => {
    const result = analyzeBehavior(makeSnapshot())
    expect(result.frustration_index).toBe(0)
  })

  it('increases for many revisions', () => {
    const result = analyzeBehavior(makeSnapshot({ revision_count: 10 }))
    expect(result.frustration_index).toBeGreaterThan(0)
  })

  it('increases for very long task duration', () => {
    const result = analyzeBehavior(makeSnapshot({ task_duration_ms: 200_000 }))
    expect(result.frustration_index).toBeGreaterThan(0)
  })

  it('accumulates multiple frustration signals', () => {
    const result = analyzeBehavior(
      makeSnapshot({
        revision_count: 10,
        rewrite_count: 3,
        task_duration_ms: 200_000,
        hint_used: true,
        hint_request_time_ms: 3000,
        coach_rating: 1,
      }),
    )
    expect(result.frustration_index).toBeGreaterThan(50)
  })
})

describe('analyzeBehavior – mastery_signal', () => {
  it('returns "secure" for high coach rating + confidence', () => {
    const result = analyzeBehavior(
      makeSnapshot({
        coach_rating: 4,
        thinking_time_ms: 5000,
        revision_count: 0,
      }),
    )
    expect(result.mastery_signal).toBe('secure')
  })

  it('returns "guessing" for quick + very short answer', () => {
    const result = analyzeBehavior(
      makeSnapshot({ task_duration_ms: 3000, answer_length: 4 }),
    )
    expect(result.mastery_signal).toBe('guessing')
  })

  it('returns "gap" for low coach rating with sufficient effort', () => {
    const result = analyzeBehavior(
      makeSnapshot({
        coach_rating: 1,
        answer_length: 40,
        time_after_completion_ms: 3000,
      }),
    )
    expect(result.mastery_signal).toBe('gap')
  })

  it('returns "developing" as default', () => {
    const result = analyzeBehavior(makeSnapshot())
    expect(result.mastery_signal).toBe('developing')
  })
})

describe('analyzeBehavior – flags', () => {
  it('flags "Gibt schnell auf" for early hint use', () => {
    const result = analyzeBehavior(
      makeSnapshot({ hint_used: true, hint_request_time_ms: 2000 }),
    )
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('flags "Zeigt Rechenweg selten" for short answers', () => {
    const result = analyzeBehavior(makeSnapshot({ answer_length: 10 }))
    expect(result.flags).toContain('Zeigt Rechenweg selten')
  })

  it('flags "Überprüft Ergebnisse" for long post-completion time', () => {
    const result = analyzeBehavior(makeSnapshot({ time_after_completion_ms: 5000 }))
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('flags "Hohe Frustrationstoleranz" for very long duration', () => {
    const result = analyzeBehavior(makeSnapshot({ task_duration_ms: 130_000 }))
    expect(result.flags).toContain('Hohe Frustrationstoleranz')
  })

  it('flags "Unsicheres Schreibverhalten" for high revision count', () => {
    const result = analyzeBehavior(makeSnapshot({ revision_count: 7 }))
    expect(result.flags).toContain('Unsicheres Schreibverhalten')
  })

  it('flags "Arbeitet strukturiert" for long detailed answer', () => {
    const result = analyzeBehavior(makeSnapshot({ answer_length: 50 }))
    expect(result.flags).toContain('Arbeitet strukturiert')
  })
})

describe('aggregateOverallFlags', () => {
  it('returns empty array for no analyses', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('promotes flag appearing in ≥40% of analyses', () => {
    const analyses = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['A', 'B'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['A'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['A', 'C'] },
    ]
    const result = aggregateOverallFlags(analyses)
    expect(result).toContain('A')
  })

  it('does not promote rare flag appearing in < 40%', () => {
    const analyses = Array.from({ length: 10 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: i === 0 ? ['rare-flag'] : [],
    }))
    const result = aggregateOverallFlags(analyses)
    expect(result).not.toContain('rare-flag')
  })
})

describe('averageMetrics', () => {
  it('returns zeros for empty input', () => {
    expect(averageMetrics([])).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('returns correct averages', () => {
    const analyses = [
      { confidence_score: 60, effort_score: 40, frustration_index: 20, mastery_signal: 'developing' as const, flags: [] },
      { confidence_score: 80, effort_score: 60, frustration_index: 40, mastery_signal: 'developing' as const, flags: [] },
    ]
    expect(averageMetrics(analyses)).toEqual({ avgConfidence: 70, avgEffort: 50, avgFrustration: 30 })
  })

  it('rounds results to nearest integer', () => {
    const analyses = [
      { confidence_score: 60, effort_score: 61, frustration_index: 0, mastery_signal: 'developing' as const, flags: [] },
      { confidence_score: 61, effort_score: 60, frustration_index: 0, mastery_signal: 'developing' as const, flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
    expect(Number.isInteger(result.avgEffort)).toBe(true)
  })
})

describe('deriveSkillLevels', () => {
  it('returns empty array for no tasks', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })

  it('derives level and label per cluster', () => {
    const tasks = [{ skill_cluster: 'Algebra' } as never]
    const snapshots = [makeSnapshot({ coach_rating: 4 })]
    const analyses = snapshots.map((s) => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snapshots, analyses)
    expect(result).toHaveLength(1)
    expect(result[0].skill_cluster).toBe('Algebra')
    expect(result[0].level).toBeGreaterThan(0)
    expect(['Lücke', 'Erkennbar', 'Sicher']).toContain(result[0].label)
  })

  it('labels level ≤3 as Lücke', () => {
    const tasks = [{ skill_cluster: 'X' } as never]
    const snapshots = [makeSnapshot({ coach_rating: 1 })]
    const analyses = [{ confidence_score: 5, effort_score: 30, frustration_index: 40, mastery_signal: 'gap' as const, flags: [] }]
    const result = deriveSkillLevels(tasks, snapshots, analyses)
    expect(result[0].label).toBe('Lücke')
  })
})

describe('recommendFocus', () => {
  it('returns the 2 weakest clusters', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 1, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('D')
    expect(result[1].skill_cluster).toBe('B')
  })

  it('returns all if fewer than 2', () => {
    const levels = [{ skill_cluster: 'A', level: 5, label: 'Erkennbar' as const }]
    expect(recommendFocus(levels)).toHaveLength(1)
  })
})

describe('buildDiagnosisResult', () => {
  it('builds a full DiagnosisResult structure', () => {
    const snapshots = [makeSnapshot({ coach_rating: 3 })]
    const tasks = [{ skill_cluster: 'Geometrie' } as never]
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Lena Müller',
      subject: 'Mathematik',
      date: '2024-06-01',
      coachNote: 'Gute Arbeit',
    })
    expect(result.student_name).toBe('Lena Müller')
    expect(result.subject).toBe('Mathematik')
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
    expect(result.coach_note).toBe('Gute Arbeit')
  })
})
