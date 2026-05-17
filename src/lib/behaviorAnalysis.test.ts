import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from './behaviorAnalysis'
import type { BehaviorSnapshot, BehaviorAnalysis, DiagnosisTask } from '@/types/diagnosis'

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 2000,
    task_duration_ms: 30000,
    revision_count: 1,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 20,
    time_after_completion_ms: 0,
    answer_text: 'some answer here',
    coach_rating: null,
    ...overrides,
  }
}

function makeAnalysis(overrides: Partial<BehaviorAnalysis> = {}): BehaviorAnalysis {
  return {
    confidence_score: 65,
    effort_score: 50,
    frustration_index: 0,
    mastery_signal: 'developing',
    flags: [],
    ...overrides,
  }
}

function makeTask(overrides: Partial<DiagnosisTask> = {}): DiagnosisTask {
  return {
    id: 'task-1',
    skill_id: 'skill-1',
    skill_cluster: 'Algebra',
    question: 'Was ist 2+2?',
    solution: '4',
    common_errors: '',
    coach_hint: '',
    estimated_minutes: 3,
    ...overrides,
  }
}

// ── analyzeBehavior ──────────────────────────────────────────────────────────

describe('analyzeBehavior – confidence_score', () => {
  it('starts at 50 and adds 15 for low revision count', () => {
    const result = analyzeBehavior(makeSnapshot({ revision_count: 1 }))
    expect(result.confidence_score).toBe(65)
  })

  it('adds 20 for long thinking time', () => {
    const result = analyzeBehavior(makeSnapshot({ thinking_time_ms: 5000 }))
    // 50 + 20 (thinking) + 15 (revision<3) = 85
    expect(result.confidence_score).toBe(85)
  })

  it('subtracts 20 for short duration combined with short answer', () => {
    // task_duration < 8000 AND answer_length < 10 → -20; revision_count=5 (not <3) → no +15
    const result = analyzeBehavior(
      makeSnapshot({ task_duration_ms: 3000, answer_length: 5, revision_count: 5 }),
    )
    expect(result.confidence_score).toBe(30)
  })

  it('subtracts 15 for quick hint usage', () => {
    const result = analyzeBehavior(
      makeSnapshot({ hint_used: true, hint_request_time_ms: 2000 }),
    )
    // 50 + 15 (revision<3) - 15 (quick hint) = 50
    expect(result.confidence_score).toBe(50)
  })

  it('clamps confidence to [0, 100]', () => {
    // Force very high: thinking>3000, revision<3, no deductions
    const high = analyzeBehavior(makeSnapshot({ thinking_time_ms: 5000, answer_length: 50 }))
    expect(high.confidence_score).toBeLessThanOrEqual(100)

    // Force very low: many deductions (ensure not clamped below 0)
    const low = analyzeBehavior(
      makeSnapshot({
        task_duration_ms: 3000,
        answer_length: 5,
        revision_count: 5,
        hint_used: true,
        hint_request_time_ms: 1000,
      }),
    )
    expect(low.confidence_score).toBeGreaterThanOrEqual(0)
  })
})

describe('analyzeBehavior – effort_score', () => {
  it('starts at 50 for a neutral snapshot', () => {
    const result = analyzeBehavior(makeSnapshot())
    expect(result.effort_score).toBe(50)
  })

  it('adds 20 for long answer', () => {
    const result = analyzeBehavior(makeSnapshot({ answer_length: 50 }))
    expect(result.effort_score).toBe(70)
  })

  it('adds 15 for long time-after-completion', () => {
    const result = analyzeBehavior(makeSnapshot({ time_after_completion_ms: 3000 }))
    expect(result.effort_score).toBe(65)
  })

  it('subtracts 20 for very short answer', () => {
    // answer_length < 8 but task_duration not < 8000 so confidence -20 not triggered
    const result = analyzeBehavior(
      makeSnapshot({ answer_length: 5, task_duration_ms: 30000 }),
    )
    expect(result.effort_score).toBe(30)
  })

  it('subtracts 10 for many rewrites', () => {
    const result = analyzeBehavior(makeSnapshot({ rewrite_count: 5 }))
    expect(result.effort_score).toBe(40)
  })

  it('clamps effort to [0, 100]', () => {
    const result = analyzeBehavior(
      makeSnapshot({ answer_length: 50, time_after_completion_ms: 5000 }),
    )
    expect(result.effort_score).toBeLessThanOrEqual(100)
  })
})

describe('analyzeBehavior – frustration_index', () => {
  it('is 0 for a calm snapshot', () => {
    const result = analyzeBehavior(makeSnapshot())
    expect(result.frustration_index).toBe(0)
  })

  it('adds 30 for excessive revision count', () => {
    const result = analyzeBehavior(makeSnapshot({ revision_count: 10 }))
    expect(result.frustration_index).toBe(30)
  })

  it('adds 25 for many rewrites', () => {
    const result = analyzeBehavior(makeSnapshot({ rewrite_count: 3 }))
    expect(result.frustration_index).toBe(25)
  })

  it('adds 20 for very long task duration', () => {
    const result = analyzeBehavior(makeSnapshot({ task_duration_ms: 200_000 }))
    expect(result.frustration_index).toBe(20)
  })

  it('accumulates all frustration sources correctly', () => {
    const result = analyzeBehavior(
      makeSnapshot({ revision_count: 10, rewrite_count: 3, task_duration_ms: 200_000 }),
    )
    expect(result.frustration_index).toBe(75)
  })

  it('accumulates all four frustration sources to a maximum of 95', () => {
    // revision>8(+30) + rewrite>1(+25) + duration>180k(+20) + quick-hint+low-rating(+20) = 95
    const result = analyzeBehavior(
      makeSnapshot({
        revision_count: 10,
        rewrite_count: 5,
        task_duration_ms: 200_000,
        hint_used: true,
        hint_request_time_ms: 1000,
        coach_rating: 1,
      }),
    )
    expect(result.frustration_index).toBe(95)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })
})

describe('analyzeBehavior – mastery_signal', () => {
  it('returns "secure" when coach_rating >= 3 and confidence > 65', () => {
    // thinking>3000 → +20, revision<3 → +15 → confidence = 85 > 65
    const result = analyzeBehavior(
      makeSnapshot({ thinking_time_ms: 5000, coach_rating: 3 }),
    )
    expect(result.mastery_signal).toBe('secure')
  })

  it('returns "secure" for coach_rating 4 with high confidence', () => {
    const result = analyzeBehavior(
      makeSnapshot({ thinking_time_ms: 5000, coach_rating: 4 }),
    )
    expect(result.mastery_signal).toBe('secure')
  })

  it('returns "guessing" for quick short answer with no coach_rating', () => {
    // task_duration < 10000 AND answer_length < 8, revision_count=5 (no +15)
    const result = analyzeBehavior(
      makeSnapshot({ task_duration_ms: 3000, answer_length: 5, revision_count: 5 }),
    )
    expect(result.mastery_signal).toBe('guessing')
  })

  it('returns "gap" when coach_rating ≤ 2 and effort > 40', () => {
    // confidence = 50 + 15 = 65 (not > 65), effort = 50 > 40
    const result = analyzeBehavior(makeSnapshot({ coach_rating: 1 }))
    expect(result.mastery_signal).toBe('gap')
  })

  it('returns "gap" for coach_rating 2 with default effort', () => {
    const result = analyzeBehavior(makeSnapshot({ coach_rating: 2 }))
    expect(result.mastery_signal).toBe('gap')
  })

  it('returns "developing" when no specific pattern matches', () => {
    // Default snapshot: confidence=65 (not >65), duration=30000 (not guessing), no coach_rating
    const result = analyzeBehavior(makeSnapshot())
    expect(result.mastery_signal).toBe('developing')
  })
})

describe('analyzeBehavior – flags', () => {
  it('sets "Gibt schnell auf" for hint used within 5 seconds', () => {
    const result = analyzeBehavior(
      makeSnapshot({ hint_used: true, hint_request_time_ms: 2000 }),
    )
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('does not set "Gibt schnell auf" when hint is late', () => {
    const result = analyzeBehavior(
      makeSnapshot({ hint_used: true, hint_request_time_ms: 8000 }),
    )
    expect(result.flags).not.toContain('Gibt schnell auf')
  })

  it('sets "Zeigt Rechenweg selten" for short answer', () => {
    const result = analyzeBehavior(makeSnapshot({ answer_length: 10 }))
    expect(result.flags).toContain('Zeigt Rechenweg selten')
  })

  it('sets "Überprüft Ergebnisse" for long time after completion', () => {
    const result = analyzeBehavior(makeSnapshot({ time_after_completion_ms: 5000 }))
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('sets "Hohe Frustrationstoleranz" for very long task', () => {
    const result = analyzeBehavior(makeSnapshot({ task_duration_ms: 150_000 }))
    expect(result.flags).toContain('Hohe Frustrationstoleranz')
  })

  it('sets "Unsicheres Schreibverhalten" for high revision count', () => {
    const result = analyzeBehavior(makeSnapshot({ revision_count: 8 }))
    expect(result.flags).toContain('Unsicheres Schreibverhalten')
  })

  it('sets "Arbeitet strukturiert" for long answer', () => {
    const result = analyzeBehavior(makeSnapshot({ answer_length: 50 }))
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('returns no flags for a clean, average snapshot', () => {
    // answer_length=20 (not <15, not >40), time=0, revision=1, no hint, duration=30000
    const result = analyzeBehavior(makeSnapshot())
    expect(result.flags).toHaveLength(0)
  })
})

// ── aggregateOverallFlags ────────────────────────────────────────────────────

describe('aggregateOverallFlags', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('includes flag appearing at or above the threshold', () => {
    // threshold for n=5: Math.max(2, ceil(5*0.4)) = 2
    const analyses = [
      makeAnalysis({ flags: ['flag-A'] }),
      makeAnalysis({ flags: ['flag-A'] }),
      makeAnalysis({ flags: ['flag-B'] }),
      makeAnalysis({ flags: [] }),
      makeAnalysis({ flags: [] }),
    ]
    const result = aggregateOverallFlags(analyses)
    expect(result).toContain('flag-A')
  })

  it('excludes flag below the threshold', () => {
    const analyses = [
      makeAnalysis({ flags: ['flag-B'] }),
      makeAnalysis({ flags: [] }),
      makeAnalysis({ flags: [] }),
      makeAnalysis({ flags: [] }),
      makeAnalysis({ flags: [] }),
    ]
    const result = aggregateOverallFlags(analyses)
    expect(result).not.toContain('flag-B')
  })

  it('sorts results by frequency descending', () => {
    // 'flag-A' appears 4x, 'flag-B' appears 2x → flag-A first
    const analyses = [
      makeAnalysis({ flags: ['flag-A', 'flag-B'] }),
      makeAnalysis({ flags: ['flag-A', 'flag-B'] }),
      makeAnalysis({ flags: ['flag-A'] }),
      makeAnalysis({ flags: ['flag-A'] }),
      makeAnalysis({ flags: [] }),
    ]
    const result = aggregateOverallFlags(analyses)
    expect(result[0]).toBe('flag-A')
    expect(result[1]).toBe('flag-B')
  })

  it('uses minimum threshold of 2 even for small sets', () => {
    // n=2: threshold = max(2, ceil(2*0.4)) = max(2,1) = 2 → flag must appear in BOTH
    const analyses = [
      makeAnalysis({ flags: ['rare-flag'] }),
      makeAnalysis({ flags: [] }),
    ]
    expect(aggregateOverallFlags(analyses)).not.toContain('rare-flag')
  })
})

// ── averageMetrics ───────────────────────────────────────────────────────────

describe('averageMetrics', () => {
  it('returns all zeros for empty input', () => {
    expect(averageMetrics([])).toEqual({
      avgConfidence: 0,
      avgEffort: 0,
      avgFrustration: 0,
    })
  })

  it('returns the same values for a single analysis', () => {
    const analyses = [makeAnalysis({ confidence_score: 70, effort_score: 80, frustration_index: 10 })]
    expect(averageMetrics(analyses)).toEqual({
      avgConfidence: 70,
      avgEffort: 80,
      avgFrustration: 10,
    })
  })

  it('computes rounded averages across multiple analyses', () => {
    const analyses = [
      makeAnalysis({ confidence_score: 60, effort_score: 70, frustration_index: 10 }),
      makeAnalysis({ confidence_score: 80, effort_score: 50, frustration_index: 30 }),
    ]
    expect(averageMetrics(analyses)).toEqual({
      avgConfidence: 70,
      avgEffort: 60,
      avgFrustration: 20,
    })
  })

  it('rounds fractional averages', () => {
    const analyses = [
      makeAnalysis({ confidence_score: 65, effort_score: 55, frustration_index: 15 }),
      makeAnalysis({ confidence_score: 66, effort_score: 56, frustration_index: 16 }),
      makeAnalysis({ confidence_score: 67, effort_score: 57, frustration_index: 17 }),
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(66)
    expect(result.avgEffort).toBe(56)
    expect(result.avgFrustration).toBe(16)
  })
})

// ── deriveSkillLevels ────────────────────────────────────────────────────────

describe('deriveSkillLevels', () => {
  it('derives "Sicher" label for high coach_rating and high confidence', () => {
    // baseLevel = 3*2=6, conf=0.85, level = round(6+(0.85-0.5)*4) = round(7.4) = 7
    const tasks = [makeTask({ skill_cluster: 'Algebra' })]
    const snaps = [makeSnapshot({ coach_rating: 3 })]
    const analyses = [makeAnalysis({ confidence_score: 85 })]

    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(1)
    expect(result[0]?.skill_cluster).toBe('Algebra')
    expect(result[0]?.label).toBe('Sicher')
    expect(result[0]?.level).toBe(7)
  })

  it('derives "Lücke" label for low coach_rating and low confidence', () => {
    // baseLevel = 1*2=2, conf=0.3, level = round(2+(0.3-0.5)*4) = round(1.2) = 1
    const tasks = [makeTask({ skill_cluster: 'Geometrie' })]
    const snaps = [makeSnapshot({ coach_rating: 1 })]
    const analyses = [makeAnalysis({ confidence_score: 30 })]

    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result[0]?.label).toBe('Lücke')
    expect(result[0]?.level).toBe(1)
  })

  it('derives "Erkennbar" label for mid-range performance', () => {
    // baseLevel = 2*2=4, conf=0.5, level = round(4+0) = 4
    const tasks = [makeTask({ skill_cluster: 'Analysis' })]
    const snaps = [makeSnapshot({ coach_rating: 2 })]
    const analyses = [makeAnalysis({ confidence_score: 50 })]

    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result[0]?.label).toBe('Erkennbar')
    expect(result[0]?.level).toBe(4)
  })

  it('groups multiple tasks by skill_cluster and averages levels', () => {
    const tasks = [
      makeTask({ id: 'task-1', skill_cluster: 'Algebra' }),
      makeTask({ id: 'task-2', skill_cluster: 'Algebra' }),
    ]
    // Both have coach_rating=3, confidence=85 → level=7 each → avg=7
    const snaps = [makeSnapshot({ coach_rating: 3 }), makeSnapshot({ coach_rating: 3 })]
    const analyses = [
      makeAnalysis({ confidence_score: 85 }),
      makeAnalysis({ confidence_score: 85 }),
    ]

    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(1)
    expect(result[0]?.skill_cluster).toBe('Algebra')
  })

  it('uses baseLevel=5 when coach_rating is null', () => {
    // baseLevel=5, conf=0.5, level=round(5+0)=5 → 'Erkennbar'
    const tasks = [makeTask({ skill_cluster: 'Statistik' })]
    const snaps = [makeSnapshot({ coach_rating: null })]
    const analyses = [makeAnalysis({ confidence_score: 50 })]

    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result[0]?.level).toBe(5)
    expect(result[0]?.label).toBe('Erkennbar')
  })
})

// ── recommendFocus ───────────────────────────────────────────────────────────

describe('recommendFocus', () => {
  it('returns the two weakest skill clusters', () => {
    const skillLevels = [
      { skill_cluster: 'Algebra', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'Geometrie', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'Analysis', level: 8, label: 'Sicher' as const },
    ]
    const result = recommendFocus(skillLevels)
    expect(result).toHaveLength(2)
    expect(result[0]?.skill_cluster).toBe('Geometrie')
    expect(result[1]?.skill_cluster).toBe('Algebra')
  })

  it('returns all clusters when fewer than 2', () => {
    const skillLevels = [{ skill_cluster: 'Algebra', level: 3, label: 'Lücke' as const }]
    const result = recommendFocus(skillLevels)
    expect(result).toHaveLength(1)
  })

  it('does not mutate the original array', () => {
    const skillLevels = [
      { skill_cluster: 'A', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
    ]
    const original = [...skillLevels]
    recommendFocus(skillLevels)
    expect(skillLevels).toEqual(original)
  })
})

// ── buildDiagnosisResult ──────────────────────────────────────────────────────

describe('buildDiagnosisResult', () => {
  it('builds a complete DiagnosisResult from raw inputs', () => {
    const tasks = [makeTask()]
    const snapshots = [makeSnapshot({ coach_rating: 3 })]

    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Lena Fischer',
      subject: 'Mathematik',
      date: '2026-05-17',
      coachNote: 'Gute Leistung',
    })

    expect(result.student_name).toBe('Lena Fischer')
    expect(result.subject).toBe('Mathematik')
    expect(result.date).toBe('2026-05-17')
    expect(result.coach_note).toBe('Gute Leistung')
    expect(result.snapshots).toEqual(snapshots)
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
    expect(Array.isArray(result.overall_behavior_flags)).toBe(true)
  })

  it('produces one analysis per snapshot', () => {
    const tasks = [makeTask(), makeTask({ id: 'task-2', skill_cluster: 'Geometrie' })]
    const snapshots = [makeSnapshot(), makeSnapshot({ task_id: 'task-2' })]

    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Test',
      subject: 'Mathe',
      date: '2026-01-01',
      coachNote: '',
    })

    expect(result.analyses).toHaveLength(2)
    expect(result.skill_levels).toHaveLength(2)
  })
})
