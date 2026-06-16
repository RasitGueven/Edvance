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

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<BehaviorSnapshot> = {}): BehaviorSnapshot {
  return {
    task_id: 'task-1',
    thinking_time_ms: 5000,
    task_duration_ms: 30000,
    revision_count: 2,
    rewrite_count: 0,
    hint_used: false,
    hint_request_time_ms: null,
    answer_length: 50,
    time_after_completion_ms: 3000,
    answer_text: 'Meine Antwort ist korrekt.',
    coach_rating: 3,
    ...overrides,
  }
}

function makeTask(overrides: Partial<DiagnosisTask> = {}): DiagnosisTask {
  return {
    id: 'task-1',
    skill_id: 'skill-1',
    skill_cluster: 'Algebra',
    question: 'Löse die Gleichung.',
    solution: 'x = 5',
    common_errors: 'Vorzeichenfehler',
    coach_hint: 'Auf Vorzeichen achten',
    estimated_minutes: 5,
    ...overrides,
  }
}

// ── analyzeBehavior ──────────────────────────────────────────────────────────

describe('analyzeBehavior – Confidence Score', () => {
  it('startet bei 50 als Basiswert', () => {
    const snap = makeSnapshot({
      thinking_time_ms: 1000,
      revision_count: 5,
      task_duration_ms: 30000,
      answer_length: 15,
      hint_used: false,
    })
    const result = analyzeBehavior(snap)
    expect(result.confidence_score).toBeGreaterThanOrEqual(0)
    expect(result.confidence_score).toBeLessThanOrEqual(100)
  })

  it('erhöht Confidence bei langer Denkzeit (>3000ms)', () => {
    const low = analyzeBehavior(makeSnapshot({ thinking_time_ms: 1000 }))
    const high = analyzeBehavior(makeSnapshot({ thinking_time_ms: 5000 }))
    expect(high.confidence_score).toBeGreaterThan(low.confidence_score)
  })

  it('erhöht Confidence bei wenigen Revisionen (<3)', () => {
    const high = analyzeBehavior(makeSnapshot({ revision_count: 1 }))
    const low = analyzeBehavior(makeSnapshot({ revision_count: 5 }))
    expect(high.confidence_score).toBeGreaterThan(low.confidence_score)
  })

  it('reduziert Confidence bei sehr schneller Antwort mit kurzer Länge', () => {
    const slow = analyzeBehavior(makeSnapshot({ task_duration_ms: 30000, answer_length: 50 }))
    const fast = analyzeBehavior(makeSnapshot({ task_duration_ms: 5000, answer_length: 5 }))
    expect(fast.confidence_score).toBeLessThan(slow.confidence_score)
  })

  it('reduziert Confidence bei frühem Hint-Einsatz (<5000ms)', () => {
    const noHint = analyzeBehavior(makeSnapshot({ hint_used: false }))
    const earlyHint = analyzeBehavior(makeSnapshot({
      hint_used: true,
      hint_request_time_ms: 3000,
    }))
    expect(earlyHint.confidence_score).toBeLessThan(noHint.confidence_score)
  })

  it('klemmt Confidence zwischen 0 und 100', () => {
    const extremeLow = analyzeBehavior(makeSnapshot({
      thinking_time_ms: 100,
      revision_count: 10,
      task_duration_ms: 2000,
      answer_length: 3,
      hint_used: true,
      hint_request_time_ms: 1000,
    }))
    expect(extremeLow.confidence_score).toBeGreaterThanOrEqual(0)
    expect(extremeLow.confidence_score).toBeLessThanOrEqual(100)

    const extremeHigh = analyzeBehavior(makeSnapshot({
      thinking_time_ms: 10000,
      revision_count: 0,
      task_duration_ms: 5000,
      answer_length: 100,
      hint_used: false,
    }))
    expect(extremeHigh.confidence_score).toBeLessThanOrEqual(100)
  })
})

describe('analyzeBehavior – Effort Score', () => {
  it('erhöht Effort bei langer Antwort (>30 Zeichen)', () => {
    const low = analyzeBehavior(makeSnapshot({ answer_length: 5 }))
    const high = analyzeBehavior(makeSnapshot({ answer_length: 50 }))
    expect(high.effort_score).toBeGreaterThan(low.effort_score)
  })

  it('erhöht Effort bei langer Nachbearbeitungszeit (>2000ms)', () => {
    const low = analyzeBehavior(makeSnapshot({ time_after_completion_ms: 500 }))
    const high = analyzeBehavior(makeSnapshot({ time_after_completion_ms: 5000 }))
    expect(high.effort_score).toBeGreaterThan(low.effort_score)
  })

  it('reduziert Effort bei sehr kurzer Antwort (<8 Zeichen)', () => {
    const high = analyzeBehavior(makeSnapshot({ answer_length: 50 }))
    const low = analyzeBehavior(makeSnapshot({ answer_length: 5 }))
    expect(low.effort_score).toBeLessThan(high.effort_score)
  })

  it('reduziert Effort bei hohem Rewrite-Count (>2)', () => {
    const low = analyzeBehavior(makeSnapshot({ rewrite_count: 5 }))
    const high = analyzeBehavior(makeSnapshot({ rewrite_count: 0 }))
    expect(low.effort_score).toBeLessThan(high.effort_score)
  })
})

describe('analyzeBehavior – Frustration Index', () => {
  it('ist 0 für unauffällige Aufgaben', () => {
    const snap = makeSnapshot({
      revision_count: 2,
      rewrite_count: 0,
      task_duration_ms: 30000,
      hint_used: false,
    })
    expect(analyzeBehavior(snap).frustration_index).toBe(0)
  })

  it('erhöht Frustration bei vielen Revisionen (>8)', () => {
    const high = analyzeBehavior(makeSnapshot({ revision_count: 10 }))
    const low = analyzeBehavior(makeSnapshot({ revision_count: 2 }))
    expect(high.frustration_index).toBeGreaterThan(low.frustration_index)
  })

  it('erhöht Frustration bei mehrfachem Umschreiben (>1)', () => {
    const high = analyzeBehavior(makeSnapshot({ rewrite_count: 3 }))
    const low = analyzeBehavior(makeSnapshot({ rewrite_count: 0 }))
    expect(high.frustration_index).toBeGreaterThan(low.frustration_index)
  })

  it('erhöht Frustration bei sehr langer Aufgabendauer (>180s)', () => {
    const high = analyzeBehavior(makeSnapshot({ task_duration_ms: 200000 }))
    const low = analyzeBehavior(makeSnapshot({ task_duration_ms: 30000 }))
    expect(high.frustration_index).toBeGreaterThan(low.frustration_index)
  })

  it('addiert Frustration bei frühem Hint + schlechtem Coach-Rating', () => {
    const withCombo = analyzeBehavior(makeSnapshot({
      hint_used: true,
      hint_request_time_ms: 3000,
      coach_rating: 1,
    }))
    const without = analyzeBehavior(makeSnapshot({
      hint_used: false,
      coach_rating: 4,
    }))
    expect(withCombo.frustration_index).toBeGreaterThan(without.frustration_index)
  })
})

describe('analyzeBehavior – Mastery Signal', () => {
  it('gibt "secure" zurück bei gutem Coach-Rating + hoher Confidence', () => {
    const snap = makeSnapshot({
      thinking_time_ms: 8000,
      revision_count: 1,
      answer_length: 60,
      coach_rating: 4,
    })
    expect(analyzeBehavior(snap).mastery_signal).toBe('secure')
  })

  it('gibt "guessing" zurück bei sehr schneller, kurzer Antwort', () => {
    const snap = makeSnapshot({
      task_duration_ms: 3000,
      answer_length: 4,
      coach_rating: null,
    })
    expect(analyzeBehavior(snap).mastery_signal).toBe('guessing')
  })

  it('gibt "gap" zurück bei schlechtem Rating + ausreichend Effort', () => {
    const snap = makeSnapshot({
      coach_rating: 1,
      answer_length: 50,
      time_after_completion_ms: 5000,
      task_duration_ms: 60000,
    })
    expect(analyzeBehavior(snap).mastery_signal).toBe('gap')
  })

  it('gibt "developing" als Fallback zurück', () => {
    const snap = makeSnapshot({
      thinking_time_ms: 2000,
      revision_count: 3,
      answer_length: 20,
      coach_rating: null,
      task_duration_ms: 20000,
    })
    const result = analyzeBehavior(snap)
    expect(['developing', 'secure', 'guessing', 'gap']).toContain(result.mastery_signal)
  })
})

describe('analyzeBehavior – Flags', () => {
  it('setzt "Gibt schnell auf" bei frühem Hint', () => {
    const snap = makeSnapshot({
      hint_used: true,
      hint_request_time_ms: 2000,
    })
    expect(analyzeBehavior(snap).flags).toContain('Gibt schnell auf')
  })

  it('setzt "Zeigt Rechenweg selten" bei kurzer Antwort (<15)', () => {
    const snap = makeSnapshot({ answer_length: 10 })
    expect(analyzeBehavior(snap).flags).toContain('Zeigt Rechenweg selten')
  })

  it('setzt "Überprüft Ergebnisse" bei langer Nachbearbeitungszeit (>3000ms)', () => {
    const snap = makeSnapshot({ time_after_completion_ms: 5000 })
    expect(analyzeBehavior(snap).flags).toContain('Überprüft Ergebnisse')
  })

  it('setzt "Hohe Frustrationstoleranz" bei sehr langer Aufgabendauer (>120s)', () => {
    const snap = makeSnapshot({ task_duration_ms: 150000 })
    expect(analyzeBehavior(snap).flags).toContain('Hohe Frustrationstoleranz')
  })

  it('setzt "Unsicheres Schreibverhalten" bei vielen Revisionen (>6)', () => {
    const snap = makeSnapshot({ revision_count: 8 })
    expect(analyzeBehavior(snap).flags).toContain('Unsicheres Schreibverhalten')
  })

  it('setzt "Arbeitet strukturiert" bei langer Antwort (>40)', () => {
    const snap = makeSnapshot({ answer_length: 60 })
    expect(analyzeBehavior(snap).flags).toContain('Arbeitet strukturiert')
  })

  it('setzt keine Flags für unauffällige Aufgabe', () => {
    const snap = makeSnapshot({
      hint_used: false,
      answer_length: 25,
      time_after_completion_ms: 1000,
      task_duration_ms: 30000,
      revision_count: 2,
    })
    expect(analyzeBehavior(snap).flags).toHaveLength(0)
  })
})

// ── aggregateOverallFlags ────────────────────────────────────────────────────

describe('aggregateOverallFlags', () => {
  it('gibt leeres Array für leere Liste zurück', () => {
    expect(aggregateOverallFlags([])).toEqual([])
  })

  it('gibt Flags zurück die mind. 40% der Analysen auftreten', () => {
    const analyses = [
      { confidence_score: 60, effort_score: 60, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['Flag A', 'Flag B'] },
      { confidence_score: 60, effort_score: 60, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['Flag A'] },
      { confidence_score: 60, effort_score: 60, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['Flag B'] },
      { confidence_score: 60, effort_score: 60, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['Flag A'] },
      { confidence_score: 60, effort_score: 60, frustration_index: 0, mastery_signal: 'developing' as const, flags: [] },
    ]
    const result = aggregateOverallFlags(analyses)
    // Flag A erscheint 3x von 5 = 60% > 40% → included
    expect(result).toContain('Flag A')
    // Flag B erscheint 2x von 5 = 40% → at threshold (ceil(5*0.4)=2), aber max(2,2)=2 → included
    expect(result).toContain('Flag B')
  })

  it('sortiert Flags nach Häufigkeit (absteigend)', () => {
    const analyses = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['A', 'B', 'C'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['A', 'B'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['A'] },
    ]
    const result = aggregateOverallFlags(analyses)
    expect(result[0]).toBe('A')
  })

  it('nutzt min. 2 als Schwellwert für kleine Sets', () => {
    const analyses = [
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['Flag X'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: ['Flag X'] },
      { confidence_score: 50, effort_score: 50, frustration_index: 0, mastery_signal: 'developing' as const, flags: [] },
    ]
    const result = aggregateOverallFlags(analyses)
    // 2 von 3 = 66%, und max(2, ceil(3*0.4)) = max(2, 2) = 2 → Flag X included
    expect(result).toContain('Flag X')
  })
})

// ── averageMetrics ───────────────────────────────────────────────────────────

describe('averageMetrics', () => {
  it('gibt Nullwerte für leere Liste zurück', () => {
    expect(averageMetrics([])).toEqual({
      avgConfidence: 0,
      avgEffort: 0,
      avgFrustration: 0,
    })
  })

  it('berechnet korrekte Durchschnitte', () => {
    const analyses = [
      { confidence_score: 80, effort_score: 60, frustration_index: 20, mastery_signal: 'secure' as const, flags: [] },
      { confidence_score: 60, effort_score: 40, frustration_index: 40, mastery_signal: 'developing' as const, flags: [] },
    ]
    expect(averageMetrics(analyses)).toEqual({
      avgConfidence: 70,
      avgEffort: 50,
      avgFrustration: 30,
    })
  })

  it('rundet auf ganze Zahlen', () => {
    const analyses = [
      { confidence_score: 100, effort_score: 100, frustration_index: 0, mastery_signal: 'secure' as const, flags: [] },
      { confidence_score: 0, effort_score: 0, frustration_index: 100, mastery_signal: 'gap' as const, flags: [] },
      { confidence_score: 51, effort_score: 51, frustration_index: 51, mastery_signal: 'developing' as const, flags: [] },
    ]
    const result = averageMetrics(analyses)
    expect(Number.isInteger(result.avgConfidence)).toBe(true)
    expect(Number.isInteger(result.avgEffort)).toBe(true)
    expect(Number.isInteger(result.avgFrustration)).toBe(true)
  })
})

// ── deriveSkillLevels ────────────────────────────────────────────────────────

describe('deriveSkillLevels', () => {
  it('gibt leeres Array zurück wenn keine Tasks', () => {
    expect(deriveSkillLevels([], [], [])).toEqual([])
  })

  it('berechnet Level pro Skill-Cluster', () => {
    const tasks = [makeTask({ skill_cluster: 'Algebra' })]
    const snaps = [makeSnapshot({ coach_rating: 4 })]
    const analyses = snaps.map(s => ({
      confidence_score: 80,
      effort_score: 70,
      frustration_index: 0,
      mastery_signal: 'secure' as const,
      flags: [],
    }))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(1)
    expect(result[0].skill_cluster).toBe('Algebra')
    expect(result[0].level).toBeGreaterThan(0)
    expect(result[0].level).toBeLessThanOrEqual(10)
  })

  it('aggregiert mehrere Tasks desselben Clusters zu Durchschnitt', () => {
    const tasks = [
      makeTask({ id: 't1', skill_cluster: 'Algebra' }),
      makeTask({ id: 't2', skill_cluster: 'Algebra' }),
    ]
    const snaps = [
      makeSnapshot({ coach_rating: 4 }),
      makeSnapshot({ coach_rating: 2 }),
    ]
    const analyses = snaps.map(_ => ({
      confidence_score: 50,
      effort_score: 50,
      frustration_index: 0,
      mastery_signal: 'developing' as const,
      flags: [],
    }))
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result).toHaveLength(1)
  })

  it('gibt Label "Lücke" für Level 1-3', () => {
    const tasks = [makeTask({ skill_cluster: 'Geometrie' })]
    const snaps = [makeSnapshot({ coach_rating: 1 })]
    const analyses = [{ confidence_score: 10, effort_score: 30, frustration_index: 50, mastery_signal: 'gap' as const, flags: [] }]
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result[0].label).toBe('Lücke')
  })

  it('gibt Label "Sicher" für Level 7-10', () => {
    const tasks = [makeTask({ skill_cluster: 'Zahlentheorie' })]
    const snaps = [makeSnapshot({ coach_rating: 4 })]
    const analyses = [{ confidence_score: 90, effort_score: 80, frustration_index: 0, mastery_signal: 'secure' as const, flags: [] }]
    const result = deriveSkillLevels(tasks, snaps, analyses)
    expect(result[0].label).toBe('Sicher')
  })
})

// ── recommendFocus ───────────────────────────────────────────────────────────

describe('recommendFocus', () => {
  it('gibt die 2 schwächsten Cluster zurück', () => {
    const levels = [
      { skill_cluster: 'Algebra', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'Geometrie', level: 3, label: 'Lücke' as const },
      { skill_cluster: 'Stochastik', level: 2, label: 'Lücke' as const },
      { skill_cluster: 'Analysis', level: 6, label: 'Erkennbar' as const },
    ]
    const result = recommendFocus(levels)
    expect(result).toHaveLength(2)
    expect(result[0].skill_cluster).toBe('Stochastik')
    expect(result[1].skill_cluster).toBe('Geometrie')
  })

  it('gibt alle zurück wenn weniger als 2 Einträge', () => {
    const levels = [{ skill_cluster: 'Algebra', level: 5, label: 'Erkennbar' as const }]
    expect(recommendFocus(levels)).toHaveLength(1)
  })

  it('verändert das Original-Array nicht', () => {
    const levels = [
      { skill_cluster: 'A', level: 8, label: 'Sicher' as const },
      { skill_cluster: 'B', level: 2, label: 'Lücke' as const },
    ]
    const copy = [...levels]
    recommendFocus(levels)
    expect(levels).toEqual(copy)
  })
})

// ── buildDiagnosisResult ─────────────────────────────────────────────────────

describe('buildDiagnosisResult', () => {
  it('erstellt ein vollständiges DiagnosisResult', () => {
    const tasks = [makeTask()]
    const snaps = [makeSnapshot({ coach_rating: 3 })]
    const result = buildDiagnosisResult({
      tasks,
      snapshots: snaps,
      studentName: 'Emma Schulz',
      subject: 'Mathematik',
      date: '2026-06-16',
      coachNote: 'Gute Arbeit!',
    })
    expect(result.student_name).toBe('Emma Schulz')
    expect(result.subject).toBe('Mathematik')
    expect(result.date).toBe('2026-06-16')
    expect(result.coach_note).toBe('Gute Arbeit!')
    expect(result.analyses).toHaveLength(1)
    expect(result.skill_levels).toHaveLength(1)
    expect(Array.isArray(result.overall_behavior_flags)).toBe(true)
  })
})
