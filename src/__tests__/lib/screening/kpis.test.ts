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
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    screening_test_id: 'test-1',
    screening_item_id: 'item-1',
    cluster_id: 'algebra',
    answer: {},
    correct: true,
    duration_ms: 5000,
    coach_id: null,
    level: 1,
    afb: 'I',
    ...overrides,
  }
}

// ── computeKpis ───────────────────────────────────────────────────────────────

describe('computeKpis', () => {
  it('returns zero KPIs for empty results', () => {
    const kpis = computeKpis([])
    expect(kpis.total).toBe(0)
    expect(kpis.autoGraded).toBe(0)
    expect(kpis.manualPending).toBe(0)
    expect(kpis.autoGradeRatePct).toBe(0)
    expect(kpis.medianDurationMs).toBe(0)
  })

  it('counts auto-graded (correct !== null) vs manual (correct === null)', () => {
    const results = [
      makeResult({ correct: true }),
      makeResult({ correct: false }),
      makeResult({ correct: null }),
    ]
    const kpis = computeKpis(results)
    expect(kpis.autoGraded).toBe(2)
    expect(kpis.manualPending).toBe(1)
    expect(kpis.total).toBe(3)
  })

  it('computes autoGradeRatePct correctly', () => {
    const results = [makeResult({ correct: true }), makeResult({ correct: null })]
    const kpis = computeKpis(results)
    // 1 auto / 2 total = 50%
    expect(kpis.autoGradeRatePct).toBe(50)
  })

  it('computes median duration', () => {
    const results = [
      makeResult({ duration_ms: 1000 }),
      makeResult({ duration_ms: 3000 }),
      makeResult({ duration_ms: 5000 }),
    ]
    expect(computeKpis(results).medianDurationMs).toBe(3000)
  })

  it('ignores non-positive durations in median', () => {
    const results = [
      makeResult({ duration_ms: -1 }),
      makeResult({ duration_ms: 0 }),
      makeResult({ duration_ms: 4000 }),
    ]
    expect(computeKpis(results).medianDurationMs).toBe(4000)
  })
})

// ── computeMedianByCluster ────────────────────────────────────────────────────

describe('computeMedianByCluster', () => {
  it('returns empty map for no results', () => {
    expect(computeMedianByCluster([])).toEqual(new Map())
  })

  it('returns median per cluster', () => {
    const results = [
      makeResult({ cluster_id: 'algebra', duration_ms: 2000 }),
      makeResult({ cluster_id: 'algebra', duration_ms: 4000 }),
      makeResult({ cluster_id: 'geometrie', duration_ms: 6000 }),
    ]
    const map = computeMedianByCluster(results)
    expect(map.get('algebra')).toBe(3000) // median(2000, 4000)
    expect(map.get('geometrie')).toBe(6000)
  })
})

// ── computePendingByCluster ───────────────────────────────────────────────────

describe('computePendingByCluster', () => {
  it('returns empty map when no pending items', () => {
    const results = [makeResult({ correct: true })]
    expect(computePendingByCluster(results)).toEqual(new Map())
  })

  it('counts pending items per cluster', () => {
    const results = [
      makeResult({ cluster_id: 'algebra', correct: null }),
      makeResult({ cluster_id: 'algebra', correct: null }),
      makeResult({ cluster_id: 'geometrie', correct: null }),
    ]
    const map = computePendingByCluster(results)
    expect(map.get('algebra')).toBe(2)
    expect(map.get('geometrie')).toBe(1)
  })
})

// ── formatMedianSeconds ───────────────────────────────────────────────────────

describe('formatMedianSeconds', () => {
  it('returns "–" for 0 or negative ms', () => {
    expect(formatMedianSeconds(0)).toBe('–')
    expect(formatMedianSeconds(-1)).toBe('–')
  })

  it('formats seconds below 60', () => {
    expect(formatMedianSeconds(30_000)).toBe('30s')
  })

  it('formats whole minutes', () => {
    expect(formatMedianSeconds(120_000)).toBe('2min')
  })

  it('formats minutes and seconds', () => {
    expect(formatMedianSeconds(90_000)).toBe('1min 30s')
  })
})
