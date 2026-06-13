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

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    thinking_time_ms: 2000,
    revision_count: 1,
    task_duration_ms: 5000,
    answer_length: 20,
    hint_used: false,
    hint_request_time_ms: null,
    time_after_completion_ms: 1000,
    rewrite_count: 0,
    coach_rating: null,
    ...overrides,
  }
}

// ── analyzeBehavior ────────────────────────────────────────────────────────────

describe('analyzeBehavior', () => {
  describe('confidence_score', () => {
    it('starts at 50 and clamps 0-100', () => {
      const result = analyzeBehavior(makeSnapshot())
      expect(result.confidence_score).toBeGreaterThanOrEqual(0)
      expect(result.confidence_score).toBeLessThanOrEqual(100)
    })

    it('increases when thinking time > 3s and few revisions', () => {
      const low = analyzeBehavior(makeSnapshot({ thinking_time_ms: 100, revision_count: 5 }))
      const high = analyzeBehavior(makeSnapshot({ thinking_time_ms: 5000, revision_count: 0 }))
      expect(high.confidence_score).toBeGreaterThan(low.confidence_score)
    })

    it('penalises quick answers with short text', () => {
      const snap = makeSnapshot({ task_duration_ms: 3000, answer_length: 5 })
      const result = analyzeBehavior(snap)
      // Base 50, -20 for short/quick → 30; no other bonuses
      expect(result.confidence_score).toBeLessThan(50)
    })

    it('penalises early hint use', () => {
      const withHint = analyzeBehavior(
        makeSnapshot({ hint_used: true, hint_request_time_ms: 2000 }),
      )
      const noHint = analyzeBehavior(makeSnapshot({ hint_used: false }))
      expect(withHint.confidence_score).toBeLessThan(noHint.confidence_score)
    })
  })

  describe('effort_score', () => {
    it('increases for long answers', () => {
      const high = analyzeBehavior(makeSnapshot({ answer_length: 50 }))
      const low = analyzeBehavior(makeSnapshot({ answer_length: 5 }))
      expect(high.effort_score).toBeGreaterThan(low.effort_score)
    })

    it('increases when student reviews after completion', () => {
      const checks = analyzeBehavior(makeSnapshot({ time_after_completion_ms: 5000 }))
      const noCheck = analyzeBehavior(makeSnapshot({ time_after_completion_ms: 500 }))
      expect(checks.effort_score).toBeGreaterThan(noCheck.effort_score)
    })

    it('penalises rewrites', () => {
      const rewrites = analyzeBehavior(makeSnapshot({ rewrite_count: 5 }))
      const clean = analyzeBehavior(makeSnapshot({ rewrite_count: 0 }))
      expect(rewrites.effort_score).toBeLessThan(clean.effort_score)
    })
  })

  describe('frustration_index', () => {
    it('is 0 for a normal, calm submission', () => {
      const result = analyzeBehavior(makeSnapshot())
      expect(result.frustration_index).toBe(0)
    })

    it('increases for many revisions', () => {
      const result = analyzeBehavior(makeSnapshot({ revision_count: 10 }))
      expect(result.frustration_index).toBeGreaterThan(0)
    })

    it('increases for long task duration', () => {
      const result = analyzeBehavior(makeSnapshot({ task_duration_ms: 200_000 }))
      expect(result.frustration_index).toBeGreaterThan(0)
    })
  })

  describe('mastery_signal', () => {
    it('is secure when coach_rating >= 3 and confidence > 65', () => {
      const snap = makeSnapshot({
        coach_rating: 4,
        thinking_time_ms: 5000,
        revision_count: 0,
      })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('secure')
    })

    it('is guessing for very short/fast answers', () => {
      const snap = makeSnapshot({ task_duration_ms: 3000, answer_length: 3 })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('guessing')
    })

    it('is gap when coach_rating <= 2 and effort > 40', () => {
      const snap = makeSnapshot({ coach_rating: 1, answer_length: 35 })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('gap')
    })

    it('defaults to developing', () => {
      const result = analyzeBehavior(makeSnapshot())
      expect(result.mastery_signal).toBe('developing')
    })
  })

  describe('flags', () => {
    it('adds "Gibt schnell auf" for early hint use', () => {
      const snap = makeSnapshot({ hint_used: true, hint_request_time_ms: 1000 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Gibt schnell auf')
    })

    it('adds "Überprüft Ergebnisse" when review time > 3s', () => {
      const snap = makeSnapshot({ time_after_completion_ms: 5000 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Überprüft Ergebnisse')
    })

    it('adds "Arbeitet strukturiert" for long answers', () => {
      const snap = makeSnapshot({ answer_length: 50 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Arbeitet strukturiert')
    })

    it('adds "Unsicheres Schreibverhalten" for many revisions', () => {
      const snap = makeSnapshot({ revision_count: 8 })
      const result = analyzeBehavior(snap)
      expect(result.flags).toContain('Unsicheres Schreibverhalten')
    })
  })
})

// ── aggregateOverallFlags ────────────────────────────────────────────────────

describe('aggregateOverallFlags', () => {
  it('returns empty array for no analyses', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('includes a flag that appears in >= 40% of analyses', () => {
    const analyses = Array.from({ length: 5 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: i < 3 ? ['Gibt schnell auf'] : [],
    }))
    const result = aggregateOverallFlags(analyses)
    expect(result).toContain('Gibt schnell auf')
  })

  it('excludes a flag that appears in < 40% of analyses', () => {
    const analyses = Array.from({ length: 10 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: i === 0 ? ['Gibt schnell auf'] : [],
    }))
    const result = aggregateOverallFlags(analyses)
    expect(result).not.toContain('Gibt schnell auf')
  })
})

// ── averageMetrics ────────────────────────────────────────────────────────────

describe('averageMetrics', () => {
  it('returns zeros for empty array', () => {
    expect(averageMetrics([])).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('computes correct averages', () => {
    const a1 = { confidence_score: 60, effort_score: 40, frustration_index: 10, mastery_signal: 'developing' as const, flags: [] }
    const a2 = { confidence_score: 80, effort_score: 60, frustration_index: 20, mastery_signal: 'secure' as const, flags: [] }
    const result = averageMetrics([a1, a2])
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(50)
    expect(result.avgFrustration).toBe(15)
  })
})

// ── deriveSkillLevels ─────────────────────────────────────────────────────────

describe('deriveSkillLevels', () => {
  it('returns an entry per skill cluster', () => {
    const tasks = [
      { skill_cluster: 'Algebra' } as any,
      { skill_cluster: 'Geometrie' } as any,
    ]
    const snaps = [
      makeSnapshot({ coach_rating: 4 }),
      makeSnapshot({ coach_rating: 2 }),
    ]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result.map(e => e.skill_cluster)).toContain('Algebra')
    expect(result.map(e => e.skill_cluster)).toContain('Geometrie')
  })

  it('assigns "Lücke" label for low-rated clusters', () => {
    const tasks = [{ skill_cluster: 'Zahlen' } as any]
    const snaps = [makeSnapshot({ coach_rating: 1 })]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result[0].label).toBe('Lücke')
  })

  it('assigns "Sicher" label for high-rated clusters', () => {
    const tasks = [{ skill_cluster: 'Stochastik' } as any]
    const snaps = [makeSnapshot({ coach_rating: 4, thinking_time_ms: 5000, revision_count: 0 })]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result[0].label).toBe('Sicher')
  })
})

// ── recommendFocus ────────────────────────────────────────────────────────────

describe('recommendFocus', () => {
  it('returns up to 2 weakest clusters', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
    ]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('B')
    expect(result[1].skill_cluster).toBe('C')
  })

  it('returns all clusters when fewer than 2', () => {
    const levels = [{ skill_cluster: 'A', level: 2, label: 'Lücke' as const }]
    expect(recommendFocus(levels)).toHaveLength(1)
  })
})

// ── buildDiagnosisResult ──────────────────────────────────────────────────────

describe('buildDiagnosisResult', () => {
  it('builds a valid result with analyses and skill levels', () => {
    const tasks = [{ skill_cluster: 'Algebra' } as any]
    const snaps = [makeSnapshot({ coach_rating: 3, thinking_time_ms: 4000 })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots: snaps,
      studentName: 'Tim Müller',
      subject: 'Mathematik',
      date: '2026-06-13',
      coachNote: 'Guter Fortschritt',
    })
    expect(result.student_name).toBe('Tim Müller')
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
    expect(result.coach_note).toBe('Guter Fortschritt')
  })
})
