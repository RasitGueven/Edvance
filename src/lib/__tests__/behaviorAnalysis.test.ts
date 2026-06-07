import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from '../behaviorAnalysis'
import type { BehaviorSnapshot, DiagnosisTask } from '@/types/diagnosis'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 5000,
    task_duration_ms: 30_000,
    revision_count: 2,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 50,
    time_after_completion_ms: 1000,
    answer_text: 'Meine Antwort',
    coach_rating: null,
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
    estimated_minutes: 5,
    ...overrides,
  }
}

// ── analyzeBehavior ───────────────────────────────────────────────────────────

describe('analyzeBehavior', () => {
  it('returns scores between 0 and 100', () => {
    const result = analyzeBehavior(makeSnapshot())
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('boosts confidence for long thinking time', () => {
    const low = analyzeBehavior(makeSnapshot({ thinking_time_ms: 100 }))
    const high = analyzeBehavior(makeSnapshot({ thinking_time_ms: 5000 }))
    expect(high.confidence_score).toBeGreaterThan(low.confidence_score)
  })

  it('reduces confidence for quick short answers', () => {
    // Override defaults: no thinking-time bonus, revision_count≥3 (no +15), quick+short → -20
    const snap = makeSnapshot({ task_duration_ms: 3000, answer_length: 5, thinking_time_ms: 100, revision_count: 5 })
    const result = analyzeBehavior(snap)
    // Base 50 - 20 (quick+short) = 30
    expect(result.confidence_score).toBeLessThanOrEqual(40)
  })

  it('adds effort for long answers', () => {
    const short = analyzeBehavior(makeSnapshot({ answer_length: 5 }))
    const long = analyzeBehavior(makeSnapshot({ answer_length: 50 }))
    expect(long.effort_score).toBeGreaterThan(short.effort_score)
  })

  it('raises frustration for many revisions', () => {
    const calmSnap = makeSnapshot({ revision_count: 1 })
    const frustratedSnap = makeSnapshot({ revision_count: 10 })
    const calm = analyzeBehavior(calmSnap)
    const frustrated = analyzeBehavior(frustratedSnap)
    expect(frustrated.frustration_index).toBeGreaterThan(calm.frustration_index)
  })

  it('signals "secure" mastery for high coach rating + confidence', () => {
    const snap = makeSnapshot({
      coach_rating: 4,
      thinking_time_ms: 6000,
      revision_count: 1,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('secure')
  })

  it('signals "guessing" for very fast + very short answers', () => {
    const snap = makeSnapshot({
      task_duration_ms: 3000,
      answer_length: 5,
      thinking_time_ms: 100,
      revision_count: 0,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('guessing')
  })

  it('signals "gap" for low coach rating + sufficient effort', () => {
    const snap = makeSnapshot({
      coach_rating: 1,
      answer_length: 50,
      time_after_completion_ms: 2500,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('gap')
  })

  it('adds "Zeigt Rechenweg selten" flag for short answer', () => {
    const snap = makeSnapshot({ answer_length: 10 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Zeigt Rechenweg selten')
  })

  it('adds "Überprüft Ergebnisse" flag for high post-completion time', () => {
    const snap = makeSnapshot({ time_after_completion_ms: 4000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('adds "Arbeitet strukturiert" flag for very long answers', () => {
    const snap = makeSnapshot({ answer_length: 50 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('adds "Gibt schnell auf" for early hint use', () => {
    const snap = makeSnapshot({ hint_used: true, hint_request_time_ms: 2000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('does NOT add "Gibt schnell auf" for late hint use', () => {
    const snap = makeSnapshot({ hint_used: true, hint_request_time_ms: 10_000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).not.toContain('Gibt schnell auf')
  })
})

// ── aggregateOverallFlags ─────────────────────────────────────────────────────

describe('aggregateOverallFlags', () => {
  it('returns empty array for empty analyses', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('includes flag appearing in ≥40% of analyses', () => {
    const flag = 'Zeigt Rechenweg selten'
    const analyses = Array.from({ length: 5 }, () => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: [flag],
    }))
    const result = aggregateOverallFlags(analyses)
    expect(result).toContain(flag)
  })

  it('excludes flag appearing in <40% of analyses (and <2 total)', () => {
    const analyses = Array.from({ length: 10 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: i === 0 ? ['Seltenes Flag'] : [],
    }))
    const result = aggregateOverallFlags(analyses)
    expect(result).not.toContain('Seltenes Flag')
  })

  it('orders flags by frequency (highest first)', () => {
    const analyses = [
      { ...makeAnalysis(['A', 'A', 'B']) },
      { ...makeAnalysis(['A', 'B']) },
      { ...makeAnalysis(['A']) },
    ]
    // Expand to proper shape
    const shaped = analyses.map(() => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: [] as string[],
    }))
    shaped[0].flags = ['A', 'B']
    shaped[1].flags = ['A', 'B']
    shaped[2].flags = ['A']
    const result = aggregateOverallFlags(shaped)
    // A appears 3x, B appears 2x — both ≥ threshold (max(2, ceil(3*0.4))=2)
    expect(result[0]).toBe('A')
  })
})

function makeAnalysis(flags: string[]) {
  return {
    confidence_score: 50,
    effort_score: 50,
    frustration_index: 0,
    mastery_signal: 'developing' as const,
    flags,
  }
}

// ── averageMetrics ────────────────────────────────────────────────────────────

describe('averageMetrics', () => {
  it('returns zeros for empty array', () => {
    expect(averageMetrics([])).toEqual({
      avgConfidence: 0,
      avgEffort: 0,
      avgFrustration: 0,
    })
  })

  it('computes correct averages', () => {
    const analyses = [
      makeAnalysis([]),
      makeAnalysis([]),
    ].map((a, i) => ({
      ...a,
      confidence_score: i === 0 ? 60 : 80,
      effort_score: i === 0 ? 40 : 60,
      frustration_index: i === 0 ? 10 : 30,
    }))

    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(50)
    expect(result.avgFrustration).toBe(20)
  })

  it('rounds to nearest integer', () => {
    const analyses = [1, 2].map((score) => ({
      confidence_score: score * 33,
      effort_score: score * 33,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: [],
    }))
    const result = averageMetrics(analyses)
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
  })
})

// ── deriveSkillLevels ─────────────────────────────────────────────────────────

describe('deriveSkillLevels', () => {
  it('groups by skill_cluster', () => {
    const tasks = [
      makeTask({ skill_cluster: 'Algebra' }),
      makeTask({ skill_cluster: 'Geometrie' }),
    ]
    const snapshots = [
      makeSnapshot({ coach_rating: 3 }),
      makeSnapshot({ coach_rating: 2 }),
    ]
    const analyses = snapshots.map(analyzeBehavior)
    const result = deriveSkillLevels(tasks, snapshots, analyses)
    const clusters = result.map((r) => r.skill_cluster)
    expect(clusters).toContain('Algebra')
    expect(clusters).toContain('Geometrie')
  })

  it('assigns "Sicher" label for level ≥7', () => {
    const tasks = [makeTask({ skill_cluster: 'Algebra' })]
    // coach_rating=4 → baseLevel=8; confidence should be >0.5 to push higher
    const snapshots = [makeSnapshot({ coach_rating: 4, thinking_time_ms: 10000, revision_count: 0 })]
    const analyses = snapshots.map(analyzeBehavior)
    const result = deriveSkillLevels(tasks, snapshots, analyses)
    expect(result[0].label).toBe('Sicher')
  })

  it('assigns "Lücke" label for level ≤3', () => {
    const tasks = [makeTask({ skill_cluster: 'Algebra' })]
    // coach_rating=1 → baseLevel=2; with low confidence → level stays low
    const snapshots = [makeSnapshot({ coach_rating: 1, thinking_time_ms: 100, answer_length: 3, task_duration_ms: 3000 })]
    const analyses = snapshots.map(analyzeBehavior)
    const result = deriveSkillLevels(tasks, snapshots, analyses)
    expect(result[0].label).toBe('Lücke')
  })

  it('returns empty array when tasks/snapshots arrays are empty', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })
})

// ── recommendFocus ────────────────────────────────────────────────────────────

describe('recommendFocus', () => {
  it('returns the 2 weakest clusters', () => {
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

  it('returns all entries if fewer than 2', () => {
    const single = [{ skill_cluster: 'A', level: 5, label: 'Erkennbar' as const }]
    expect(recommendFocus(single)).toHaveLength(1)
  })

  it('does not mutate original array order', () => {
    const skillLevels = [
      { skill_cluster: 'A', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'B', level: 7, label: 'Sicher' as const },
    ]
    recommendFocus(skillLevels)
    expect(skillLevels[0].skill_cluster).toBe('A')
  })
})

// ── buildDiagnosisResult ──────────────────────────────────────────────────────

describe('buildDiagnosisResult', () => {
  it('builds a complete diagnosis result', () => {
    const tasks = [makeTask()]
    const snapshots = [makeSnapshot({ coach_rating: 3 })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Lena Müller',
      subject: 'Mathematik',
      date: '2024-06-01',
      coachNote: 'Guter Einsatz',
    })
    expect(result.student_name).toBe('Lena Müller')
    expect(result.subject).toBe('Mathematik')
    expect(result.date).toBe('2024-06-01')
    expect(result.coach_note).toBe('Guter Einsatz')
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
    expect(Array.isArray(result.overall_behavior_flags)).toBe(true)
  })

  it('runs analyzeBehavior for each snapshot', () => {
    const tasks = [makeTask(), makeTask({ id: 'task-2', skill_cluster: 'Geometrie' })]
    const snapshots = [makeSnapshot(), makeSnapshot({ task_id: 'task-2' })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Tim',
      subject: 'Mathe',
      date: '2024-06-01',
      coachNote: '',
    })
    expect(result.analyses).toHaveLength(2)
  })
})
