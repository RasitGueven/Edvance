import { describe, it, expect } from 'vitest'
import {
  computeKpis,
  computeMedianByCluster,
  computePendingByCluster,
  formatMedianSeconds,
} from '../kpis'
import type { ScreeningItemResult } from '@/types'

function makeResult(overrides: Partial<ScreeningItemResult> = {}): ScreeningItemResult {
  return {
    id: 'r1',
    created_at: '2024-01-01T00:00:00Z',
    screening_test_id: 'test-1',
    screening_item_id: 'item-1',
    cluster_id: 'cluster-1',
    level: 1,
    correct: true,
    answer: {},
    duration_ms: 10_000,
    ...overrides,
  }
}

describe('computeKpis', () => {
  it('returns zeroed KPIs for empty results', () => {
    const kpis = computeKpis([])
    expect(kpis.total).toBe(0)
    expect(kpis.autoGraded).toBe(0)
    expect(kpis.manualPending).toBe(0)
    expect(kpis.autoGradeRatePct).toBe(0)
    expect(kpis.medianDurationMs).toBe(0)
  })

  it('counts total results', () => {
    const kpis = computeKpis([makeResult(), makeResult(), makeResult()])
    expect(kpis.total).toBe(3)
  })

  it('separates auto-graded from pending', () => {
    const results = [
      makeResult({ correct: true }),
      makeResult({ correct: false }),
      makeResult({ correct: null }),
    ]
    const kpis = computeKpis(results)
    expect(kpis.autoGraded).toBe(2)
    expect(kpis.manualPending).toBe(1)
  })

  it('computes autoGradeRatePct correctly', () => {
    const results = [
      makeResult({ correct: true }),
      makeResult({ correct: true }),
      makeResult({ correct: null }),
      makeResult({ correct: null }),
    ]
    const kpis = computeKpis(results)
    // 2 autoGraded / 4 total = 50%
    expect(kpis.autoGradeRatePct).toBe(50)
  })

  it('computes median duration from positive values only', () => {
    const results = [
      makeResult({ duration_ms: 1000 }),
      makeResult({ duration_ms: 3000 }),
      makeResult({ duration_ms: 5000 }),
      makeResult({ duration_ms: 0 }),    // excluded
      makeResult({ duration_ms: null }), // excluded
    ]
    const kpis = computeKpis(results)
    expect(kpis.medianDurationMs).toBe(3000)
  })

  it('computes median for even number of durations', () => {
    const results = [
      makeResult({ duration_ms: 1000 }),
      makeResult({ duration_ms: 2000 }),
      makeResult({ duration_ms: 3000 }),
      makeResult({ duration_ms: 4000 }),
    ]
    const kpis = computeKpis(results)
    // sorted: [1000, 2000, 3000, 4000], median = (2000+3000)/2 = 2500
    expect(kpis.medianDurationMs).toBe(2500)
  })

  it('returns autoGradeRatePct 0 for all-pending results', () => {
    const results = [
      makeResult({ correct: null }),
      makeResult({ correct: null }),
    ]
    const kpis = computeKpis(results)
    expect(kpis.autoGradeRatePct).toBe(0)
  })
})

describe('computeMedianByCluster', () => {
  it('returns empty map for empty results', () => {
    expect(computeMedianByCluster([])).toEqual(new Map())
  })

  it('groups by cluster_id', () => {
    const results = [
      makeResult({ cluster_id: 'c1', duration_ms: 2000 }),
      makeResult({ cluster_id: 'c1', duration_ms: 4000 }),
      makeResult({ cluster_id: 'c2', duration_ms: 6000 }),
    ]
    const map = computeMedianByCluster(results)
    expect(map.get('c1')).toBe(3000)
    expect(map.get('c2')).toBe(6000)
  })

  it('skips items with no or zero duration', () => {
    const results = [
      makeResult({ cluster_id: 'c1', duration_ms: null }),
      makeResult({ cluster_id: 'c1', duration_ms: 0 }),
      makeResult({ cluster_id: 'c1', duration_ms: 5000 }),
    ]
    const map = computeMedianByCluster(results)
    expect(map.get('c1')).toBe(5000)
  })

  it('returns nothing for cluster with only null durations', () => {
    const results = [makeResult({ cluster_id: 'c1', duration_ms: null })]
    const map = computeMedianByCluster(results)
    expect(map.has('c1')).toBe(false)
  })
})

describe('computePendingByCluster', () => {
  it('returns empty map for empty results', () => {
    expect(computePendingByCluster([])).toEqual(new Map())
  })

  it('counts pending (null correct) by cluster', () => {
    const results = [
      makeResult({ cluster_id: 'c1', correct: null }),
      makeResult({ cluster_id: 'c1', correct: null }),
      makeResult({ cluster_id: 'c1', correct: true }),
      makeResult({ cluster_id: 'c2', correct: null }),
    ]
    const map = computePendingByCluster(results)
    expect(map.get('c1')).toBe(2)
    expect(map.get('c2')).toBe(1)
  })

  it('ignores non-pending results', () => {
    const results = [
      makeResult({ cluster_id: 'c1', correct: true }),
      makeResult({ cluster_id: 'c1', correct: false }),
    ]
    const map = computePendingByCluster(results)
    expect(map.has('c1')).toBe(false)
  })
})

describe('formatMedianSeconds', () => {
  it('returns dash for 0 or negative ms', () => {
    expect(formatMedianSeconds(0)).toBe('–')
    expect(formatMedianSeconds(-100)).toBe('–')
  })

  it('formats seconds for < 60 seconds', () => {
    expect(formatMedianSeconds(5000)).toBe('5s')
    expect(formatMedianSeconds(30_000)).toBe('30s')
    expect(formatMedianSeconds(59_000)).toBe('59s')
  })

  it('formats minutes for exactly 1 minute', () => {
    expect(formatMedianSeconds(60_000)).toBe('1min')
  })

  it('formats minutes and seconds', () => {
    expect(formatMedianSeconds(90_000)).toBe('1min 30s')
    expect(formatMedianSeconds(125_000)).toBe('2min 5s')
  })

  it('formats multiple minutes without seconds when exact', () => {
    expect(formatMedianSeconds(120_000)).toBe('2min')
    expect(formatMedianSeconds(180_000)).toBe('3min')
  })

  it('rounds ms to nearest second', () => {
    expect(formatMedianSeconds(4500)).toBe('5s')
    expect(formatMedianSeconds(4499)).toBe('4s')
  })
})
