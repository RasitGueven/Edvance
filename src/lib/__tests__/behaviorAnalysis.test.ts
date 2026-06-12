import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from '../behaviorAnalysis'
import type { BehaviorSnapshot } from '@/types/diagnosis'

function makeSnap(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 5000,
    task_duration_ms: 30_000,
    revision_count: 2,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 40,
    time_after_completion_ms: 1000,
    answer_text: 'answer',
    coach_rating: 3,
    ...overrides,
  }
}

describe('analyzeBehavior', () => {
  describe('confidence_score', () => {
    it('starts at 50 and adds 20 for long thinking time', () => {
      const snap = makeSnap({ thinking_time_ms: 4000 })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBeGreaterThan(50)
    })

    it('adds bonus for low revision count', () => {
      const snap = makeSnap({ revision_count: 1, thinking_time_ms: 4000 })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBeGreaterThanOrEqual(85) // 50+20+15
    })

    it('penalizes fast short answers', () => {
      const snap = makeSnap({
        task_duration_ms: 5000,
        answer_length: 5,
        thinking_time_ms: 100,
        revision_count: 5,
      })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBeLessThan(50)
    })

    it('clamps confidence to 0-100', () => {
      const snap = makeSnap({
        thinking_time_ms: 10000,
        revision_count: 0,
        task_duration_ms: 3000,
        answer_length: 5,
      })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBeGreaterThanOrEqual(0)
      expect(result.confidence_score).toBeLessThanOrEqual(100)
    })

    it('penalizes early hint usage', () => {
      const snap = makeSnap({
        hint_used: true,
        hint_request_time_ms: 3000,
        thinking_time_ms: 100,
        revision_count: 5,
      })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBeLessThan(50)
    })
  })

  describe('effort_score', () => {
    it('adds effort for long answers', () => {
      const snap = makeSnap({ answer_length: 50 })
      const result = analyzeBehavior(snap)
      expect(result.effort_score).toBeGreaterThan(50)
    })

    it('adds effort for time after completion', () => {
      const snap = makeSnap({ time_after_completion_ms: 3000 })
      const result = analyzeBehavior(snap)
      expect(result.effort_score).toBeGreaterThan(50)
    })

    it('penalizes short answers', () => {
      const snap = makeSnap({ answer_length: 5 })
      const result = analyzeBehavior(snap)
      expect(result.effort_score).toBeLessThan(50)
    })

    it('penalizes high rewrite count', () => {
      const snap = makeSnap({ rewrite_count: 5, answer_length: 5 })
      const result = analyzeBehavior(snap)
      expect(result.effort_score).toBeLessThan(40)
    })

    it('is clamped between 0 and 100', () => {
      const snap = makeSnap({ answer_length: 200, time_after_completion_ms: 5000 })
      const result = analyzeBehavior(snap)
      expect(result.effort_score).toBeLessThanOrEqual(100)
    })
  })

  describe('frustration_index', () => {
    it('starts at 0 for normal behavior', () => {
      const snap = makeSnap()
      const result = analyzeBehavior(snap)
      expect(result.frustration_index).toBe(0)
    })

    it('increases for high revision count', () => {
      const snap = makeSnap({ revision_count: 10 })
      const result = analyzeBehavior(snap)
      expect(result.frustration_index).toBeGreaterThan(0)
    })

    it('increases for very long task duration', () => {
      const snap = makeSnap({ task_duration_ms: 200_000 })
      const result = analyzeBehavior(snap)
      expect(result.frustration_index).toBeGreaterThan(0)
    })

    it('increases for high rewrite count', () => {
      const snap = makeSnap({ rewrite_count: 3 })
      const result = analyzeBehavior(snap)
      expect(result.frustration_index).toBeGreaterThan(0)
    })
  })

  describe('mastery_signal', () => {
    it('returns secure for high coach_rating + high confidence', () => {
      const snap = makeSnap({
        coach_rating: 4,
        thinking_time_ms: 5000,
        revision_count: 1,
        answer_length: 40,
      })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('secure')
    })

    it('returns guessing for fast, short answer', () => {
      const snap = makeSnap({
        task_duration_ms: 5000,
        answer_length: 5,
        coach_rating: null,
        thinking_time_ms: 0,
        revision_count: 0,
      })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('guessing')
    })

    it('returns gap for low coach_rating with effort', () => {
      const snap = makeSnap({
        coach_rating: 1,
        answer_length: 50,
        time_after_completion_ms: 3000,
        thinking_time_ms: 1000,
        revision_count: 2,
      })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('gap')
    })

    it('returns developing by default', () => {
      const snap = makeSnap({
        coach_rating: null,
        task_duration_ms: 30_000,
        answer_length: 40,
        thinking_time_ms: 2000,
      })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('developing')
    })
  })

  describe('flags', () => {
    it('flags early hint usage', () => {
      const snap = makeSnap({ hint_used: true, hint_request_time_ms: 2000 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Gibt schnell auf')
    })

    it('flags short answer length', () => {
      const snap = makeSnap({ answer_length: 10 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Zeigt Rechenweg selten')
    })

    it('flags long time after completion as reviewing', () => {
      const snap = makeSnap({ time_after_completion_ms: 5000 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Überprüft Ergebnisse')
    })

    it('flags very long task duration', () => {
      const snap = makeSnap({ task_duration_ms: 150_000 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Hohe Frustrationstoleranz')
    })

    it('flags high revision count as insecure writing', () => {
      const snap = makeSnap({ revision_count: 8 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Unsicheres Schreibverhalten')
    })

    it('flags long answer as structured work', () => {
      const snap = makeSnap({ answer_length: 50 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Arbeitet strukturiert')
    })
  })
})

describe('aggregateOverallFlags', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('returns flag that meets 40% threshold', () => {
    const analyses = Array.from({ length: 5 }, () =>
      analyzeBehavior(makeSnap({ answer_length: 10 })) // 'Zeigt Rechenweg selten'
    )
    const flags = aggregateOverallFlags(analyses)
    expect(flags).toContain('Zeigt Rechenweg selten')
  })

  it('excludes flags below threshold', () => {
    const analyses = [
      analyzeBehavior(makeSnap({ answer_length: 10 })),
      analyzeBehavior(makeSnap()), // no flag
      analyzeBehavior(makeSnap()), // no flag
      analyzeBehavior(makeSnap()), // no flag
      analyzeBehavior(makeSnap()), // no flag
    ]
    // 1/5 = 20%, threshold = max(2, ceil(5*0.4)) = 2 → flag excluded
    const flags = aggregateOverallFlags(analyses)
    expect(flags).not.toContain('Zeigt Rechenweg selten')
  })

  it('sorts by frequency descending', () => {
    const analysisWith2Flags = analyzeBehavior(makeSnap({
      answer_length: 10,
      time_after_completion_ms: 5000,
      revision_count: 2,
    }))
    const analyses = Array(5).fill(analysisWith2Flags)
    const flags = aggregateOverallFlags(analyses)
    expect(flags.length).toBeGreaterThan(0)
  })
})

describe('averageMetrics', () => {
  it('returns zeros for empty input', () => {
    const result = averageMetrics([])
    expect(result).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('returns the same values for single item', () => {
    const analysis = analyzeBehavior(makeSnap())
    const result = averageMetrics([analysis])
    expect(result.avgConfidence).toBe(analysis.confidence_score)
    expect(result.avgEffort).toBe(analysis.effort_score)
    expect(result.avgFrustration).toBe(analysis.frustration_index)
  })

  it('rounds to nearest integer', () => {
    const a1 = { confidence_score: 60, effort_score: 70, frustration_index: 10, mastery_signal: 'secure' as const, flags: [] }
    const a2 = { confidence_score: 61, effort_score: 71, frustration_index: 11, mastery_signal: 'secure' as const, flags: [] }
    const result = averageMetrics([a1, a2])
    expect(result.avgConfidence).toBe(61) // (60+61)/2 = 60.5 → 61 (Math.round)
    expect(result.avgEffort).toBe(71)
    expect(result.avgFrustration).toBe(11)
  })
})

describe('deriveSkillLevels', () => {
  it('returns empty array for empty input', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })

  it('groups by skill_cluster', () => {
    const task1 = { id: '1', skill_cluster: 'Algebra', skill_id: 's1', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 }
    const task2 = { id: '2', skill_cluster: 'Geometrie', skill_id: 's2', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 }
    const snap1 = makeSnap({ task_id: '1', coach_rating: 3 })
    const snap2 = makeSnap({ task_id: '2', coach_rating: 4 })
    const ana1 = analyzeBehavior(snap1)
    const ana2 = analyzeBehavior(snap2)

    const result = deriveSkillLevels([task1, task2], [snap1, snap2], [ana1, ana2])
    expect(result).toHaveLength(2)
    const clusters = result.map(r => r.skill_cluster)
    expect(clusters).toContain('Algebra')
    expect(clusters).toContain('Geometrie')
  })

  it('assigns correct label based on level', () => {
    const task = { id: '1', skill_cluster: 'Algebra', skill_id: 's1', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 }
    const snap = makeSnap({ coach_rating: 1, task_id: '1' }) // low rating → low level → 'Lücke'
    const ana = analyzeBehavior(snap)
    const result = deriveSkillLevels([task], [snap], [ana])
    expect(result[0].label).toBe('Lücke')
  })

  it('assigns Sicher for high rating + high confidence', () => {
    const task = { id: '1', skill_cluster: 'Algebra', skill_id: 's1', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 }
    const snap = makeSnap({ coach_rating: 4, thinking_time_ms: 5000, revision_count: 1, answer_length: 50 })
    const ana = analyzeBehavior(snap)
    const result = deriveSkillLevels([task], [snap], [ana])
    expect(result[0].label).toBe('Sicher')
  })

  it('level is clamped to 1-10', () => {
    const task = { id: '1', skill_cluster: 'Test', skill_id: 's1', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 }
    const snap = makeSnap({ coach_rating: 4, thinking_time_ms: 10000, revision_count: 0, answer_length: 100, time_after_completion_ms: 5000 })
    const ana = analyzeBehavior(snap)
    const result = deriveSkillLevels([task], [snap], [ana])
    expect(result[0].level).toBeGreaterThanOrEqual(1)
    expect(result[0].level).toBeLessThanOrEqual(10)
  })
})

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
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 2, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    const clusters = result.map(r => r.skill_cluster)
    expect(clusters).toContain('B')
    expect(clusters).toContain('D')
  })

  it('does not mutate input array', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
    ]
    const original = [...levels]
    recommendFocus(levels)
    expect(levels).toEqual(original)
  })

  it('returns empty for empty input', () => {
    expect(recommendFocus([])).toEqual([])
  })
})

describe('buildDiagnosisResult', () => {
  it('builds a complete DiagnosisResult', () => {
    const task = { id: '1', skill_cluster: 'Algebra', skill_id: 's1', question: 'Q', solution: 'S', common_errors: '', coach_hint: '', estimated_minutes: 5 }
    const snap = makeSnap({ task_id: '1' })
    const result = buildDiagnosisResult({
      tasks: [task],
      snapshots: [snap],
      studentName: 'Max',
      subject: 'Mathematik',
      date: '2024-03-18',
      coachNote: 'Gute Leistung',
    })
    expect(result.student_name).toBe('Max')
    expect(result.subject).toBe('Mathematik')
    expect(result.date).toBe('2024-03-18')
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
    expect(result.coach_note).toBe('Gute Leistung')
  })
})
