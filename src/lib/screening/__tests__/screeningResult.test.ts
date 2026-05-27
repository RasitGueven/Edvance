import { describe, it, expect } from 'vitest'
import { parseScreeningResult } from '@/lib/screening/screeningResult'

function makeCluster(overrides = {}) {
  return {
    clusterId: 'cluster-1',
    answered: 4,
    correct: 3,
    pending: 0,
    estimatedLevel: 2,
    reachedAfb: 'II',
    mastery: 0.75,
    confidence: 'high',
    ...overrides,
  }
}

describe('parseScreeningResult', () => {
  it('returns null for null input', () => {
    expect(parseScreeningResult(null)).toBeNull()
  })

  it('returns null when kind is not "adaptive"', () => {
    expect(parseScreeningResult({ kind: 'other', clusters: [] })).toBeNull()
  })

  it('returns null when clusters is not an array', () => {
    expect(parseScreeningResult({ kind: 'adaptive', clusters: 'bad' })).toBeNull()
  })

  it('returns null for empty object', () => {
    expect(parseScreeningResult({})).toBeNull()
  })

  it('parses a valid summary', () => {
    const summary = {
      kind: 'adaptive',
      answered: 4,
      clusters: [makeCluster()],
    }
    const result = parseScreeningResult(summary)
    expect(result).not.toBeNull()
    expect(result!.clusters).toHaveLength(1)
  })

  it('accumulates overallAnswered across clusters', () => {
    const summary = {
      kind: 'adaptive',
      answered: 8,
      clusters: [
        makeCluster({ clusterId: 'A', answered: 3, correct: 2 }),
        makeCluster({ clusterId: 'B', answered: 5, correct: 4 }),
      ],
    }
    const result = parseScreeningResult(summary)!
    expect(result.overallAnswered).toBe(8)
    expect(result.overallCorrect).toBe(6)
  })

  it('calculates overallPct correctly', () => {
    const summary = {
      kind: 'adaptive',
      answered: 4,
      clusters: [makeCluster({ answered: 4, correct: 2, pending: 0 })],
    }
    const result = parseScreeningResult(summary)!
    expect(result.overallPct).toBe(50)
  })

  it('has displayLevel between 1 and 10', () => {
    const summary = {
      kind: 'adaptive',
      answered: 4,
      clusters: [makeCluster({ estimatedLevel: 3, mastery: 1.0 })],
    }
    const result = parseScreeningResult(summary)!
    expect(result.clusters[0].displayLevel).toBeGreaterThanOrEqual(1)
    expect(result.clusters[0].displayLevel).toBeLessThanOrEqual(10)
  })

  it('skips invalid clusters (missing clusterId)', () => {
    const summary = {
      kind: 'adaptive',
      answered: 2,
      clusters: [
        { clusterId: '', answered: 1, correct: 1 },
        makeCluster({ clusterId: 'valid' }),
      ],
    }
    const result = parseScreeningResult(summary)!
    expect(result.clusters).toHaveLength(1)
    expect(result.clusters[0].clusterId).toBe('valid')
  })

  it('clamps mastery to 0..1', () => {
    const summary = {
      kind: 'adaptive',
      answered: 2,
      clusters: [makeCluster({ mastery: 2.5 })],
    }
    const result = parseScreeningResult(summary)!
    expect(result.clusters[0].mastery).toBeLessThanOrEqual(1)
  })

  it('uses "low" confidence for unknown confidence value', () => {
    const summary = {
      kind: 'adaptive',
      answered: 1,
      clusters: [makeCluster({ confidence: 'unknown_value' })],
    }
    const result = parseScreeningResult(summary)!
    expect(result.clusters[0].confidence).toBe('low')
  })

  it('handles estimatedLevel 0', () => {
    const summary = {
      kind: 'adaptive',
      answered: 2,
      clusters: [makeCluster({ estimatedLevel: 0, reachedAfb: null })],
    }
    const result = parseScreeningResult(summary)!
    expect(result.clusters[0].estimatedLevel).toBe(0)
    expect(result.clusters[0].reachedAfb).toBeNull()
  })
})
