import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from '@/lib/behaviorAnalysis'
import type { BehaviorSnapshot, DiagnosisTask } from '@/types/diagnosis'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSnap(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 't1',
    thinking_time_ms: 5000,
    task_duration_ms: 30_000,
    revision_count: 2,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 50,
    time_after_completion_ms: 1000,
    answer_text: 'Meine Antwort mit ausführlichem Rechenweg',
    coach_rating: 3,
    ...overrides,
  }
}

function makeTask(cluster: string, id = 'task-1'): DiagnosisTask {
  return {
    id,
    skill_id: 'skill-1',
    skill_cluster: cluster,
    question: 'Was ist 2+2?',
    solution: '4',
    common_errors: 'Nichts',
    coach_hint: 'Zähle nach',
    estimated_minutes: 3,
  }
}

// ── analyzeBehavior ───────────────────────────────────────────────────────────

describe('analyzeBehavior()', () => {
  it('clamps all scores to 0–100', () => {
    // extreme inputs that would push scores out of range
    const snap = makeSnap({
      thinking_time_ms: 99_999,
      revision_count: 0,
      answer_length: 200,
      time_after_completion_ms: 5000,
      rewrite_count: 0,
    })
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  describe('mastery_signal', () => {
    it('returns "secure" for high rating + high confidence', () => {
      const snap = makeSnap({ coach_rating: 4, thinking_time_ms: 6000, revision_count: 1 })
      expect(analyzeBehavior(snap).mastery_signal).toBe('secure')
    })

    it('returns "guessing" for very short task with short answer', () => {
      const snap = makeSnap({
        task_duration_ms: 5000,
        answer_length: 3,
        coach_rating: null,
      })
      expect(analyzeBehavior(snap).mastery_signal).toBe('guessing')
    })

    it('returns "gap" for low coach rating and sufficient effort', () => {
      const snap = makeSnap({
        coach_rating: 2,
        answer_length: 60,
        time_after_completion_ms: 3000,
      })
      expect(analyzeBehavior(snap).mastery_signal).toBe('gap')
    })

    it('returns "developing" as fallback', () => {
      const snap = makeSnap({ coach_rating: null, task_duration_ms: 40_000, answer_length: 20 })
      expect(analyzeBehavior(snap).mastery_signal).toBe('developing')
    })
  })

  describe('flags', () => {
    it('adds "Gibt schnell auf" when hint used early', () => {
      const snap = makeSnap({ hint_used: true, hint_request_time_ms: 3000 })
      expect(analyzeBehavior(snap).flags).toContain('Gibt schnell auf')
    })

    it('adds "Überprüft Ergebnisse" when long time after completion', () => {
      const snap = makeSnap({ time_after_completion_ms: 4000 })
      expect(analyzeBehavior(snap).flags).toContain('Überprüft Ergebnisse')
    })

    it('adds "Zeigt Rechenweg selten" for short answers', () => {
      const snap = makeSnap({ answer_length: 10 })
      expect(analyzeBehavior(snap).flags).toContain('Zeigt Rechenweg selten')
    })

    it('adds "Arbeitet strukturiert" for long answers', () => {
      const snap = makeSnap({ answer_length: 50 })
      expect(analyzeBehavior(snap).flags).toContain('Arbeitet strukturiert')
    })

    it('adds "Unsicheres Schreibverhalten" for many revisions', () => {
      const snap = makeSnap({ revision_count: 10 })
      expect(analyzeBehavior(snap).flags).toContain('Unsicheres Schreibverhalten')
    })

    it('adds "Hohe Frustrationstoleranz" for very long tasks', () => {
      const snap = makeSnap({ task_duration_ms: 130_000 })
      expect(analyzeBehavior(snap).flags).toContain('Hohe Frustrationstoleranz')
    })
  })

  describe('frustration_index', () => {
    it('increases for many revisions', () => {
      const low = analyzeBehavior(makeSnap({ revision_count: 1 }))
      const high = analyzeBehavior(makeSnap({ revision_count: 9 }))
      expect(high.frustration_index).toBeGreaterThan(low.frustration_index)
    })

    it('increases for many rewrites', () => {
      const low = analyzeBehavior(makeSnap({ rewrite_count: 0 }))
      const high = analyzeBehavior(makeSnap({ rewrite_count: 3 }))
      expect(high.frustration_index).toBeGreaterThan(low.frustration_index)
    })
  })

  describe('confidence_score', () => {
    it('increases for long thinking time', () => {
      const low = analyzeBehavior(makeSnap({ thinking_time_ms: 500 }))
      const high = analyzeBehavior(makeSnap({ thinking_time_ms: 5000 }))
      expect(high.confidence_score).toBeGreaterThan(low.confidence_score)
    })

    it('decreases when hint used very early', () => {
      const noHint = analyzeBehavior(makeSnap({ hint_used: false }))
      const earlyHint = analyzeBehavior(makeSnap({ hint_used: true, hint_request_time_ms: 2000 }))
      expect(earlyHint.confidence_score).toBeLessThan(noHint.confidence_score)
    })
  })
})

// ── aggregateOverallFlags ─────────────────────────────────────────────────────

describe('aggregateOverallFlags()', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('includes flags present in ≥40% of analyses', () => {
    const flag = 'Gibt schnell auf'
    const analyses = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'secure' as const, flags: [flag] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'secure' as const, flags: [flag] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'secure' as const, flags: [flag] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'secure' as const, flags: [] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'secure' as const, flags: [] },
    ]
    expect(aggregateOverallFlags(analyses)).toContain(flag)
  })

  it('excludes flags present in <40% of analyses (but at least 2)', () => {
    const flag = 'Seltener Flag'
    const analyses = Array.from({ length: 10 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'secure' as const,
      flags: i === 0 ? [flag] : [],
    }))
    expect(aggregateOverallFlags(analyses)).not.toContain(flag)
  })
})

// ── averageMetrics ────────────────────────────────────────────────────────────

describe('averageMetrics()', () => {
  it('returns zeros for empty input', () => {
    expect(averageMetrics([])).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('computes correct averages', () => {
    const analyses = [
      { confidence_score: 60, effort_score: 40, frustration_index: 20, mastery_signal: 'secure' as const, flags: [] },
      { confidence_score: 80, effort_score: 60, frustration_index: 10, mastery_signal: 'secure' as const, flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(50)
    expect(result.avgFrustration).toBe(15)
  })
})

// ── deriveSkillLevels ─────────────────────────────────────────────────────────

describe('deriveSkillLevels()', () => {
  it('returns empty array when no tasks', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })

  it('maps coach rating 4 to level "Sicher"', () => {
    const task = makeTask('Algebra')
    const snap = makeSnap({ coach_rating: 4, thinking_time_ms: 6000 })
    const analysis = analyzeBehavior(snap)
    const levels = deriveSkillLevels([task], [snap], [analysis])
    expect(levels[0].skill_cluster).toBe('Algebra')
    expect(levels[0].label).toBe('Sicher')
    expect(levels[0].level).toBeGreaterThanOrEqual(7)
  })

  it('maps coach rating 1 to level "Lücke"', () => {
    const task = makeTask('Geometrie')
    const snap = makeSnap({ coach_rating: 1, task_duration_ms: 6000, answer_length: 3 })
    const analysis = analyzeBehavior(snap)
    const levels = deriveSkillLevels([task], [snap], [analysis])
    expect(levels[0].label).toBe('Lücke')
    expect(levels[0].level).toBeLessThanOrEqual(3)
  })

  it('aggregates multiple tasks per cluster', () => {
    const tasks = [makeTask('Algebra', 't1'), makeTask('Algebra', 't2')]
    const snaps = [makeSnap({ coach_rating: 4 }), makeSnap({ coach_rating: 2 })]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const levels = deriveSkillLevels(tasks, snaps, analyses)
    expect(levels).toHaveLength(1)
    expect(levels[0].skill_cluster).toBe('Algebra')
  })
})

// ── recommendFocus ────────────────────────────────────────────────────────────

describe('recommendFocus()', () => {
  it('returns the two weakest clusters', () => {
    const skillLevels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 1, label: 'Lücke' as const },
    ]
    const result = recommendFocus(skillLevels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('D')
    expect(result[1].skill_cluster).toBe('B')
  })

  it('does not mutate the input array', () => {
    const input = [
      { skill_cluster: 'X', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'Y', level: 9, label: 'Sicher' as const },
    ]
    const copy = [...input]
    recommendFocus(input)
    expect(input).toEqual(copy)
  })
})

// ── buildDiagnosisResult ──────────────────────────────────────────────────────

describe('buildDiagnosisResult()', () => {
  it('assembles a complete DiagnosisResult', () => {
    const tasks = [makeTask('Algebra'), makeTask('Geometrie', 't2')]
    const snapshots = [makeSnap(), makeSnap({ coach_rating: 2, answer_length: 5 })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Lena Fischer',
      subject: 'Mathematik',
      date: '2026-05-19',
      coachNote: 'Gute Session',
    })
    expect(result.student_name).toBe('Lena Fischer')
    expect(result.subject).toBe('Mathematik')
    expect(result.analyses).toHaveLength(2)
    expect(result.skill_levels).toHaveLength(2)
    expect(Array.isArray(result.overall_behavior_flags)).toBe(true)
  })
})
