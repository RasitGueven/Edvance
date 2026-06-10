import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
} from '@/lib/behaviorAnalysis'
import type { BehaviorSnapshot, BehaviorAnalysis } from '@/types/diagnosis'
import type { DiagnosisTask } from '@/types/diagnosis'

function makeSnap(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    task_duration_ms: 30000,
    thinking_time_ms: 5000,
    revision_count: 1,
    rewrite_count: 0,
    answer_length: 25,
    time_after_completion_ms: 1000,
    hint_used: false,
    hint_request_time_ms: null,
    answer_text: 'answer',
    coach_rating: null,
    ...overrides,
  }
}

describe('analyzeBehavior', () => {
  describe('confidence_score', () => {
    it('starts at 50 as baseline', () => {
      // No modifiers triggered: thinking_time<=3000, revision>=3, duration>=8000 or length>=10
      const snap = makeSnap({
        thinking_time_ms: 1000,
        revision_count: 5,
        task_duration_ms: 20000,
        answer_length: 20,
      })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBe(50)
    })

    it('thinking_time_ms > 3000 adds 20', () => {
      const snap = makeSnap({
        thinking_time_ms: 4000,
        revision_count: 5,
        task_duration_ms: 20000,
        answer_length: 20,
      })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBe(70)
    })

    it('revision_count < 3 adds 15', () => {
      const snap = makeSnap({
        thinking_time_ms: 1000,
        revision_count: 2,
        task_duration_ms: 20000,
        answer_length: 20,
      })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBe(65)
    })

    it('thinking_time>3000 + revision<3 adds 35', () => {
      const snap = makeSnap({
        thinking_time_ms: 5000,
        revision_count: 1,
        task_duration_ms: 20000,
        answer_length: 20,
      })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBe(85)
    })

    it('fast + short answer reduces confidence by 20', () => {
      const snap = makeSnap({
        thinking_time_ms: 1000,
        revision_count: 5,
        task_duration_ms: 5000,  // < 8000
        answer_length: 5,         // < 10
      })
      const result = analyzeBehavior(snap)
      expect(result.confidence_score).toBe(30)
    })
  })

  describe('effort_score', () => {
    it('long answer (>30) increases effort', () => {
      const snap = makeSnap({ answer_length: 35 })
      const result = analyzeBehavior(snap)
      expect(result.effort_score).toBeGreaterThan(50)
    })

    it('short answer (<8) decreases effort', () => {
      const snap = makeSnap({ answer_length: 5, time_after_completion_ms: 0, rewrite_count: 0 })
      const result = analyzeBehavior(snap)
      expect(result.effort_score).toBeLessThan(50)
    })
  })

  describe('frustration_index', () => {
    it('revision_count > 8 adds 30', () => {
      const snap = makeSnap({ revision_count: 9 })
      const result = analyzeBehavior(snap)
      expect(result.frustration_index).toBeGreaterThanOrEqual(30)
    })

    it('rewrite_count > 1 adds 25', () => {
      const snap = makeSnap({ rewrite_count: 2 })
      const result = analyzeBehavior(snap)
      expect(result.frustration_index).toBeGreaterThanOrEqual(25)
    })

    it('frustration starts at 0 for normal snap', () => {
      const snap = makeSnap({
        revision_count: 1,
        rewrite_count: 0,
        task_duration_ms: 30000,
      })
      const result = analyzeBehavior(snap)
      expect(result.frustration_index).toBe(0)
    })
  })

  describe('mastery_signal', () => {
    it("'secure' when coach_rating>=3 and confidence>65", () => {
      const snap = makeSnap({
        coach_rating: 3,
        thinking_time_ms: 5000,  // +20 confidence
        revision_count: 1,        // +15 confidence → 85 > 65
        task_duration_ms: 20000,
        answer_length: 20,
      })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('secure')
    })

    it("'guessing' on fast+short answer (task<10000 && length<8)", () => {
      const snap = makeSnap({
        task_duration_ms: 5000,
        answer_length: 5,
        coach_rating: null,
      })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('guessing')
    })

    it("'gap' when coach_rating<=2 and effort>40", () => {
      // effort: base 50 + answer_length>30 → 70 > 40
      const snap = makeSnap({
        coach_rating: 2,
        answer_length: 35,
        task_duration_ms: 20000,
        answer_length: 35,
      })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('gap')
    })

    it("'developing' as fallback", () => {
      const snap = makeSnap({ coach_rating: null })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('developing')
    })
  })

  describe('flags', () => {
    it("'Gibt schnell auf' when hint used before 5000ms", () => {
      const snap = makeSnap({
        hint_used: true,
        hint_request_time_ms: 3000,
      })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Gibt schnell auf')
    })

    it("'Gibt schnell auf' not triggered when hint not used", () => {
      const snap = makeSnap({
        hint_used: false,
        hint_request_time_ms: 1000,
      })
      const result = analyzeBehavior(snap)
      expect(result.flags).not.toContain('Gibt schnell auf')
    })

    it("'Überprüft Ergebnisse' when time_after_completion_ms > 3000", () => {
      const snap = makeSnap({ time_after_completion_ms: 5000 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Überprüft Ergebnisse')
    })

    it("'Überprüft Ergebnisse' not triggered at 3000 or less", () => {
      const snap = makeSnap({ time_after_completion_ms: 3000 })
      const result = analyzeBehavior(snap)
      expect(result.flags).not.toContain('Überprüft Ergebnisse')
    })
  })
})

describe('aggregateOverallFlags', () => {
  it('empty analyses returns empty flags', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('flag in <40% of analyses (below min threshold) does not appear', () => {
    // threshold = max(2, ceil(5*0.4)) = 2, flag appearing only once → not included
    const analyses: BehaviorAnalysis[] = Array.from({ length: 5 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: i === 0 ? ['OnlyOnce'] : [],
    }))
    const result = aggregateOverallFlags(analyses)
    expect(result).not.toContain('OnlyOnce')
  })

  it('flag appearing >= threshold is included', () => {
    // 5 analyses, threshold=2; flag appears 2 times → included
    const analyses: BehaviorAnalysis[] = Array.from({ length: 5 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: i < 2 ? ['FreqFlag'] : [],
    }))
    const result = aggregateOverallFlags(analyses)
    expect(result).toContain('FreqFlag')
  })

  it('min threshold is 2 regardless of percentage', () => {
    // 3 analyses, 40% = 1.2 → ceil = 2; flag appearing once → not included
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: ['RareFlag'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [] },
    ]
    expect(aggregateOverallFlags(analyses)).not.toContain('RareFlag')
  })

  it('results are sorted by count descending', () => {
    const analyses: BehaviorAnalysis[] = Array.from({ length: 10 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: i < 8 ? ['FreqA'] : i < 5 ? ['FreqB'] : [],
    }))
    const result = aggregateOverallFlags(analyses)
    if (result.length >= 2) {
      // FreqA appears 8 times, should be first
      expect(result[0]).toBe('FreqA')
    }
  })
})

describe('averageMetrics', () => {
  it('empty array → all zeros', () => {
    const result = averageMetrics([])
    expect(result.avgConfidence).toBe(0)
    expect(result.avgEffort).toBe(0)
    expect(result.avgFrustration).toBe(0)
  })

  it('single analysis → same values', () => {
    const analyses: BehaviorAnalysis[] = [{
      confidence_score: 70,
      effort_score: 60,
      frustration_index: 10,
      mastery_signal: 'developing',
      flags: [],
    }]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(60)
    expect(result.avgFrustration).toBe(10)
  })

  it('correctly averages two analyses', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 60, effort_score: 50, frustration_index: 10, mastery_signal: 'developing', flags: [] },
      { confidence_score: 80, effort_score: 70, frustration_index: 30, mastery_signal: 'developing', flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(60)
    expect(result.avgFrustration).toBe(20)
  })

  it('rounds to nearest integer', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: [] },
      { confidence_score: 51, effort_score: 51, frustration_index: 1, mastery_signal: 'developing', flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(51)
    expect(result.avgEffort).toBe(51)
  })
})

describe('recommendFocus', () => {
  it('returns 2 weakest clusters sorted by level', () => {
    const levels = [
      { skill_cluster: 'A', level: 7, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 1, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('D')
    expect(result[1].skill_cluster).toBe('B')
  })

  it('returns fewer than 2 when fewer entries exist', () => {
    const levels = [{ skill_cluster: 'A', level: 3, label: 'Lücke' as const }]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(1)
  })

  it('empty array → empty result', () => {
    expect(recommendFocus([])).toEqual([])
  })
})
