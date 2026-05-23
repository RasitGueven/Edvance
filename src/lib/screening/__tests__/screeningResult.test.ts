import { describe, it, expect } from 'vitest'
import { parseScreeningResult } from '../screeningResult'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCluster(overrides: Record<string, unknown> = {}): Record<string, unknown> {
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

function makeSummary(clusterOverrides: Record<string, unknown>[] = [makeCluster()]): Record<string, unknown> {
  return {
    kind: 'adaptive',
    answered: 4,
    clusters: clusterOverrides,
  }
}

// ── parseScreeningResult ──────────────────────────────────────────────────────

describe('parseScreeningResult', () => {
  it('returns null for null input', () => {
    expect(parseScreeningResult(null)).toBeNull()
  })

  it('returns null when kind is not "adaptive"', () => {
    expect(parseScreeningResult({ kind: 'legacy', clusters: [] })).toBeNull()
  })

  it('returns null when clusters is missing', () => {
    expect(parseScreeningResult({ kind: 'adaptive' })).toBeNull()
  })

  it('parses a valid summary correctly', () => {
    const result = parseScreeningResult(makeSummary())
    expect(result).not.toBeNull()
    expect(result!.clusters).toHaveLength(1)
    expect(result!.clusters[0].clusterId).toBe('cluster-1')
  })

  it('calculates overallAnswered correctly', () => {
    const summary = makeSummary([
      makeCluster({ clusterId: 'a', answered: 3, correct: 2, pending: 0 }),
      makeCluster({ clusterId: 'b', answered: 5, correct: 4, pending: 1 }),
    ])
    const result = parseScreeningResult(summary)!
    expect(result.overallAnswered).toBe(8)
    expect(result.overallCorrect).toBe(6)
    expect(result.overallPending).toBe(1)
  })

  it('calculates overallPct excluding pending', () => {
    // decided = 8-1 = 7, correct = 6 → pct = round(6/7*100) = 86
    const summary = makeSummary([
      makeCluster({ clusterId: 'a', answered: 4, correct: 3, pending: 0 }),
      makeCluster({ clusterId: 'b', answered: 4, correct: 3, pending: 1 }),
    ])
    const result = parseScreeningResult(summary)!
    // decided = 8 - 1 = 7, correct = 6 → 86%
    expect(result.overallPct).toBe(Math.round((6 / 7) * 100))
  })

  it('computes displayLevel within 1–10', () => {
    const result = parseScreeningResult(makeSummary())!
    const dl = result.clusters[0].displayLevel
    expect(dl).toBeGreaterThanOrEqual(1)
    expect(dl).toBeLessThanOrEqual(10)
  })

  it('handles estimatedLevel=0 gracefully', () => {
    const summary = makeSummary([makeCluster({ estimatedLevel: 0, reachedAfb: null })])
    const result = parseScreeningResult(summary)!
    expect(result.clusters[0].estimatedLevel).toBe(0)
    expect(result.clusters[0].reachedAfb).toBeNull()
  })

  it('skips invalid cluster entries', () => {
    const summary = makeSummary([
      makeCluster({ clusterId: 'good' }),
      { clusterId: '', answered: 1 }, // invalid: empty clusterId
      null, // invalid
    ])
    const result = parseScreeningResult(summary)!
    expect(result.clusters).toHaveLength(1)
    expect(result.clusters[0].clusterId).toBe('good')
  })

  it('normalizes mastery to 0–1 range', () => {
    const summary = makeSummary([makeCluster({ mastery: 1.5 })])
    const result = parseScreeningResult(summary)!
    expect(result.clusters[0].mastery).toBeLessThanOrEqual(1)
  })

  it('defaults confidence to "low" for unknown values', () => {
    const summary = makeSummary([makeCluster({ confidence: 'extreme' })])
    const result = parseScreeningResult(summary)!
    expect(result.clusters[0].confidence).toBe('low')
  })

  it('uses overallAnswered from summary.answered when provided', () => {
    const summary = makeSummary([makeCluster({ answered: 3, correct: 2, pending: 0 })])
    ;(summary as Record<string, unknown>).answered = 10
    const result = parseScreeningResult(summary)!
    expect(result.answered).toBe(10)
  })
})
