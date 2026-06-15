import { describe, it, expect } from 'vitest'
import {
  analyzeBehavior,
  aggregateOverallFlags,
  averageMetrics,
  deriveSkillLevels,
  recommendFocus,
  buildDiagnosisResult,
} from '@/lib/behaviorAnalysis'
import type { BehaviorSnapshot, BehaviorAnalysis, DiagnosisTask } from '@/types/diagnosis'

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 5000,
    task_duration_ms: 30_000,
    revision_count: 1,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 50,
    time_after_completion_ms: 1000,
    answer_text: 'Meine Antwort ist vollständig ausgearbeitet.',
    coach_rating: 3,
    ...overrides,
  }
}

function makeTask(cluster: string, idx = 0): DiagnosisTask {
  return {
    id: `task-${idx}`,
    skill_id: `skill-${idx}`,
    skill_cluster: cluster,
    question: 'Frage?',
    solution: 'Lösung',
    common_errors: 'Fehler',
    coach_hint: 'Hinweis',
    estimated_minutes: 3,
  }
}

// ── analyzeBehavior ──────────────────────────────────────────────────────────

describe('analyzeBehavior()', () => {
  it('gibt Werte im gültigen Bereich zurück (0-100)', () => {
    const snap = makeSnapshot()
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
    expect(result.effort_score).toBeGreaterThanOrEqual(0)
    expect(result.effort_score).toBeLessThanOrEqual(100)
    expect(result.frustration_index).toBeGreaterThanOrEqual(0)
    expect(result.frustration_index).toBeLessThanOrEqual(100)
  })

  it('erhöht confidence bei langem Denken und wenigen Revisionen', () => {
    const snap = makeSnapshot({ thinking_time_ms: 10_000, revision_count: 1 })
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThan(50)
  })

  it('reduziert confidence bei schneller kurzer Antwort', () => {
    const snap = makeSnapshot({
      task_duration_ms: 3000,
      answer_length: 5,
      thinking_time_ms: 0,
      revision_count: 10,
    })
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeLessThan(50)
  })

  it('erkennt mastery_signal "secure" bei gutem Rating und hoher Confidence', () => {
    const snap = makeSnapshot({
      coach_rating: 4,
      thinking_time_ms: 8000,
      revision_count: 1,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('secure')
  })

  it('erkennt mastery_signal "guessing" bei sehr kurzer Antwort und Dauer', () => {
    const snap = makeSnapshot({
      task_duration_ms: 4000,
      answer_length: 3,
      coach_rating: null,
    })
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('guessing')
  })

  it('erkennt mastery_signal "gap" bei schlechtem Rating und Bemühen', () => {
    const snap = makeSnapshot({
      coach_rating: 1,
      effort_score: 70,
      answer_length: 50,
    } as Partial<BehaviorSnapshot>)
    const result = analyzeBehavior(snap)
    expect(result.mastery_signal).toBe('gap')
  })

  it('erhöht frustration_index bei vielen Revisionen', () => {
    const snap = makeSnapshot({ revision_count: 10, rewrite_count: 3 })
    const result = analyzeBehavior(snap)
    expect(result.frustration_index).toBeGreaterThan(0)
  })

  it('setzt flag "Gibt schnell auf" bei frühem Hint', () => {
    const snap = makeSnapshot({ hint_used: true, hint_request_time_ms: 2000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Gibt schnell auf')
  })

  it('setzt flag "Überprüft Ergebnisse" bei langer Nachbearbeitungszeit', () => {
    const snap = makeSnapshot({ time_after_completion_ms: 5000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Überprüft Ergebnisse')
  })

  it('setzt flag "Arbeitet strukturiert" bei langer Antwort', () => {
    const snap = makeSnapshot({ answer_length: 60 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Arbeitet strukturiert')
  })

  it('setzt flag "Zeigt Rechenweg selten" bei kurzer Antwort', () => {
    const snap = makeSnapshot({ answer_length: 10 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Zeigt Rechenweg selten')
  })

  it('setzt flag "Hohe Frustrationstoleranz" bei sehr langer Bearbeitungszeit', () => {
    const snap = makeSnapshot({ task_duration_ms: 150_000 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Hohe Frustrationstoleranz')
  })

  it('setzt flag "Unsicheres Schreibverhalten" bei vielen Revisionen', () => {
    const snap = makeSnapshot({ revision_count: 8 })
    const result = analyzeBehavior(snap)
    expect(result.flags).toContain('Unsicheres Schreibverhalten')
  })

  it('gibt leere flags-Liste zurück für unauffälligen Schüler', () => {
    const snap = makeSnapshot({
      hint_used: false,
      answer_length: 30,
      time_after_completion_ms: 1000,
      task_duration_ms: 60_000,
      revision_count: 3,
    })
    const result = analyzeBehavior(snap)
    expect(result.flags).toHaveLength(0)
  })
})

// ── aggregateOverallFlags ─────────────────────────────────────────────────────

describe('aggregateOverallFlags()', () => {
  it('gibt leeres Array für leere Liste zurück', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('meldet Flag das in ≥40% der Analysen vorkommt', () => {
    const flaggedAnalysis: BehaviorAnalysis = {
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing',
      flags: ['Gibt schnell auf'],
    }
    const cleanAnalysis: BehaviorAnalysis = {
      ...flaggedAnalysis,
      flags: [],
    }
    // 3 von 5 = 60% → soll erscheinen
    const analyses = [flaggedAnalysis, flaggedAnalysis, flaggedAnalysis, cleanAnalysis, cleanAnalysis]
    const result = aggregateOverallFlags(analyses)
    expect(result).toContain('Gibt schnell auf')
  })

  it('unterdrückt Flag das nur 1x vorkommt bei großem Set', () => {
    const base: BehaviorAnalysis = {
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing',
      flags: [],
    }
    const withFlag = { ...base, flags: ['Seltenes Flag'] }
    const analyses = [withFlag, base, base, base, base, base, base, base, base, base]
    const result = aggregateOverallFlags(analyses)
    expect(result).not.toContain('Seltenes Flag')
  })

  it('sortiert Flags nach Häufigkeit absteigend', () => {
    const a1: BehaviorAnalysis = { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing', flags: ['A', 'B'] }
    const a2: BehaviorAnalysis = { ...a1, flags: ['A'] }
    const a3: BehaviorAnalysis = { ...a1, flags: ['B'] }
    // A: 4x, B: 3x
    const analyses = [a1, a1, a2, a2, a3, a3, a3]
    // Threshold: max(2, ceil(7*0.4)) = max(2,3) = 3
    // A: 4x ≥ 3 → ja, B: 3x... wait, a1 hat A+B, a1: 2x→ A:2,B:2; a2: 2x → A:4,B:2; a3: 3x → B:5
    // Let me recalculate: [a1,a1,a2,a2,a3,a3,a3]
    // a1 = A,B → 2x: A+=2, B+=2
    // a2 = A → 2x: A+=2
    // a3 = B → 3x: B+=3
    // A total: 4, B total: 5
    // threshold = max(2, ceil(7*0.4)) = max(2,3) = 3
    // A: 4 ≥ 3 ✓, B: 5 ≥ 3 ✓
    const result = aggregateOverallFlags(analyses)
    expect(result[0]).toBe('B') // B kommt 5x vor
    expect(result[1]).toBe('A') // A kommt 4x vor
  })
})

// ── averageMetrics ────────────────────────────────────────────────────────────

describe('averageMetrics()', () => {
  it('gibt Nullwerte für leere Liste zurück', () => {
    expect(averageMetrics([])).toEqual({ avgConfidence: 0, avgEffort: 0, avgFrustration: 0 })
  })

  it('berechnet korrekte Durchschnitte', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 60, effort_score: 70, frustration_index: 10, mastery_signal: 'developing', flags: [] },
      { confidence_score: 80, effort_score: 50, frustration_index: 20, mastery_signal: 'secure', flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(result.avgConfidence).toBe(70)
    expect(result.avgEffort).toBe(60)
    expect(result.avgFrustration).toBe(15)
  })

  it('rundet auf ganze Zahlen', () => {
    const analyses: BehaviorAnalysis[] = [
      { confidence_score: 60, effort_score: 70, frustration_index: 10, mastery_signal: 'developing', flags: [] },
      { confidence_score: 61, effort_score: 71, frustration_index: 11, mastery_signal: 'developing', flags: [] },
    ]
    const result = averageMetrics(analyses)
    // 60+61=121/2=60.5 → gerundet 61
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
    expect(Number.isInteger(result.avgEffort)).toBe(true)
    expect(Number.isInteger(result.avgFrustration)).toBe(true)
  })
})

// ── deriveSkillLevels ─────────────────────────────────────────────────────────

describe('deriveSkillLevels()', () => {
  it('gibt leeres Array bei leeren Tasks zurück', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })

  it('berechnet Level 1-10 und weist korrektes Label zu', () => {
    const snap = makeSnapshot({ coach_rating: 4, thinking_time_ms: 8000, revision_count: 1 })
    const task = makeTask('Algebra', 0)
    const analysis = analyzeBehavior(snap)
    const result = deriveSkillLevels([task], [snap], [analysis])
    expect(result).toHaveLength(1)
    expect(result[0].skill_cluster).toBe('Algebra')
    expect(result[0].level).toBeGreaterThanOrEqual(1)
    expect(result[0].level).toBeLessThanOrEqual(10)
    expect(['Lücke', 'Erkennbar', 'Sicher']).toContain(result[0].label)
  })

  it('fasst mehrere Tasks desselben Clusters zusammen', () => {
    const snaps = [makeSnapshot({ coach_rating: 2 }), makeSnapshot({ coach_rating: 4 })]
    const tasks = [makeTask('Geometrie', 0), makeTask('Geometrie', 1)]
    const analyses = snaps.map(analyzeBehavior)
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(1)
    expect(result[0].skill_cluster).toBe('Geometrie')
  })

  it('trennt verschiedene Cluster', () => {
    const snaps = [makeSnapshot(), makeSnapshot()]
    const tasks = [makeTask('Algebra', 0), makeTask('Geometrie', 1)]
    const analyses = snaps.map(analyzeBehavior)
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(2)
    const clusters = result.map(r => r.skill_cluster)
    expect(clusters).toContain('Algebra')
    expect(clusters).toContain('Geometrie')
  })

  it('gibt Label "Lücke" für niedrigen Level (≤3)', () => {
    // coach_rating 1 → baseLevel=2, confidence niedrig
    const snap = makeSnapshot({ coach_rating: 1, thinking_time_ms: 0, revision_count: 10, task_duration_ms: 3000, answer_length: 3 })
    const task = makeTask('Bruchrechnung', 0)
    const analysis = analyzeBehavior(snap)
    const result = deriveSkillLevels([task], [snap], [analysis])
    expect(result[0].label).toBe('Lücke')
  })

  it('gibt Label "Sicher" für hohen Level (>6)', () => {
    const snap = makeSnapshot({ coach_rating: 4, thinking_time_ms: 10_000, revision_count: 0 })
    const task = makeTask('Gleichungen', 0)
    const analysis = analyzeBehavior(snap)
    const result = deriveSkillLevels([task], [snap], [analysis])
    expect(result[0].label).toBe('Sicher')
  })
})

// ── recommendFocus ────────────────────────────────────────────────────────────

describe('recommendFocus()', () => {
  it('gibt leeres Array zurück', () => {
    expect(recommendFocus([])).toEqual([])
  })

  it('gibt die 2 schwächsten Cluster zurück', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'C', level: 5, label: 'Erkennbar' as const },
      { skill_cluster: 'D', level: 1, label: 'Lücke' as const },
    ]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('D') // Level 1 = schwächster
    expect(result[1].skill_cluster).toBe('B') // Level 2
  })

  it('gibt bei nur 1 Eintrag genau diesen zurück', () => {
    const levels = [{ skill_cluster: 'X', level: 3, label: 'Lücke' as const }]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(1)
  })

  it('verändert das originale Array nicht', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
    ]
    recommendFocus(levels)
    expect(levels[0].skill_cluster).toBe('A') // unverändert
  })
})

// ── buildDiagnosisResult ──────────────────────────────────────────────────────

describe('buildDiagnosisResult()', () => {
  it('baut ein vollständiges DiagnosisResult-Objekt', () => {
    const snaps = [makeSnapshot({ coach_rating: 3 })]
    const tasks = [makeTask('Algebra', 0)]
    const result = buildDiagnosisResult({
      tasks,
      snapshots: snaps,
      studentName: 'Max Muster',
      subject: 'Mathematik',
      date: '2024-06-01',
      coachNote: 'Guter Fortschritt',
    })
    expect(result.student_name).toBe('Max Muster')
    expect(result.subject).toBe('Mathematik')
    expect(result.date).toBe('2024-06-01')
    expect(result.coach_note).toBe('Guter Fortschritt')
    expect(result.snapshots).toHaveLength(1)
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
    expect(Array.isArray(result.overall_behavior_flags)).toBe(true)
  })
})
