import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
} from '@/lib/behaviorAnalysis'
import type { BehaviorSnapshot } from '@/types/diagnosis'

const baseSnapshot: BehaviorSnapshot = {
  task_id: 'task-1',
  thinking_time_ms: 0,
  task_duration_ms: 10_000,
  revision_count: 5, // ≥ 3 → no confidence bonus, clean 50 baseline
  rewrite_count: 0,
  hint_used: false,
  hint_request_time_ms: null,
  answer_length: 20,
  time_after_completion_ms: 0,
  answer_text: 'Antwort',
  coach_rating: null,
}

describe('analyzeBehavior – confidence_score', () => {
  it('starts at baseline 50', () => {
    const result = analyzeBehavior(baseSnapshot)
    expect(result.confidence_score).toBe(50)
  })

  it('adds 20 for thinking_time_ms > 3000', () => {
    const snap = { ...baseSnapshot, thinking_time_ms: 4000 }
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThan(50)
  })

  it('adds 15 for revision_count < 3', () => {
    const snap = { ...baseSnapshot, revision_count: 1 }
    const result = analyzeBehavior(snap)
    // baseline 50 + 15 (low revision) = 65
    expect(result.confidence_score).toBe(65)
  })

  it('subtracts 20 for quick short answers', () => {
    const snap = { ...baseSnapshot, task_duration_ms: 5000, answer_length: 5 }
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeLessThan(50)
  })

  it('clamps confidence to [0, 100]', () => {
    const snap = {
      ...baseSnapshot,
      thinking_time_ms: 5000,
      revision_count: 1,
      task_duration_ms: 500,
      answer_length: 2,
      hint_used: true,
      hint_request_time_ms: 1000,
    }
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
  })
})

describe('analyzeBehavior – effort_score', () => {
  it('starts at baseline 50', () => {
    const result = analyzeBehavior(baseSnapshot)
    expect(result.effort_score).toBe(50)
  })

  it('adds 20 for answer_length > 30', () => {
    const snap = { ...baseSnapshot, answer_length: 35 }
    const result = analyzeBehavior(snap)
    expect(result.effort_score).toBe(70)
  })

  it('subtracts 20 for answer_length < 8', () => {
    const snap = { ...baseSnapshot, answer_length: 5 }
    const result = analyzeBehavior(snap)
    expect(result.effort_score).toBe(30)
  })

  it('adds 15 for time_after_completion_ms > 2000', () => {
    const snap = { ...baseSnapshot, time_after_completion_ms: 3000 }
    const result = analyzeBehavior(snap)
    expect(result.effort_score).toBe(65)
  })
})

describe('analyzeBehavior – frustration_index', () => {
  it('starts at 0 for calm student', () => {
    const result = analyzeBehavior(baseSnapshot)
    expect(result.frustration_index).toBe(0)
  })

  it('adds 30 for revision_count > 8', () => {
    const snap = { ...baseSnapshot, revision_count: 9 }
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBe(30)
  })

  it('adds 25 for rewrite_count > 1', () => {
    const snap = { ...baseSnapshot, rewrite_count: 2 }
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBe(25)
  })

  it('adds 20 for task_duration_ms > 180000', () => {
    const snap = { ...baseSnapshot, task_duration_ms: 200_000 }
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBe(20)
  })

  it('clamps frustration to 100', () => {
    const snap = {
      ...baseSnapshot,
      revision_count: 10,
      rewrite_count: 3,
      task_duration_ms: 200_000,
      hint_used: true,
      hint_request_time_ms: 1000,
      coach_rating: 1 as const,
    }
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })
})

describe('analyzeBehavior – mastery_signal', () => {
  it('returns "secure" for good coach rating + high confidence', () => {
    const snap = {
      ...baseSnapshot,
      thinking_time_ms: 5000,
      revision_count: 1,
      coach_rating: 4 as const,
    }
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('secure')
  })

  it('returns "guessing" for very fast short answers without coach rating', () => {
    const snap = { ...baseSnapshot, task_duration_ms: 3000, answer_length: 3 }
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('guessing')
  })

  it('returns "gap" for poor coach rating with decent effort', () => {
    const snap = {
      ...baseSnapshot,
      answer_length: 35,
      time_after_completion_ms: 3000,
      coach_rating: 1 as const,
    }
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('gap')
  })

  it('returns "developing" as fallback', () => {
    const result = analyzeBehavior(baseSnapshot)
    expect(result.mastery_signal).toBe('developing')
  })
})

describe('analyzeBehavior – flags', () => {
  it('flags "Gibt schnell auf" when hint requested early', () => {
    const snap = { ...baseSnapshot, hint_used: true, hint_request_time_ms: 2000 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('flags "Überprüft Ergebnisse" when reviewing long after completion', () => {
    const snap = { ...baseSnapshot, time_after_completion_ms: 4000 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('flags "Arbeitet strukturiert" for long answers', () => {
    const snap = { ...baseSnapshot, answer_length: 45 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('flags "Hohe Frustrationstoleranz" for very long duration', () => {
    const snap = { ...baseSnapshot, task_duration_ms: 130_000 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Hohe Frustrationstoleranz')
  })

  it('returns no flags for normal baseline snapshot', () => {
    const result = analyzeBehavior(baseSnapshot)
    expect(result.flags).toHaveLength(0)
  })
})

describe('aggregateOverallFlags', () => {
  it('returns flag when it appears in ≥ 40% of analyses', () => {
    const analyses = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['Arbeitet strukturiert'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['Arbeitet strukturiert'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: [] },
    ]
    const result = aggregateOverallFlags(analyses)
    expect(result).toContain('Arbeitet strukturiert')
  })

  it('excludes flag appearing in < 40% of analyses (below min-2 threshold)', () => {
    const analyses = Array.from({ length: 10 }, () => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: [],
    }))
    analyses[0].flags = ['Seltene Flag']
    const result = aggregateOverallFlags(analyses)
    expect(result).not.toContain('Seltene Flag')
  })

  it('returns empty array for empty input', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })
})

describe('averageMetrics', () => {
  it('computes correct averages', () => {
    const analyses = [
      { confidence_score: 60, effort_score: 70, frustration_index: 10, mastery_signal: 'developing' as const, flags: [] },
      { confidence_score: 80, effort_score: 50, frustration_index: 20, mastery_signal: 'secure' as const, flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(60)
    expect(result.avgFrustration).toBe(15)
  })

  it('returns zeros for empty input', () => {
    const result = averageMetrics([])
    expect(result).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })
})

describe('deriveSkillLevels', () => {
  const tasks = [
    { id: 't1', skill_id: 's1', skill_cluster: 'Algebra', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 },
    { id: 't2', skill_id: 's2', skill_cluster: 'Algebra', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 },
    { id: 't3', skill_id: 's3', skill_cluster: 'Geometrie', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 },
  ]

  const snaps = [
    { ...baseSnapshot, task_id: 't1', coach_rating: 4 as const },
    { ...baseSnapshot, task_id: 't2', coach_rating: 3 as const },
    { ...baseSnapshot, task_id: 't3', coach_rating: 1 as const },
  ]

  const analyses = snaps.map(s => analyzeBehavior(s))

  it('produces one entry per cluster', () => {
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result.map(r => r.skill_cluster).sort()).toEqual(['Algebra', 'Geometrie'])
  })

  it('assigns higher level to Algebra (high coach ratings)', () => {
    const result = deriveSkillLevels(tasks, snaps, analyses)
    const algebra = result.find(r => r.skill_cluster === 'Algebra')
    const geometrie = result.find(r => r.skill_cluster === 'Geometrie')
    expect(algebra!.level).toBeGreaterThan(geometrie!.level)
  })

  it('maps low-level cluster to "Lücke"', () => {
    const result = deriveSkillLevels(tasks, snaps, analyses)
    const geometrie = result.find(r => r.skill_cluster === 'Geometrie')
    expect(geometrie!.label).toBe('Lücke')
  })

  it('maps high-level cluster to "Sicher"', () => {
    const result = deriveSkillLevels(tasks, snaps, analyses)
    const algebra = result.find(r => r.skill_cluster === 'Algebra')
    expect(algebra!.label).toBe('Sicher')
  })
})

describe('recommendFocus', () => {
  it('returns the two weakest clusters', () => {
    const skillLevels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
    ]
    const result = recommendFocus(skillLevels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('B')
    expect(result[1].skill_cluster).toBe('C')
  })

  it('returns fewer than 2 if input has fewer than 2 entries', () => {
    const skillLevels = [{ skill_cluster: 'A', level: 5, label: 'Erkennbar' as const }]
    const result = recommendFocus(skillLevels)
    expect(result).toHaveLength(1)
  })
})
