import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from '@/lib/behaviorAnalysis'
import type { BehaviorSnapshot, DiagnosisTask, BehaviorAnalysis } from '@/types/diagnosis'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseSnapshot = (): BehaviorSnapshot => ({
  task_id: 'task-1',
  thinking_time_ms: 5000,
  task_duration_ms: 20000,
  revision_count: 1,
  rewrite_count: 0,
  hint_used: false,
  hint_request_time_ms: null,
  answer_length: 50,
  time_after_completion_ms: 1000,
  answer_text: 'Eine lange Antwort mit viel Inhalt und strukturierten Gedanken',
  coach_rating: 4,
})

const baseTask = (cluster = 'Zahlenrechnen'): DiagnosisTask => ({
  id: 'task-1',
  skill_id: 'M8.ZR.01',
  skill_cluster: cluster,
  question: 'Berechne ...',
  solution: '42',
  common_errors: 'Vorzeichenfehler',
  coach_hint: 'Schritt für Schritt',
  estimated_minutes: 3,
})

// ── analyzeBehavior ───────────────────────────────────────────────────────────

describe('analyzeBehavior', () => {
  it('returns "secure" mastery for high rating + high confidence', () => {
    const snap = baseSnapshot()
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('secure')
    expect(result.confidence_score).toBeGreaterThan(65)
  })

  it('returns "guessing" when answer is very short and fast', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnapshot(),
      task_duration_ms: 5000,
      answer_length: 3,
      coach_rating: null,
    }
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('guessing')
  })

  it('returns "gap" when coach rates low and effort is present', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnapshot(),
      coach_rating: 2,
      answer_length: 40,
      revision_count: 2,
    }
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('gap')
  })

  it('returns "developing" as default mastery', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnapshot(),
      coach_rating: null,
      thinking_time_ms: 100,
      answer_length: 20,
      task_duration_ms: 15000,
    }
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('developing')
  })

  it('clamps confidence score between 0 and 100', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnapshot(),
      thinking_time_ms: 99999,
      revision_count: 0,
      hint_used: false,
    }
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
  })

  it('clamps frustration_index between 0 and 100', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnapshot(),
      revision_count: 15,
      rewrite_count: 5,
      task_duration_ms: 200_000,
      hint_used: true,
      hint_request_time_ms: 2000,
      coach_rating: 1,
    }
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('adds "Gibt schnell auf" flag when hint used very early', () => {
    const snap: BehaviorSnapshot = {
      ...baseSnapshot(),
      hint_used: true,
      hint_request_time_ms: 3000,
    }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('adds "Zeigt Rechenweg selten" flag for short answers', () => {
    const snap: BehaviorSnapshot = { ...baseSnapshot(), answer_length: 10 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Zeigt Rechenweg selten')
  })

  it('adds "Überprüft Ergebnisse" flag when time after completion is high', () => {
    const snap: BehaviorSnapshot = { ...baseSnapshot(), time_after_completion_ms: 5000 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('adds "Hohe Frustrationstoleranz" flag for very long tasks', () => {
    const snap: BehaviorSnapshot = { ...baseSnapshot(), task_duration_ms: 150_000 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Hohe Frustrationstoleranz')
  })

  it('adds "Unsicheres Schreibverhalten" flag for high revision count', () => {
    const snap: BehaviorSnapshot = { ...baseSnapshot(), revision_count: 8 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Unsicheres Schreibverhalten')
  })

  it('adds "Arbeitet strukturiert" flag for long answers', () => {
    const snap: BehaviorSnapshot = { ...baseSnapshot(), answer_length: 50 }
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Arbeitet strukturiert')
  })
})

// ── aggregateOverallFlags ─────────────────────────────────────────────────────

describe('aggregateOverallFlags', () => {
  it('returns empty array for empty analyses list', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('returns flags that appear in at least 40% of analyses', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 70, effort_score: 60, frustration_index: 10, mastery_signal: 'secure', flags: ['Überprüft Ergebnisse'] },
      { confidence_score: 60, effort_score: 55, frustration_index: 15, mastery_signal: 'developing', flags: ['Überprüft Ergebnisse'] },
      { confidence_score: 50, effort_score: 45, frustration_index: 20, mastery_signal: 'developing', flags: ['Zeigt Rechenweg selten'] },
    ]
    const flags = aggregateOverallFlags(analyses)
    expect(flags).toContain('Überprüft Ergebnisse')
    expect(flags).not.toContain('Zeigt Rechenweg selten')
  })

  it('uses minimum threshold of 2 for small sets', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 70, effort_score: 60, frustration_index: 10, mastery_signal: 'secure', flags: ['flag-a'] },
      { confidence_score: 60, effort_score: 55, frustration_index: 15, mastery_signal: 'developing', flags: ['flag-a'] },
    ]
    const flags = aggregateOverallFlags(analyses)
    expect(flags).toContain('flag-a')
  })

  it('sorts flags by frequency descending', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 70, effort_score: 60, frustration_index: 10, mastery_signal: 'secure', flags: ['A', 'B'] },
      { confidence_score: 60, effort_score: 55, frustration_index: 15, mastery_signal: 'developing', flags: ['A', 'B'] },
      { confidence_score: 50, effort_score: 45, frustration_index: 20, mastery_signal: 'developing', flags: ['A'] },
    ]
    const flags = aggregateOverallFlags(analyses)
    expect(flags[0]).toBe('A')
  })
})

// ── averageMetrics ────────────────────────────────────────────────────────────

describe('averageMetrics', () => {
  it('returns zeros for empty array', () => {
    const result = averageMetrics([])
    expect(result).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('correctly averages metrics', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 80, effort_score: 60, frustration_index: 20, mastery_signal: 'secure', flags: [] },
      { confidence_score: 60, effort_score: 40, frustration_index: 40, mastery_signal: 'developing', flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(50)
    expect(result.avgFrustration).toBe(30)
  })

  it('rounds averages to integer', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 80, effort_score: 70, frustration_index: 10, mastery_signal: 'secure', flags: [] },
      { confidence_score: 81, effort_score: 70, frustration_index: 10, mastery_signal: 'secure', flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
  })
})

// ── deriveSkillLevels ─────────────────────────────────────────────────────────

describe('deriveSkillLevels', () => {
  it('returns empty array when tasks is empty', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })

  it('groups tasks by skill_cluster', () => {
    const tasks = [
      baseTask('Algebra'),
      baseTask('Algebra'),
      baseTask('Geometrie'),
    ]
    const snaps = tasks.map(() => ({ ...baseSnapshot(), coach_rating: 3 as 3 }))
    const analyses = snaps.map(s => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    const clusters = result.map(r => r.skill_cluster)
    expect(clusters).toContain('Algebra')
    expect(clusters).toContain('Geometrie')
    expect(result).toHaveLength(2)
  })

  it('assigns label "Lücke" for level <= 3', () => {
    const task = baseTask('Bruchrechnung')
    const snap: BehaviorSnapshot = { ...baseSnapshot(), coach_rating: 1 }
    const analysis = analyzeBehavior(snap)
    // Force confidence very low
    const lowConfidenceAnalysis: BehaviorAnalysis = { ...analysis, confidence_score: 10 }
    const result = deriveSkillLevels([task], [snap], [lowConfidenceAnalysis])
    expect(result[0].label).toBe('Lücke')
  })

  it('assigns label "Sicher" for level > 6', () => {
    const task = baseTask('Zahlenrechnen')
    const snap: BehaviorSnapshot = { ...baseSnapshot(), coach_rating: 4 }
    const analysis = analyzeBehavior(snap)
    const highConfidenceAnalysis: BehaviorAnalysis = { ...analysis, confidence_score: 90 }
    const result = deriveSkillLevels([task], [snap], [highConfidenceAnalysis])
    expect(result[0].label).toBe('Sicher')
  })

  it('skips entry when snap or analysis is missing', () => {
    const tasks = [baseTask('A'), baseTask('B')]
    const snaps = [baseSnapshot()]
    const analyses = [analyzeBehavior(snaps[0])]
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(1)
  })
})

// ── recommendFocus ────────────────────────────────────────────────────────────

describe('recommendFocus', () => {
  it('returns the 2 weakest skill clusters', () => {
    const skillLevels = [
      { skill_cluster: 'Algebra', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'Bruchrechnung', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'Geometrie', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'Zahlen', level: 1, label: 'Lücke' as const },
    ]
    const result = recommendFocus(skillLevels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('Zahlen')
    expect(result[1].skill_cluster).toBe('Bruchrechnung')
  })

  it('returns all entries if fewer than 2', () => {
    const skillLevels = [{ skill_cluster: 'Algebra', level: 3, label: 'Lücke' as const }]
    const result = recommendFocus(skillLevels)
    expect(result).toHaveLength(1)
  })

  it('does not mutate original array', () => {
    const skillLevels = [
      { skill_cluster: 'A', level: 7, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
    ]
    const original = [...skillLevels]
    recommendFocus(skillLevels)
    expect(skillLevels).toEqual(original)
  })
})

// ── buildDiagnosisResult ──────────────────────────────────────────────────────

describe('buildDiagnosisResult', () => {
  it('builds a complete DiagnosisResult', () => {
    const tasks = [baseTask('Algebra'), baseTask('Geometrie')]
    const snapshots = [baseSnapshot(), { ...baseSnapshot(), task_id: 'task-2' }]
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Max Mustermann',
      subject: 'Mathematik',
      date: '2024-05-01',
      coachNote: 'Guter Fortschritt',
    })
    expect(result.student_name).toBe('Max Mustermann')
    expect(result.subject).toBe('Mathematik')
    expect(result.date).toBe('2024-05-01')
    expect(result.analyses).toHaveLength(2)
    expect(result.skill_levels.length).toBeGreaterThan(0)
    expect(result.coach_note).toBe('Guter Fortschritt')
  })

  it('analyses array has same length as snapshots', () => {
    const tasks = [baseTask()]
    const snapshots = [baseSnapshot()]
    const result = buildDiagnosisResult({
      tasks,
      snapshots,
      studentName: 'Test',
      subject: 'Mathe',
      date: '2024-01-01',
      coachNote: '',
    })
    expect(result.analyses).toHaveLength(result.snapshots.length)
  })
})
