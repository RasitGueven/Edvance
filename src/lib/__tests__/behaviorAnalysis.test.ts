import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from '../behaviorAnalysis'
import type { BehaviorSnapshot, BehaviorAnalysis } from '@/types/diagnosis'
import type { DiagnosisTask } from '@/types/diagnosis'

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 2000,
    task_duration_ms: 30_000,
    revision_count: 2,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 20,
    time_after_completion_ms: 1000,
    answer_text: 'Some answer',
    coach_rating: null,
    ...overrides,
  }
}

function makeTask(overrides: Partial<DiagnosisTask> = {}): DiagnosisTask {
  return {
    id: 'task-1',
    skill_id: 'skill-1',
    skill_cluster: 'Bruchrechnung',
    question: 'Was ist 1/2 + 1/4?',
    solution: '3/4',
    common_errors: '',
    coach_hint: '',
    estimated_minutes: 5,
    ...overrides,
  }
}

// ── analyzeBehavior ─────────────────────────────────────────────────────────

describe('analyzeBehavior', () => {
  it('returns values clamped to 0–100', () => {
    const snap = makeSnapshot()
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('boosts confidence for long thinking time', () => {
    const low = analyzeBehavior(makeSnapshot({ thinking_time_ms: 500 }))
    const high = analyzeBehavior(makeSnapshot({ thinking_time_ms: 5000 }))
    expect(high.confidence_score).toBeGreaterThan(low.confidence_score)
  })

  it('reduces confidence when hint used quickly', () => {
    const noHint = analyzeBehavior(makeSnapshot({ hint_used: false }))
    const quickHint = analyzeBehavior(
      makeSnapshot({ hint_used: true, hint_request_time_ms: 2000 }),
    )
    expect(quickHint.confidence_score).toBeLessThan(noHint.confidence_score)
  })

  it('flags "Gibt schnell auf" when hint used in < 5s', () => {
    const snap = makeSnapshot({ hint_used: true, hint_request_time_ms: 3000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('flags "Überprüft Ergebnisse" when time_after_completion > 3s', () => {
    const snap = makeSnapshot({ time_after_completion_ms: 4000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('flags "Arbeitet strukturiert" for long answers', () => {
    const snap = makeSnapshot({ answer_length: 50 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('sets mastery_signal to "secure" with high confidence and good coach rating', () => {
    const snap = makeSnapshot({
      thinking_time_ms: 5000,
      revision_count: 1,
      coach_rating: 4,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('secure')
  })

  it('sets mastery_signal to "guessing" for very fast, very short answers', () => {
    const snap = makeSnapshot({
      task_duration_ms: 1000,
      answer_length: 2,
      coach_rating: null,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('guessing')
  })

  it('sets mastery_signal to "gap" for low coach rating with effort', () => {
    const snap = makeSnapshot({
      coach_rating: 1,
      answer_length: 35,
      time_after_completion_ms: 3000,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('gap')
  })

  it('accumulates frustration for many revisions + rewrites + long duration', () => {
    const snap = makeSnapshot({
      revision_count: 10,
      rewrite_count: 3,
      task_duration_ms: 200_000,
    })
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBeGreaterThan(50)
  })
})

// ── aggregateOverallFlags ───────────────────────────────────────────────────

describe('aggregateOverallFlags', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('returns flag that appears in 40%+ of analyses', () => {
    const snaps = Array.from({ length: 5 }, (_, i) =>
      analyzeBehavior(
        makeSnapshot({
          hint_used: i < 3,
          hint_request_time_ms: i < 3 ? 2000 : null,
        }),
      ),
    )
    const flags = aggregateOverallFlags(snaps)
    expect(flags).toContain('Gibt schnell auf')
  })

  it('excludes flag that appears in fewer than 40% of analyses', () => {
    const snaps = Array.from({ length: 10 }, (_, i) =>
      analyzeBehavior(
        makeSnapshot({
          hint_used: i === 0,
          hint_request_time_ms: i === 0 ? 2000 : null,
        }),
      ),
    )
    const flags = aggregateOverallFlags(snaps)
    expect(flags).not.toContain('Gibt schnell auf')
  })

  it('requires at least 2 occurrences in small sets', () => {
    const one: BehaviorAnalysis = {
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing',
      flags: ['SomeFlag'],
    }
    const two: BehaviorAnalysis = {
      ...one,
      flags: [],
    }
    expect(aggregateOverallFlags([one, two])).not.toContain('SomeFlag')
  })
})

// ── averageMetrics ──────────────────────────────────────────────────────────

describe('averageMetrics', () => {
  it('returns zeros for empty input', () => {
    expect(averageMetrics([])).toEqual({
      avgConfidence: 0,
      avgEffort: 0,
      avgFrustration: 0,
    })
  })

  it('computes correct average for known values', () => {
    const analyses: BehaviorAnalysis[] = [
      {
        confidence_score: 60,
        effort_score: 40,
        frustration_index: 20,
        mastery_signal: 'developing',
        flags: [],
      },
      {
        confidence_score: 80,
        effort_score: 60,
        frustration_index: 40,
        mastery_signal: 'secure',
        flags: [],
      },
    ]
    expect(averageMetrics(analyses)).toEqual({
      avgConfidence: 70,
      avgEffort: 50,
      avgFrustration: 30,
    })
  })

  it('rounds to nearest integer', () => {
    const analyses: BehaviorAnalysis[] = [
      {
        confidence_score: 67,
        effort_score: 33,
        frustration_index: 10,
        mastery_signal: 'developing',
        flags: [],
      },
      {
        confidence_score: 68,
        effort_score: 34,
        frustration_index: 11,
        mastery_signal: 'developing',
        flags: [],
      },
    ]
    const result = averageMetrics(analyses)
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
    expect(Number.isInteger(result.avgEffort)).toBe(true)
  })
})

// ── deriveSkillLevels ───────────────────────────────────────────────────────

describe('deriveSkillLevels', () => {
  it('returns one entry per unique cluster', () => {
    const tasks = [
      makeTask({ skill_cluster: 'Bruchrechnung' }),
      makeTask({ skill_cluster: 'Algebra' }),
    ]
    const snaps = [makeSnapshot({ coach_rating: 3 }), makeSnapshot({ coach_rating: 2 })]
    const analyses = snaps.map((s) => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.skill_cluster)).toContain('Bruchrechnung')
    expect(result.map((r) => r.skill_cluster)).toContain('Algebra')
  })

  it('returns empty array when tasks is empty', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })

  it('assigns label "Sicher" for high coach rating with high confidence', () => {
    const task = makeTask({ skill_cluster: 'Test' })
    const snap = makeSnapshot({ coach_rating: 4, thinking_time_ms: 5000, revision_count: 1 })
    const analysis = analyzeBehavior(snap)
    const result = deriveSkillLevels([task], [snap], [analysis])
    expect(result[0].label).toBe('Sicher')
  })

  it('assigns label "Lücke" for low coach rating with low confidence', () => {
    const task = makeTask({ skill_cluster: 'Test' })
    const snap = makeSnapshot({
      coach_rating: 1,
      thinking_time_ms: 500,
      hint_used: true,
      hint_request_time_ms: 2000,
    })
    const analysis = analyzeBehavior(snap)
    const result = deriveSkillLevels([task], [snap], [analysis])
    expect(result[0].label).toBe('Lücke')
  })
})

// ── recommendFocus ──────────────────────────────────────────────────────────

describe('recommendFocus', () => {
  it('returns the 2 weakest clusters', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
    ]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.skill_cluster)).toContain('B')
    expect(result.map((r) => r.skill_cluster)).toContain('C')
  })

  it('returns all if fewer than 2 clusters', () => {
    const levels = [{ skill_cluster: 'A', level: 5, label: 'Erkennbar' as const }]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(1)
  })
})

// ── buildDiagnosisResult ────────────────────────────────────────────────────

describe('buildDiagnosisResult', () => {
  it('builds a complete result from tasks and snapshots', () => {
    const tasks = [makeTask()]
    const snapshots = [makeSnapshot({ coach_rating: 3, thinking_time_ms: 5000 })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Max Mustermann',
      subject: 'Mathematik',
      date: '2025-05-09',
      coachNote: 'Gute Leistung',
    })
    expect(result.student_name).toBe('Max Mustermann')
    expect(result.subject).toBe('Mathematik')
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
    expect(result.coach_note).toBe('Gute Leistung')
  })
})
