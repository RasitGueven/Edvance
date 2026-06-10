import { describe, it, expect } from 'vitest'
import {
  computeKpis,
  computeMedianByCluster,
  computePendingByCluster,
  formatMedianSeconds,
} from '@/lib/screening/results/kpis'
import type { ScreeningItemResult } from '@/types'

function makeResult(
  id: string,
  clusterId: string,
  correct: boolean | null,
  duration_ms: number | null,
): ScreeningItemResult {
  return {
    id,
    created_at: '',
    screening_test_id: 't1',
    screening_item_id: id,
    cluster_id: clusterId,
    level: 1,
    correct,
    answer: null,
    duration_ms,
  }
}

describe('computeKpis', () => {
  it('empty array → all zeros', () => {
    const kpis = computeKpis([])
    expect(kpis.total).toBe(0)
    expect(kpis.autoGraded).toBe(0)
    expect(kpis.manualPending).toBe(0)
    expect(kpis.autoGradeRatePct).toBe(0)
    expect(kpis.medianDurationMs).toBe(0)
  })

  it('counts correct=true and correct=false as autoGraded', () => {
    const results = [
      makeResult('a', 'c1', true, 1000),
      makeResult('b', 'c1', false, 2000),
      makeResult('c', 'c1', null, 3000),
    ]
    const kpis = computeKpis(results)
    expect(kpis.total).toBe(3)
    expect(kpis.autoGraded).toBe(2)
    expect(kpis.manualPending).toBe(1)
  })

  it('autoGradeRatePct = round(autoGraded / total * 100)', () => {
    const results = [
      makeResult('a', 'c1', true, 1000),
      makeResult('b', 'c1', true, 2000),
      makeResult('c', 'c1', null, 3000),
      makeResult('d', 'c1', null, 4000),
    ]
    const kpis = computeKpis(results)
    // autoGraded=2, total=4 → 50%
    expect(kpis.autoGradeRatePct).toBe(50)
  })

  it('autoGradeRatePct is 0 when all pending', () => {
    const results = [
      makeResult('a', 'c1', null, 1000),
      makeResult('b', 'c1', null, 2000),
    ]
    const kpis = computeKpis(results)
    expect(kpis.autoGradeRatePct).toBe(0)
  })

  it('ignores zero or null durations in median calculation', () => {
    const results = [
      makeResult('a', 'c1', true, 0),
      makeResult('b', 'c1', true, null),
      makeResult('c', 'c1', true, 5000),
    ]
    const kpis = computeKpis(results)
    expect(kpis.medianDurationMs).toBe(5000)
  })

  it('median of odd count picks middle value', () => {
    const results = [
      makeResult('a', 'c1', true, 1000),
      makeResult('b', 'c1', true, 3000),
      makeResult('c', 'c1', true, 5000),
    ]
    const kpis = computeKpis(results)
    expect(kpis.medianDurationMs).toBe(3000)
  })

  it('median of even count averages two middle values', () => {
    const results = [
      makeResult('a', 'c1', true, 1000),
      makeResult('b', 'c1', true, 2000),
      makeResult('c', 'c1', true, 3000),
      makeResult('d', 'c1', true, 4000),
    ]
    const kpis = computeKpis(results)
    expect(kpis.medianDurationMs).toBe(2500)
  })
})

describe('computeMedianByCluster', () => {
  it('groups by cluster and computes median', () => {
    const results = [
      makeResult('a', 'c1', true, 1000),
      makeResult('b', 'c1', true, 3000),
      makeResult('c', 'c2', true, 6000),
    ]
    const map = computeMedianByCluster(results)
    expect(map.get('c1')).toBe(2000)
    expect(map.get('c2')).toBe(6000)
  })

  it('ignores zero and null durations', () => {
    const results = [
      makeResult('a', 'c1', true, 0),
      makeResult('b', 'c1', true, null),
      makeResult('c', 'c1', true, 4000),
    ]
    const map = computeMedianByCluster(results)
    expect(map.get('c1')).toBe(4000)
  })

  it('returns empty map for empty input', () => {
    expect(computeMedianByCluster([])).toEqual(new Map())
  })

  it('median odd count for cluster', () => {
    const results = [
      makeResult('a', 'c1', true, 2000),
      makeResult('b', 'c1', true, 4000),
      makeResult('c', 'c1', true, 6000),
    ]
    const map = computeMedianByCluster(results)
    expect(map.get('c1')).toBe(4000)
  })
})

describe('computePendingByCluster', () => {
  it('only counts null correct values', () => {
    const results = [
      makeResult('a', 'c1', null, 1000),
      makeResult('b', 'c1', true, 2000),
      makeResult('c', 'c1', false, 3000),
      makeResult('d', 'c1', null, 4000),
      makeResult('e', 'c2', null, 5000),
    ]
    const map = computePendingByCluster(results)
    expect(map.get('c1')).toBe(2)
    expect(map.get('c2')).toBe(1)
  })

  it('returns empty map when no pending', () => {
    const results = [
      makeResult('a', 'c1', true, 1000),
      makeResult('b', 'c1', false, 2000),
    ]
    const map = computePendingByCluster(results)
    expect(map.size).toBe(0)
  })

  it('returns empty map for empty input', () => {
    expect(computePendingByCluster([])).toEqual(new Map())
  })
})

describe('formatMedianSeconds', () => {
  it('0 → –', () => {
    expect(formatMedianSeconds(0)).toBe('–')
  })

  it('negative → –', () => {
    expect(formatMedianSeconds(-100)).toBe('–')
  })

  it('< 60s → Xs', () => {
    expect(formatMedianSeconds(30000)).toBe('30s')
  })

  it('exactly 60s → 1min', () => {
    expect(formatMedianSeconds(60000)).toBe('1min')
  })

  it('90s → 1min 30s', () => {
    expect(formatMedianSeconds(90000)).toBe('1min 30s')
  })

  it('120s → 2min', () => {
    expect(formatMedianSeconds(120000)).toBe('2min')
  })

  it('1s → 1s', () => {
    expect(formatMedianSeconds(1000)).toBe('1s')
  })

  it('59s → 59s', () => {
    expect(formatMedianSeconds(59000)).toBe('59s')
  })
})
