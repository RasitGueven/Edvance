import { describe, it, expect } from 'vitest'
import {
  computeKpis,
  computeMedianByCluster,
  computePendingByCluster,
  formatMedianSeconds,
} from '@/lib/screening/results/kpis'
import type { ScreeningItemResult } from '@/types'

function makeResult(overrides: Partial<ScreeningItemResult> = {}): ScreeningItemResult {
  return {
    id: 'result-1',
    screening_test_id: 'test-1',
    item_id: 'item-1',
    cluster_id: 'cluster-1',
    student_id: 'student-1',
    answer: null,
    correct: true,
    duration_ms: 5000,
    answered_at: new Date().toISOString(),
    ...overrides,
  }
}

// ── computeKpis ──────────────────────────────────────────────────────────────

describe('computeKpis', () => {
  it('gibt 0-Werte für leere Ergebnisliste zurück', () => {
    const kpis = computeKpis([])
    expect(kpis.total).toBe(0)
    expect(kpis.autoGraded).toBe(0)
    expect(kpis.manualPending).toBe(0)
    expect(kpis.autoGradeRatePct).toBe(0)
    expect(kpis.medianDurationMs).toBe(0)
  })

  it('zählt total korrekt', () => {
    const results = [makeResult(), makeResult(), makeResult()]
    expect(computeKpis(results).total).toBe(3)
  })

  it('unterscheidet autoGraded (nicht null) und manualPending (null)', () => {
    const results = [
      makeResult({ correct: true }),
      makeResult({ correct: false }),
      makeResult({ correct: null }),
    ]
    const kpis = computeKpis(results)
    expect(kpis.autoGraded).toBe(2)
    expect(kpis.manualPending).toBe(1)
  })

  it('berechnet autoGradeRatePct korrekt', () => {
    const results = [
      makeResult({ correct: true }),
      makeResult({ correct: false }),
      makeResult({ correct: null }),
      makeResult({ correct: null }),
    ]
    // 2 autoGraded / 4 total = 50%
    expect(computeKpis(results).autoGradeRatePct).toBe(50)
  })

  it('berechnet Median-Dauer korrekt (ungerade Anzahl)', () => {
    const results = [
      makeResult({ duration_ms: 1000 }),
      makeResult({ duration_ms: 3000 }),
      makeResult({ duration_ms: 5000 }),
    ]
    expect(computeKpis(results).medianDurationMs).toBe(3000)
  })

  it('berechnet Median-Dauer korrekt (gerade Anzahl)', () => {
    const results = [
      makeResult({ duration_ms: 2000 }),
      makeResult({ duration_ms: 4000 }),
    ]
    expect(computeKpis(results).medianDurationMs).toBe(3000)
  })

  it('ignoriert duration_ms ≤ 0', () => {
    const results = [
      makeResult({ duration_ms: 0 }),
      makeResult({ duration_ms: -100 }),
      makeResult({ duration_ms: 5000 }),
    ]
    // Nur 5000 zählt → Median = 5000
    expect(computeKpis(results).medianDurationMs).toBe(5000)
  })
})

// ── computeMedianByCluster ───────────────────────────────────────────────────

describe('computeMedianByCluster', () => {
  it('gibt leere Map für leere Ergebnisliste zurück', () => {
    expect(computeMedianByCluster([])).toEqual(new Map())
  })

  it('berechnet Median pro Cluster separat', () => {
    const results = [
      makeResult({ cluster_id: 'c1', duration_ms: 1000 }),
      makeResult({ cluster_id: 'c1', duration_ms: 3000 }),
      makeResult({ cluster_id: 'c2', duration_ms: 8000 }),
    ]
    const medians = computeMedianByCluster(results)
    expect(medians.get('c1')).toBe(2000) // (1000+3000)/2
    expect(medians.get('c2')).toBe(8000)
  })

  it('ignoriert duration_ms ≤ 0', () => {
    const results = [
      makeResult({ cluster_id: 'c1', duration_ms: 0 }),
      makeResult({ cluster_id: 'c1', duration_ms: 5000 }),
    ]
    expect(computeMedianByCluster(results).get('c1')).toBe(5000)
  })
})

// ── computePendingByCluster ──────────────────────────────────────────────────

describe('computePendingByCluster', () => {
  it('gibt leere Map zurück wenn keine pending Ergebnisse', () => {
    const results = [makeResult({ correct: true }), makeResult({ correct: false })]
    expect(computePendingByCluster(results)).toEqual(new Map())
  })

  it('zählt pending Ergebnisse pro Cluster', () => {
    const results = [
      makeResult({ cluster_id: 'c1', correct: null }),
      makeResult({ cluster_id: 'c1', correct: null }),
      makeResult({ cluster_id: 'c2', correct: null }),
      makeResult({ cluster_id: 'c2', correct: true }),
    ]
    const pending = computePendingByCluster(results)
    expect(pending.get('c1')).toBe(2)
    expect(pending.get('c2')).toBe(1)
  })
})

// ── formatMedianSeconds ──────────────────────────────────────────────────────

describe('formatMedianSeconds', () => {
  it('gibt "–" für 0ms zurück', () => {
    expect(formatMedianSeconds(0)).toBe('–')
  })

  it('gibt "–" für negative Werte zurück', () => {
    expect(formatMedianSeconds(-100)).toBe('–')
  })

  it('formatiert Sekunden korrekt', () => {
    expect(formatMedianSeconds(5000)).toBe('5s')
    expect(formatMedianSeconds(30000)).toBe('30s')
    expect(formatMedianSeconds(59000)).toBe('59s')
  })

  it('formatiert Minuten korrekt (keine restlichen Sekunden)', () => {
    expect(formatMedianSeconds(60000)).toBe('1min')
    expect(formatMedianSeconds(120000)).toBe('2min')
  })

  it('formatiert Minuten + Sekunden korrekt', () => {
    expect(formatMedianSeconds(90000)).toBe('1min 30s')
    expect(formatMedianSeconds(150000)).toBe('2min 30s')
  })

  it('rundet auf ganze Sekunden', () => {
    // 5400ms → 5s (gerundet), 500ms → 1s (gerundet)
    expect(formatMedianSeconds(5400)).toBe('5s')
    expect(formatMedianSeconds(500)).toBe('1s')
  })
})
