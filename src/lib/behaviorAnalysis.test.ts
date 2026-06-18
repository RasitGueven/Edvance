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

function makeSnap(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
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
    answer_text: 'Die Lösung ist x=5',
    coach_rating: 3,
    ...overrides,
  }
}

describe('analyzeBehavior', () => {
  it('gibt Basis-Scores für neutralen Snapshot zurück', () => {
    const snap = makeSnap()
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('erhöht Confidence bei langer Bedenkzeit', () => {
    const niedrig = analyzeBehavior(makeSnap({ thinking_time_ms: 1000 }))
    const hoch = analyzeBehavior(makeSnap({ thinking_time_ms: 4000 }))
    expect(hoch.confidence_score).toBeGreaterThan(niedrig.confidence_score)
  })

  it('senkt Confidence bei schneller Eingabe + kurzer Antwort', () => {
    const normal = analyzeBehavior(makeSnap())
    const rateversuch = analyzeBehavior(makeSnap({ task_duration_ms: 5000, answer_length: 5 }))
    expect(rateversuch.confidence_score).toBeLessThan(normal.confidence_score)
  })

  it('erhöht Effort bei langer Antwort', () => {
    const kurz = analyzeBehavior(makeSnap({ answer_length: 5 }))
    const lang = analyzeBehavior(makeSnap({ answer_length: 50 }))
    expect(lang.effort_score).toBeGreaterThan(kurz.effort_score)
  })

  it('erhöht Frustration bei vielen Revisionen', () => {
    const normal = analyzeBehavior(makeSnap({ revision_count: 1 }))
    const viel = analyzeBehavior(makeSnap({ revision_count: 10 }))
    expect(viel.frustration_index).toBeGreaterThan(normal.frustration_index)
  })

  it('setzt mastery_signal auf "secure" bei gutem Coach-Rating + hoher Confidence', () => {
    const snap = makeSnap({
      coach_rating: 4,
      thinking_time_ms: 5000,
      revision_count: 1,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('secure')
  })

  it('setzt mastery_signal auf "guessing" bei sehr schneller kurzer Antwort', () => {
    const snap = makeSnap({
      coach_rating: null,
      task_duration_ms: 3000,
      answer_length: 5,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('guessing')
  })

  it('setzt mastery_signal auf "gap" bei schlechtem Rating + gutem Effort', () => {
    const snap = makeSnap({
      coach_rating: 1,
      task_duration_ms: 60_000,
      answer_length: 35,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('gap')
  })

  it('fügt "Gibt schnell auf"-Flag bei Hint unter 5s hinzu', () => {
    const snap = makeSnap({
      hint_used: true,
      hint_request_time_ms: 3000,
    })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('fügt "Überprüft Ergebnisse"-Flag bei langer Nachprüfzeit hinzu', () => {
    const snap = makeSnap({ time_after_completion_ms: 5000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('fügt "Arbeitet strukturiert"-Flag bei langer Antwort hinzu', () => {
    const snap = makeSnap({ answer_length: 50 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('clampst Scores auf 0–100', () => {
    // Alle negativen Modifikatoren auf einmal → trotzdem ≥ 0
    const snap = makeSnap({
      thinking_time_ms: 100,
      revision_count: 15,
      task_duration_ms: 5000,
      answer_length: 3,
      hint_used: true,
      hint_request_time_ms: 1000,
      rewrite_count: 5,
    })
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
  })
})

describe('aggregateOverallFlags', () => {
  it('gibt leeres Array bei keinen Analysen zurück', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('filtert Flags unter dem Schwellwert heraus', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: ['A'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: ['B'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: ['B'] },
    ]
    // 3 Analysen → Schwellwert = max(2, ceil(3*0.4)) = max(2,2) = 2
    // A: 1x → gefiltert; B: 2x → bleibt
    const result = aggregateOverallFlags(analyses)
    expect(result).not.toContain('A')
    expect(result).toContain('B')
  })

  it('sortiert nach Häufigkeit (absteigend)', () => {
    const analyses: BehaviorAnalysis[] = Array.from({ length: 5 }, (_, i) => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: i < 3 ? ['Selten', 'Häufig'] : ['Häufig'],
    }))
    const result = aggregateOverallFlags(analyses)
    expect(result[0]).toBe('Häufig')
  })
})

describe('averageMetrics', () => {
  it('gibt Nullen bei leeren Analysen zurück', () => {
    expect(averageMetrics([])).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('berechnet Durchschnitt korrekt', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 60, effort_score: 70, frustration_index: 20, mastery_signal: 'developing', flags: [] },
      { confidence_score: 80, effort_score: 90, frustration_index: 40, mastery_signal: 'secure', flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(80)
    expect(result.avgFrustration).toBe(30)
  })

  it('rundet auf ganze Zahlen', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 33, effort_score: 33, frustration_index: 33, mastery_signal: 'developing', flags: [] },
      { confidence_score: 34, effort_score: 34, frustration_index: 34, mastery_signal: 'developing', flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
    expect(Number.isInteger(result.avgEffort)).toBe(true)
    expect(Number.isInteger(result.avgFrustration)).toBe(true)
  })
})

describe('deriveSkillLevels', () => {
  const tasks: DiagnosisTask[] = [
    { id: 't1', skill_id: 's1', skill_cluster: 'Algebra', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 },
    { id: 't2', skill_id: 's2', skill_cluster: 'Geometrie', question: '', solution: '', common_errors: '', coach_hint: '', estimated_minutes: 5 },
  ]

  it('gibt SkillLevelEntries für alle Cluster zurück', () => {
    const snaps = [makeSnap({ coach_rating: 4 }), makeSnap({ coach_rating: 2 })]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.skill_cluster)).toContain('Algebra')
    expect(result.map(r => r.skill_cluster)).toContain('Geometrie')
  })

  it('Level liegt zwischen 1 und 10', () => {
    const snaps = [makeSnap({ coach_rating: 3 }), makeSnap({ coach_rating: 1 })]
    const analyses = snaps.map(s => analyzeBehavior(s))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    result.forEach(r => {
      expect(r.level).toBeGreaterThanOrEqual(1)
      expect(r.level).toBeLessThanOrEqual(10)
    })
  })

  it('vergibt "Lücke"-Label bei niedrigem Level', () => {
    const snap = makeSnap({ coach_rating: 1, thinking_time_ms: 100, revision_count: 10 })
    const analysis = analyzeBehavior(snap)
    const result = deriveSkillLevels(
      [tasks[0]],
      [snap],
      [analysis],
    )
    expect(result[0].label).toBe('Lücke')
  })

  it('vergibt "Sicher"-Label bei hohem Level', () => {
    const snap = makeSnap({ coach_rating: 4, thinking_time_ms: 5000, revision_count: 0 })
    const analysis = analyzeBehavior(snap)
    const result = deriveSkillLevels(
      [tasks[0]],
      [snap],
      [analysis],
    )
    expect(result[0].label).toBe('Sicher')
  })
})

describe('recommendFocus', () => {
  it('gibt die 2 schwächsten Cluster zurück', () => {
    const levels = [
      { skill_cluster: 'A', level: 7, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 2, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('D')
    expect(result[1].skill_cluster).toBe('B')
  })

  it('gibt alle zurück wenn weniger als 2 vorhanden', () => {
    const levels = [{ skill_cluster: 'A', level: 5, label: 'Erkennbar' as const }]
    expect(recommendFocus(levels)).toHaveLength(1)
  })

  it('verändert das Original-Array nicht', () => {
    const levels = [
      { skill_cluster: 'A', level: 7, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
    ]
    const originalOrder = [...levels]
    recommendFocus(levels)
    expect(levels[0].skill_cluster).toBe(originalOrder[0].skill_cluster)
  })
})

describe('buildDiagnosisResult', () => {
  it('erstellt vollständiges DiagnosisResult', () => {
    const tasks: DiagnosisTask[] = [
      { id: 't1', skill_id: 's1', skill_cluster: 'Algebra', question: 'Q', solution: 'A', common_errors: '', coach_hint: '', estimated_minutes: 5 },
    ]
    const snaps = [makeSnap({ coach_rating: 3 })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots: snaps,
      studentName: 'Anna Schmidt',
      subject: 'Mathematik',
      date: '2024-06-18',
      coachNote: 'Gute Leistung',
    })
    expect(result.student_name).toBe('Anna Schmidt')
    expect(result.subject).toBe('Mathematik')
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
    expect(result.coach_note).toBe('Gute Leistung')
  })
})
