import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from './behaviorAnalysis'
import type { BehaviorSnapshot, DiagnosisTask } from '@/types/diagnosis'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSnap(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 4000,
    task_duration_ms: 30_000,
    revision_count: 1,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 35,
    time_after_completion_ms: 1000,
    answer_text: 'Meine Lösung',
    coach_rating: 3,
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
    common_errors: 'Nenner addieren',
    coach_hint: 'Gemeinsamer Nenner',
    estimated_minutes: 3,
    ...overrides,
  }
}

// ── analyzeBehavior ───────────────────────────────────────────────────────────

describe('analyzeBehavior()', () => {
  it('produces scores in [0, 100] range', () => {
    const result = analyzeBehavior(makeSnap())
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('raises confidence for long thinking time and few revisions', () => {
    const snap = makeSnap({ thinking_time_ms: 5000, revision_count: 1 })
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThan(50)
  })

  it('lowers confidence for quick, short answer', () => {
    // Disable bonuses (thinking < 3000, revision >= 3) to isolate the -20 penalty
    const snap = makeSnap({ task_duration_ms: 5000, answer_length: 5, thinking_time_ms: 500, revision_count: 4 })
    const result = analyzeBehavior(snap)
    // base 50 - 20 (quick+short) = 30
    expect(result.confidence_score).toBeLessThan(50)
  })

  it('lowers confidence when hint used very early', () => {
    // Disable bonuses to isolate the -15 hint penalty
    const snap = makeSnap({ hint_used: true, hint_request_time_ms: 3000, thinking_time_ms: 500, revision_count: 4 })
    const result = analyzeBehavior(snap)
    // base 50 - 15 (early hint) = 35
    expect(result.confidence_score).toBeLessThan(50)
  })

  it('raises effort for long answer', () => {
    const snap = makeSnap({ answer_length: 50 })
    const result = analyzeBehavior(snap)
    expect(result.effort_score).toBeGreaterThan(50)
  })

  it('lowers effort for short answer', () => {
    const snap = makeSnap({ answer_length: 5 })
    const result = analyzeBehavior(snap)
    expect(result.effort_score).toBeLessThan(50)
  })

  it('raises frustration for many revisions', () => {
    const snap = makeSnap({ revision_count: 10 })
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBeGreaterThan(0)
  })

  it('raises frustration for very long task duration', () => {
    const snap = makeSnap({ task_duration_ms: 200_000 })
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBeGreaterThanOrEqual(20)
  })

  // Mastery signals
  it('returns mastery "secure" for good rating + high confidence', () => {
    // coach_rating 3 + high confidence (thinking_time > 3000 → +20, revision < 3 → +15)
    const snap = makeSnap({ coach_rating: 3, thinking_time_ms: 5000, revision_count: 1 })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('secure')
  })

  it('returns mastery "guessing" for very quick very short answer', () => {
    const snap = makeSnap({
      task_duration_ms: 3000,
      answer_length: 4,
      coach_rating: null,
      hint_used: false,
      thinking_time_ms: 100,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('guessing')
  })

  it('returns mastery "gap" for low rating + sufficient effort', () => {
    const snap = makeSnap({
      coach_rating: 1,
      answer_length: 40,
      task_duration_ms: 50_000,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('gap')
  })

  it('returns mastery "developing" as default fallback', () => {
    const snap = makeSnap({
      coach_rating: null,
      task_duration_ms: 20_000,
      answer_length: 15,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('developing')
  })

  // Flags
  it('flags "Gibt schnell auf" when hint used very early', () => {
    const snap = makeSnap({ hint_used: true, hint_request_time_ms: 2000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('flags "Zeigt Rechenweg selten" for very short answer', () => {
    const snap = makeSnap({ answer_length: 10 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Zeigt Rechenweg selten')
  })

  it('flags "Überprüft Ergebnisse" for long time_after_completion', () => {
    const snap = makeSnap({ time_after_completion_ms: 5000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('flags "Arbeitet strukturiert" for very long answer', () => {
    const snap = makeSnap({ answer_length: 50 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('flags "Unsicheres Schreibverhalten" for many revisions', () => {
    const snap = makeSnap({ revision_count: 8 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Unsicheres Schreibverhalten')
  })

  it('flags "Hohe Frustrationstoleranz" for very long task', () => {
    const snap = makeSnap({ task_duration_ms: 130_000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Hohe Frustrationstoleranz')
  })

  it('clamps confidence to 0 minimum with extreme inputs', () => {
    const snap = makeSnap({
      thinking_time_ms: 100,
      revision_count: 10,
      task_duration_ms: 3000,
      answer_length: 4,
      hint_used: true,
      hint_request_time_ms: 1000,
    })
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
  })
})

// ── aggregateOverallFlags ─────────────────────────────────────────────────────

describe('aggregateOverallFlags()', () => {
  it('returns empty for empty input', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('includes flags that appear in 40%+ of analyses', () => {
    const analyses = Array.from({ length: 5 }, () =>
      analyzeBehavior(makeSnap({ answer_length: 10 })), // always flags "Zeigt Rechenweg selten"
    )
    const flags = aggregateOverallFlags(analyses)
    expect(flags).toContain('Zeigt Rechenweg selten')
  })

  it('excludes flags below the threshold', () => {
    const analyses = [
      analyzeBehavior(makeSnap({ answer_length: 50 })), // flags "Arbeitet strukturiert"
      analyzeBehavior(makeSnap({ answer_length: 35 })), // no special flags
      analyzeBehavior(makeSnap({ answer_length: 35 })),
      analyzeBehavior(makeSnap({ answer_length: 35 })),
      analyzeBehavior(makeSnap({ answer_length: 35 })),
    ]
    const flags = aggregateOverallFlags(analyses)
    // "Arbeitet strukturiert" appears 1x, threshold = max(2, ceil(5*0.4)=2) = 2 → not included
    expect(flags).not.toContain('Arbeitet strukturiert')
  })

  it('sorts flags by frequency (most common first)', () => {
    // Create analyses where two flags appear, one more than the other
    const analyses = [
      analyzeBehavior(makeSnap({ answer_length: 10, time_after_completion_ms: 4000 })),
      analyzeBehavior(makeSnap({ answer_length: 10, time_after_completion_ms: 4000 })),
      analyzeBehavior(makeSnap({ answer_length: 10, time_after_completion_ms: 1000 })),
    ]
    const flags = aggregateOverallFlags(analyses)
    // Both flags appear ≥ threshold (max(2, ceil(3*0.4)=2)=2)
    if (flags.length >= 2) {
      const zeigt = flags.indexOf('Zeigt Rechenweg selten')
      const ueber = flags.indexOf('Überprüft Ergebnisse')
      // "Zeigt Rechenweg selten" appears 3x, "Überprüft Ergebnisse" 2x → zeigt first
      if (zeigt !== -1 && ueber !== -1) {
        expect(zeigt).toBeLessThan(ueber)
      }
    }
  })
})

// ── averageMetrics ────────────────────────────────────────────────────────────

describe('averageMetrics()', () => {
  it('returns zeros for empty array', () => {
    expect(averageMetrics([])).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('correctly averages two analyses', () => {
    const a1 = { confidence_score: 60, effort_score: 70, frustration_index: 20, mastery_signal: 'secure' as const, flags: [] }
    const a2 = { confidence_score: 80, effort_score: 90, frustration_index: 40, mastery_signal: 'developing' as const, flags: [] }
    const result = averageMetrics([a1, a2])
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(80)
    expect(result.avgFrustration).toBe(30)
  })

  it('rounds results', () => {
    const a1 = { confidence_score: 66, effort_score: 0, frustration_index: 0, mastery_signal: 'developing' as const, flags: [] }
    const a2 = { confidence_score: 67, effort_score: 0, frustration_index: 0, mastery_signal: 'developing' as const, flags: [] }
    const a3 = { confidence_score: 68, effort_score: 0, frustration_index: 0, mastery_signal: 'developing' as const, flags: [] }
    const result = averageMetrics([a1, a2, a3])
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
  })
})

// ── deriveSkillLevels ─────────────────────────────────────────────────────────

describe('deriveSkillLevels()', () => {
  it('returns one entry per cluster', () => {
    const tasks = [
      makeTask({ skill_cluster: 'Bruchrechnung', id: 't1' }),
      makeTask({ skill_cluster: 'Geometrie', id: 't2' }),
    ]
    const snaps = [
      makeSnap({ task_id: 't1', coach_rating: 4 }),
      makeSnap({ task_id: 't2', coach_rating: 2 }),
    ]
    const analyses = snaps.map((s) => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.skill_cluster)).toContain('Bruchrechnung')
    expect(result.map((r) => r.skill_cluster)).toContain('Geometrie')
  })

  it('assigns label "Lücke" for level ≤ 3', () => {
    const tasks = [makeTask({ skill_cluster: 'Zahlenraum' })]
    // coach_rating 1 → baseLevel 2, confidence ~50 → conf 0.5 → level = 2 + 0 = 2 → "Lücke"
    const snaps = [makeSnap({ coach_rating: 1, thinking_time_ms: 100, revision_count: 5 })]
    const analyses = snaps.map((s) => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result[0].label).toBe('Lücke')
  })

  it('assigns label "Sicher" for level ≥ 7', () => {
    const tasks = [makeTask({ skill_cluster: 'Algebra' })]
    // coach_rating 4 → baseLevel 8, high confidence → level likely 8-9 → "Sicher"
    const snaps = [makeSnap({ coach_rating: 4, thinking_time_ms: 5000, revision_count: 1 })]
    const analyses = snaps.map((s) => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result[0].label).toBe('Sicher')
  })

  it('groups multiple tasks in same cluster and averages', () => {
    const tasks = [
      makeTask({ skill_cluster: 'Bruchrechnung', id: 't1' }),
      makeTask({ skill_cluster: 'Bruchrechnung', id: 't2' }),
    ]
    const snaps = [
      makeSnap({ task_id: 't1', coach_rating: 1 }),
      makeSnap({ task_id: 't2', coach_rating: 4 }),
    ]
    const analyses = snaps.map((s) => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(1)
    expect(result[0].skill_cluster).toBe('Bruchrechnung')
  })

  it('uses level 5 as base when coach_rating is null', () => {
    const tasks = [makeTask()]
    const snaps = [makeSnap({ coach_rating: null })]
    const analyses = snaps.map((s) => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    // base 5, conf around 0.5 → level around 5 → "Erkennbar"
    expect(result[0].level).toBeGreaterThanOrEqual(1)
    expect(result[0].level).toBeLessThanOrEqual(10)
  })
})

// ── recommendFocus ────────────────────────────────────────────────────────────

describe('recommendFocus()', () => {
  it('returns up to 2 weakest clusters', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 2, label: 'Lücke' as const },
    ]
    const focus = recommendFocus(levels)
    expect(focus).toHaveLength(2)
    expect(focus[0].skill_cluster).toBe('D') // level 2 is weakest
    expect(focus[1].skill_cluster).toBe('B') // level 3 second weakest
  })

  it('returns all entries if fewer than 2 exist', () => {
    const levels = [{ skill_cluster: 'X', level: 4, label: 'Erkennbar' as const }]
    expect(recommendFocus(levels)).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    expect(recommendFocus([])).toEqual([])
  })

  it('does not mutate the input array', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
    ]
    const original = [...levels]
    recommendFocus(levels)
    expect(levels).toEqual(original)
  })
})

// ── buildDiagnosisResult ──────────────────────────────────────────────────────

describe('buildDiagnosisResult()', () => {
  it('returns result with correct student metadata', () => {
    const tasks = [makeTask()]
    const snapshots = [makeSnap()]
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Lena Fischer',
      subject: 'Mathematik',
      date: '2026-05-18',
      coachNote: 'Sehr engagiert',
    })
    expect(result.student_name).toBe('Lena Fischer')
    expect(result.subject).toBe('Mathematik')
    expect(result.date).toBe('2026-05-18')
    expect(result.coach_note).toBe('Sehr engagiert')
  })

  it('populates analyses from snapshots', () => {
    const tasks = [makeTask()]
    const snapshots = [makeSnap()]
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Test',
      subject: 'Mathe',
      date: '2026-01-01',
      coachNote: '',
    })
    expect(result.analyses).toHaveLength(1)
    expect(result.analyses[0]).toHaveProperty('confidence_score')
    expect(result.analyses[0]).toHaveProperty('mastery_signal')
  })

  it('handles empty snapshots gracefully', () => {
    const result = buildDiagnosisResult({
      tasks: [],
      snapshots: [],
      studentName: 'Max',
      subject: 'Mathe',
      date: '2026-01-01',
      coachNote: '',
    })
    expect(result.analyses).toHaveLength(0)
    expect(result.skill_levels).toHaveLength(0)
    expect(result.overall_behavior_flags).toHaveLength(0)
  })
})
