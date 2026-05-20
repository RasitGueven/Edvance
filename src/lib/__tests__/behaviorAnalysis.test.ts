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

// ── Fixtures ────────────────────────────────────────────────────────────────

function snapshot(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
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
    answer_text: 'Antwort',
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
    skill_cluster: 'Zahlen & Rechnen',
    question: 'Teste die Aufgabe',
    solution: 'Lösung',
    common_errors: '',
    coach_hint: '',
    estimated_minutes: 3,
    ...overrides,
  }
}

// ── analyzeBehavior ──────────────────────────────────────────────────────────

describe('analyzeBehavior()', () => {
  it('returns a result within valid ranges for a baseline snapshot', () => {
    const result = analyzeBehavior(snapshot())
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('adds +20 confidence for thinking_time_ms > 3000', () => {
    const base = analyzeBehavior(snapshot({ thinking_time_ms: 1000 }))
    const high = analyzeBehavior(snapshot({ thinking_time_ms: 4000 }))
    expect(high.confidence_score - base.confidence_score).toBe(20)
  })

  it('adds +15 confidence for revision_count < 3', () => {
    const low = analyzeBehavior(snapshot({ revision_count: 2 }))
    const high = analyzeBehavior(snapshot({ revision_count: 5 }))
    expect(low.confidence_score - high.confidence_score).toBe(15)
  })

  it('subtracts -20 confidence when task is fast and answer is short', () => {
    const slow = analyzeBehavior(snapshot({ task_duration_ms: 20_000, answer_length: 20 }))
    const fast = analyzeBehavior(snapshot({ task_duration_ms: 5000, answer_length: 5 }))
    expect(slow.confidence_score - fast.confidence_score).toBe(20)
  })

  it('subtracts -15 confidence when hint used within 5 seconds', () => {
    const noHint = analyzeBehavior(snapshot({ hint_used: false }))
    const quickHint = analyzeBehavior(
      snapshot({ hint_used: true, hint_request_time_ms: 3000 }),
    )
    expect(noHint.confidence_score - quickHint.confidence_score).toBe(15)
  })

  it('adds +20 effort for answer_length > 30', () => {
    const short = analyzeBehavior(snapshot({ answer_length: 15 }))
    const long = analyzeBehavior(snapshot({ answer_length: 40 }))
    expect(long.effort_score - short.effort_score).toBe(20)
  })

  it('adds +15 effort for time_after_completion_ms > 2000', () => {
    const noCheck = analyzeBehavior(snapshot({ time_after_completion_ms: 500 }))
    const checked = analyzeBehavior(snapshot({ time_after_completion_ms: 3000 }))
    expect(checked.effort_score - noCheck.effort_score).toBe(15)
  })

  it('subtracts -20 effort for very short answers', () => {
    const long = analyzeBehavior(snapshot({ answer_length: 20 }))
    const short = analyzeBehavior(snapshot({ answer_length: 5 }))
    expect(long.effort_score - short.effort_score).toBe(20)
  })

  it('subtracts -10 effort for rewrite_count > 2', () => {
    const noRew = analyzeBehavior(snapshot({ rewrite_count: 0 }))
    const manyRew = analyzeBehavior(snapshot({ rewrite_count: 3 }))
    expect(noRew.effort_score - manyRew.effort_score).toBe(10)
  })

  it('adds +30 frustration for revision_count > 8', () => {
    const low = analyzeBehavior(snapshot({ revision_count: 2 }))
    const high = analyzeBehavior(snapshot({ revision_count: 10 }))
    expect(high.frustration_index - low.frustration_index).toBe(30)
  })

  it('adds +25 frustration for rewrite_count > 1', () => {
    const low = analyzeBehavior(snapshot({ rewrite_count: 0 }))
    const high = analyzeBehavior(snapshot({ rewrite_count: 2 }))
    expect(high.frustration_index - low.frustration_index).toBe(25)
  })

  it('adds +20 frustration for very long task duration', () => {
    const normal = analyzeBehavior(snapshot({ task_duration_ms: 30_000 }))
    const long = analyzeBehavior(snapshot({ task_duration_ms: 200_000 }))
    expect(long.frustration_index - normal.frustration_index).toBe(20)
  })

  it('clamps scores to [0, 100]', () => {
    const extreme = analyzeBehavior(
      snapshot({
        thinking_time_ms: 99_999,
        answer_length: 100,
        time_after_completion_ms: 9999,
        task_duration_ms: 200_000,
        rewrite_count: 10,
        revision_count: 10,
        hint_used: true,
        hint_request_time_ms: 1000,
        coach_rating: 1,
      }),
    )
    expect(extreme.confidence_score).toBeGreaterThanOrEqual(0)
    expect(extreme.confidence_score).toBeLessThanOrEqual(100)
    expect(extreme.effort_score).toBeGreaterThanOrEqual(0)
    expect(extreme.effort_score).toBeLessThanOrEqual(100)
    expect(extreme.frustration_index).toBeGreaterThanOrEqual(0)
    expect(extreme.frustration_index).toBeLessThanOrEqual(100)
  })

  describe('mastery_signal', () => {
    it('returns "secure" when coach_rating ≥ 3 and confidence > 65', () => {
      // thinking > 3000 (+20), revision_count < 3 (+15) → confidence = 85
      const snap = snapshot({ thinking_time_ms: 4000, revision_count: 2, coach_rating: 3 })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('secure')
    })

    it('returns "guessing" when task is fast and answer short', () => {
      // No modifiers that push confidence > 65, no coach_rating
      const snap = snapshot({ task_duration_ms: 5000, answer_length: 5, coach_rating: null })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('guessing')
    })

    it('returns "gap" when coach_rating ≤ 2 and effort > 40', () => {
      // answer_length 20 → effort stays at 50 (base), coach_rating 2
      const snap = snapshot({ coach_rating: 2, answer_length: 20 })
      const result = analyzeBehavior(snap)
      expect(result.mastery_signal).toBe('gap')
    })

    it('returns "developing" as fallback', () => {
      // Default snapshot has no coach_rating and moderate speed/length
      const result = analyzeBehavior(snapshot())
      expect(result.mastery_signal).toBe('developing')
    })
  })

  describe('flags', () => {
    it('flags "Gibt schnell auf" when hint used within 5s', () => {
      const result = analyzeBehavior(
        snapshot({ hint_used: true, hint_request_time_ms: 2000 }),
      )
      expect(result.flags).toContain('Gibt schnell auf')
    })

    it('flags "Zeigt Rechenweg selten" for short answers', () => {
      const result = analyzeBehavior(snapshot({ answer_length: 10 }))
      expect(result.flags).toContain('Zeigt Rechenweg selten')
    })

    it('flags "Überprüft Ergebnisse" for high time after completion', () => {
      const result = analyzeBehavior(snapshot({ time_after_completion_ms: 4000 }))
      expect(result.flags).toContain('Überprüft Ergebnisse')
    })

    it('flags "Hohe Frustrationstoleranz" for very long duration', () => {
      const result = analyzeBehavior(snapshot({ task_duration_ms: 130_000 }))
      expect(result.flags).toContain('Hohe Frustrationstoleranz')
    })

    it('flags "Unsicheres Schreibverhalten" for many revisions', () => {
      const result = analyzeBehavior(snapshot({ revision_count: 8 }))
      expect(result.flags).toContain('Unsicheres Schreibverhalten')
    })

    it('flags "Arbeitet strukturiert" for long answers', () => {
      const result = analyzeBehavior(snapshot({ answer_length: 45 }))
      expect(result.flags).toContain('Arbeitet strukturiert')
    })

    it('produces no flags for a neutral baseline', () => {
      // answer_length 20 → no short flag, no long flag; time_after 1000 → no check flag
      const result = analyzeBehavior(snapshot({ answer_length: 20, time_after_completion_ms: 500 }))
      expect(result.flags).toHaveLength(0)
    })
  })
})

// ── aggregateOverallFlags ────────────────────────────────────────────────────

describe('aggregateOverallFlags()', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('returns a flag that appears in ≥40% of analyses', () => {
    const analyses = [
      analysis({ flags: ['A', 'B'] }),
      analysis({ flags: ['A'] }),
      analysis({ flags: ['B'] }),
    ]
    // A appears 2/3 times (~67%), B appears 2/3 times (~67%), threshold = max(2, ceil(3*0.4)) = 2
    const flags = aggregateOverallFlags(analyses)
    expect(flags).toContain('A')
    expect(flags).toContain('B')
  })

  it('excludes a flag that appears below threshold', () => {
    const analyses = [
      analysis({ flags: ['Rare'] }),
      analysis({ flags: [] }),
      analysis({ flags: [] }),
      analysis({ flags: [] }),
      analysis({ flags: [] }),
    ]
    // 'Rare' appears once, threshold = max(2, ceil(5*0.4)) = 2 → not included
    expect(aggregateOverallFlags(analyses)).not.toContain('Rare')
  })

  it('sorts by frequency descending', () => {
    const analyses = [
      analysis({ flags: ['B', 'A'] }),
      analysis({ flags: ['B', 'A'] }),
      analysis({ flags: ['B'] }),
    ]
    const flags = aggregateOverallFlags(analyses)
    expect(flags[0]).toBe('B')
    expect(flags[1]).toBe('A')
  })
})

// ── averageMetrics ────────────────────────────────────────────────────────────

describe('averageMetrics()', () => {
  it('returns zeros for empty array', () => {
    expect(averageMetrics([])).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('returns the exact values for a single entry', () => {
    const result = averageMetrics([
      analysis({ confidence_score: 80, effort_score: 60, frustration_index: 10 }),
    ])
    expect(result).toEqual({ avgConfidence: 80, avgEffort: 60, avgFrustration: 10 })
  })

  it('rounds the average to the nearest integer', () => {
    const result = averageMetrics([
      analysis({ confidence_score: 70, effort_score: 70, frustration_index: 0 }),
      analysis({ confidence_score: 71, effort_score: 71, frustration_index: 1 }),
    ])
    expect(result.avgConfidence).toBe(71)
    expect(result.avgEffort).toBe(71)
    expect(result.avgFrustration).toBe(1)
  })
})

// ── deriveSkillLevels ─────────────────────────────────────────────────────────

describe('deriveSkillLevels()', () => {
  it('groups tasks by skill_cluster', () => {
    const tasks = [
      task({ skill_cluster: 'Zahlen', id: 't1' }),
      task({ skill_cluster: 'Geometrie', id: 't2' }),
    ]
    const snaps = [
      snapshot({ task_id: 't1', coach_rating: 4 }),
      snapshot({ task_id: 't2', coach_rating: 2 }),
    ]
    const analyses = snaps.map(_s => ({
      ...analysis(),
      confidence_score: 70, // above 65 for t1
    }))
    const levels = deriveSkillLevels(tasks, snaps, analyses)
    const clusters = levels.map(l => l.skill_cluster)
    expect(clusters).toContain('Zahlen')
    expect(clusters).toContain('Geometrie')
  })

  it('assigns label "Sicher" for level > 6', () => {
    // coach_rating 4 → baseLevel 8, confidence 70 → conf=0.7, bonus=(0.7-0.5)*4=0.8 → level=9
    const tasks = [task({ skill_cluster: 'Zahlen' })]
    const snaps = [snapshot({ coach_rating: 4 })]
    const analyses = [analysis({ confidence_score: 70 })]
    const levels = deriveSkillLevels(tasks, snaps, analyses)
    expect(levels[0]?.label).toBe('Sicher')
  })

  it('assigns label "Lücke" for level ≤ 3', () => {
    // coach_rating 1 → baseLevel 2, confidence 30 → bonus=(0.3-0.5)*4=-0.8 → level=clamp(1,1,10)=1
    const tasks = [task({ skill_cluster: 'Zahlen' })]
    const snaps = [snapshot({ coach_rating: 1 })]
    const analyses = [analysis({ confidence_score: 30 })]
    const levels = deriveSkillLevels(tasks, snaps, analyses)
    expect(levels[0]?.label).toBe('Lücke')
  })

  it('returns empty array when no tasks given', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })
})

// ── recommendFocus ────────────────────────────────────────────────────────────

describe('recommendFocus()', () => {
  it('returns the 2 weakest skill clusters', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 1, label: 'Lücke' as const },
    ]
    const focus = recommendFocus(levels)
    expect(focus).toHaveLength(2)
    expect(focus[0]?.skill_cluster).toBe('D')
    expect(focus[1]?.skill_cluster).toBe('B')
  })

  it('does not mutate the original array', () => {
    const levels = [
      { skill_cluster: 'X', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'Y', level: 3, label: 'Lücke' as const },
    ]
    recommendFocus(levels)
    expect(levels[0]?.skill_cluster).toBe('X')
  })
})

// ── buildDiagnosisResult ──────────────────────────────────────────────────────

describe('buildDiagnosisResult()', () => {
  it('returns a DiagnosisResult with the correct student name and subject', () => {
    const tasks = [task()]
    const snaps = [snapshot({ coach_rating: 3, thinking_time_ms: 4000, revision_count: 1 })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots: snaps,
      studentName: 'Lena Fischer',
      subject: 'Mathematik',
      date: '2026-05-20',
      coachNote: 'Gute Leistung',
    })
    expect(result.student_name).toBe('Lena Fischer')
    expect(result.subject).toBe('Mathematik')
    expect(result.date).toBe('2026-05-20')
    expect(result.coach_note).toBe('Gute Leistung')
  })

  it('produces analyses and skill_levels with the same count as tasks', () => {
    const tasks = [task({ id: 't1', skill_cluster: 'ZR' }), task({ id: 't2', skill_cluster: 'GEO' })]
    const snaps = [snapshot({ task_id: 't1' }), snapshot({ task_id: 't2' })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots: snaps,
      studentName: 'Max',
      subject: 'Mathe',
      date: '2026-01-01',
      coachNote: '',
    })
    expect(result.analyses).toHaveLength(2)
    expect(result.skill_levels).toHaveLength(2)
  })
})
