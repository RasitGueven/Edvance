import { describe, it, expect } from 'vitest'
import { parseScreeningResult } from '@/lib/screening/screeningResult'

function makeSummary(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'adaptive',
    answered: 6,
    clusters: [
      {
        clusterId: 'c1',
        answered: 4,
        correct: 3,
        pending: 0,
        estimatedLevel: 2,
        reachedAfb: 'II',
        mastery: 0.75,
        confidence: 'high',
      },
      {
        clusterId: 'c2',
        answered: 2,
        correct: 1,
        pending: 1,
        estimatedLevel: 1,
        reachedAfb: 'I',
        mastery: 0.5,
        confidence: 'low',
      },
    ],
    ...overrides,
  }
}

describe('parseScreeningResult – invalid input', () => {
  it('returns null for null input', () => {
    expect(parseScreeningResult(null)).toBeNull()
  })

  it('returns null when kind is not "adaptive"', () => {
    expect(parseScreeningResult({ kind: 'static', clusters: [] })).toBeNull()
  })

  it('returns null when clusters is not an array', () => {
    expect(parseScreeningResult({ kind: 'adaptive', clusters: 'bad' })).toBeNull()
  })

  it('returns result with empty clusters for empty array', () => {
    const result = parseScreeningResult({ kind: 'adaptive', answered: 0, clusters: [] })
    expect(result).not.toBeNull()
    expect(result?.clusters).toHaveLength(0)
  })
})

describe('parseScreeningResult – valid summary', () => {
  it('parses a valid summary successfully', () => {
    const result = parseScreeningResult(makeSummary())
    expect(result).not.toBeNull()
    expect(result?.clusters).toHaveLength(2)
  })

  it('computes overallAnswered as sum of all cluster answered', () => {
    const result = parseScreeningResult(makeSummary())
    expect(result?.overallAnswered).toBe(6) // 4 + 2
  })

  it('computes overallCorrect', () => {
    const result = parseScreeningResult(makeSummary())
    expect(result?.overallCorrect).toBe(4) // 3 + 1
  })

  it('computes overallPending', () => {
    const result = parseScreeningResult(makeSummary())
    expect(result?.overallPending).toBe(1)
  })

  it('computes overallPct correctly', () => {
    const result = parseScreeningResult(makeSummary())
    // decided = 6 - 1 = 5, correct = 4, pct = 80
    expect(result?.overallPct).toBe(80)
  })
})

describe('parseScreeningResult – cluster displayLevel', () => {
  it('maps estimatedLevel 2 + mastery 0.75 to displayLevel', () => {
    const result = parseScreeningResult(makeSummary())
    const c1 = result?.clusters.find((c) => c.clusterId === 'c1')
    // displayLevel = clamp(round(2 * 2.5 + 0.75 * 2.5), 1, 10) = clamp(round(6.875), 1, 10) = 7
    expect(c1?.displayLevel).toBe(7)
  })

  it('clamps displayLevel to 1–10', () => {
    const summary = makeSummary({
      clusters: [{
        clusterId: 'c-extreme',
        answered: 5,
        correct: 5,
        pending: 0,
        estimatedLevel: 3,
        reachedAfb: 'III',
        mastery: 1.0,
        confidence: 'high',
      }],
    })
    const result = parseScreeningResult(summary)
    const c = result?.clusters[0]
    expect(c?.displayLevel).toBeGreaterThanOrEqual(1)
    expect(c?.displayLevel).toBeLessThanOrEqual(10)
  })
})

describe('parseScreeningResult – defensive parsing', () => {
  it('skips cluster with empty clusterId', () => {
    const summary = makeSummary({
      clusters: [
        { clusterId: '', answered: 3, correct: 2, pending: 0, estimatedLevel: 1 },
        { clusterId: 'valid', answered: 3, correct: 2, pending: 0, estimatedLevel: 1 },
      ],
    })
    const result = parseScreeningResult(summary)
    expect(result?.clusters).toHaveLength(1)
    expect(result?.clusters[0].clusterId).toBe('valid')
  })

  it('defaults missing numeric fields to 0', () => {
    const summary = {
      kind: 'adaptive',
      clusters: [{ clusterId: 'c1' }],
    }
    const result = parseScreeningResult(summary)
    expect(result?.clusters[0].answered).toBe(0)
    expect(result?.clusters[0].correct).toBe(0)
  })

  it('defaults unknown confidence to "low"', () => {
    const summary = makeSummary({
      clusters: [{
        clusterId: 'c1',
        answered: 2,
        correct: 1,
        pending: 0,
        estimatedLevel: 1,
        confidence: 'garbage',
      }],
    })
    const result = parseScreeningResult(summary)
    expect(result?.clusters[0].confidence).toBe('low')
  })
})
