import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  averageMetrics,
  recommendFocus,
} from '@/lib/behaviorAnalysis'
import type { BehaviorSnapshot } from '@/types/diagnosis'

function makeSnapshot(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 't1',
    thinking_time_ms: 1000,
    answer_length: 20,
    answer_text: 'Beispielantwort',
    revision_count: 1,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    time_after_completion_ms: 500,
    task_duration_ms: 30_000,
    coach_rating: null,
    ...overrides,
  }
}

describe('analyzeBehavior', () => {
  it('returns scores in 0–100 range', () => {
    const result = analyzeBehavior(makeSnapshot())
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('marks mastery as "secure" when coach_rating >= 3 and confidence > 65', () => {
    const snap = makeSnapshot({
      coach_rating: 4,
      thinking_time_ms: 4000,  // +20 confidence
      revision_count: 1,       // +15 confidence (< 3)
      // base 50 + 20 + 15 = 85 > 65
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('secure')
  })

  it('marks mastery as "guessing" for very fast, short answer', () => {
    const snap = makeSnapshot({
      task_duration_ms: 3000,  // < 10_000
      answer_length: 5,        // < 8
      coach_rating: null,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('guessing')
  })

  it('marks mastery as "gap" when coach_rating <= 2 and effort > 40', () => {
    const snap = makeSnapshot({
      coach_rating: 1,
      answer_length: 45,  // +20 effort, well above 40
      task_duration_ms: 30_000,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('gap')
  })

  it('flags "Gibt schnell auf" when hint used within 5 seconds', () => {
    const snap = makeSnapshot({
      hint_used: true,
      hint_request_time_ms: 3000,
    })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('flags "Überprüft Ergebnisse" when time_after_completion > 3000ms', () => {
    const snap = makeSnapshot({ time_after_completion_ms: 5000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('flags "Zeigt Rechenweg selten" when answer_length < 15', () => {
    const snap = makeSnapshot({ answer_length: 8 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Zeigt Rechenweg selten')
  })

  it('flags "Arbeitet strukturiert" when answer_length > 40', () => {
    const snap = makeSnapshot({ answer_length: 50 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('defaults to "developing" mastery for neutral snapshot', () => {
    const snap = makeSnapshot({
      task_duration_ms: 30_000,
      answer_length: 20,
      coach_rating: null,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('developing')
  })

  it('lowers confidence when hint used quickly', () => {
    const base = analyzeBehavior(makeSnapshot({ hint_used: false }))
    const withHint = analyzeBehavior(
      makeSnapshot({ hint_used: true, hint_request_time_ms: 2000 }),
    )
    expect(withHint.confidence_score).toBeLessThan(base.confidence_score)
  })

  it('raises frustration with many revisions', () => {
    const low = analyzeBehavior(makeSnapshot({ revision_count: 1 }))
    const high = analyzeBehavior(makeSnapshot({ revision_count: 10 }))
    expect(high.frustration_index).toBeGreaterThan(low.frustration_index)
  })
})

describe('averageMetrics', () => {
  it('returns zeros for empty array', () => {
    expect(averageMetrics([])).toEqual({
      avgConfidence: 0,
      avgEffort: 0,
      avgFrustration: 0,
    })
  })

  it('returns exact values for single analysis', () => {
    const snap = makeSnapshot({ thinking_time_ms: 4000, revision_count: 1, answer_length: 20 })
    const analysis = analyzeBehavior(snap)
    const result = averageMetrics([analysis])
    expect(result.avgConfidence).toBe(analysis.confidence_score)
    expect(result.avgEffort).toBe(analysis.effort_score)
    expect(result.avgFrustration).toBe(analysis.frustration_index)
  })

  it('computes rounded averages correctly', () => {
    const a1 = analyzeBehavior(makeSnapshot({ thinking_time_ms: 4000, revision_count: 1 }))
    const a2 = analyzeBehavior(makeSnapshot({ thinking_time_ms: 500, answer_length: 5 }))
    const result = averageMetrics([a1, a2])
    const expectedConf = Math.round((a1.confidence_score + a2.confidence_score) / 2)
    expect(result.avgConfidence).toBe(expectedConf)
  })
})

describe('recommendFocus', () => {
  it('returns the two weakest skill clusters', () => {
    const levels = [
      { skill_cluster: 'Algebra', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'Geometrie', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'Statistik', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'Zahlen', level: 1, label: 'Lücke' as const },
    ]
    const focus = recommendFocus(levels)
    expect(focus).toHaveLength(2)
    expect(focus[0].skill_cluster).toBe('Zahlen')
    expect(focus[1].skill_cluster).toBe('Geometrie')
  })

  it('returns all clusters if fewer than 2', () => {
    const levels = [{ skill_cluster: 'Algebra', level: 5, label: 'Erkennbar' as const }]
    expect(recommendFocus(levels)).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    expect(recommendFocus([])).toHaveLength(0)
  })
})
