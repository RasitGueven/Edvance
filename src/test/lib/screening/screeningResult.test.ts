import { describe, it, expect } from 'vitest'
import { parseScreeningResult } from '@/lib/screening/screeningResult'

function makeSummary(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'adaptive',
    answered: 6,
    clusters: [
      { clusterId: 'algebra', answered: 3, correct: 2, estimatedLevel: 2, mastery: 0.67 },
      { clusterId: 'geometrie', answered: 3, correct: 1, estimatedLevel: 1, mastery: 0.33 },
    ],
    ...overrides,
  }
}

describe('parseScreeningResult()', () => {
  it('returns null for null input', () => {
    expect(parseScreeningResult(null)).toBeNull()
  })

  it('returns null when kind is not "adaptive"', () => {
    expect(parseScreeningResult({ kind: 'manual', clusters: [] })).toBeNull()
  })

  it('returns null when clusters is not an array', () => {
    expect(parseScreeningResult({ kind: 'adaptive', clusters: null })).toBeNull()
  })

  it('parses a valid summary', () => {
    const result = parseScreeningResult(makeSummary())
    expect(result).not.toBeNull()
    expect(result!.clusters).toHaveLength(2)
    expect(result!.answered).toBe(6)
  })

  it('computes overallAnswered and overallCorrect from clusters', () => {
    const result = parseScreeningResult(makeSummary())!
    expect(result.overallAnswered).toBe(6) // 3 + 3
    expect(result.overallCorrect).toBe(3)  // 2 + 1
  })

  it('computes overallPct correctly', () => {
    const result = parseScreeningResult(makeSummary())!
    expect(result.overallPct).toBe(50) // 3/6 = 50%
  })

  it('returns overallPct 0 when no questions answered', () => {
    const summary = makeSummary({
      clusters: [
        { clusterId: 'test', answered: 0, correct: 0, estimatedLevel: 0, mastery: 0 },
      ],
    })
    const result = parseScreeningResult(summary)!
    expect(result.overallPct).toBe(0)
  })

  it('skips malformed cluster entries', () => {
    const summary = makeSummary({
      clusters: [
        { clusterId: 'algebra', answered: 2, correct: 1, estimatedLevel: 2, mastery: 0.5 },
        { clusterId: '', answered: 1, correct: 0, estimatedLevel: 1, mastery: 0 }, // invalid: empty clusterId
        null, // invalid
      ],
    })
    const result = parseScreeningResult(summary)!
    expect(result.clusters).toHaveLength(1)
  })

  it('clamps mastery to 0–1', () => {
    const summary = makeSummary({
      clusters: [
        { clusterId: 'test', answered: 1, correct: 1, estimatedLevel: 3, mastery: 1.5 },
      ],
    })
    const result = parseScreeningResult(summary)!
    expect(result.clusters[0].mastery).toBe(1)
  })

  describe('displayLevel mapping', () => {
    it('computes displayLevel for estimatedLevel=0, mastery=0 → 1', () => {
      const summary = makeSummary({
        clusters: [
          { clusterId: 'test', answered: 1, correct: 0, estimatedLevel: 0, mastery: 0 },
        ],
      })
      const result = parseScreeningResult(summary)!
      expect(result.clusters[0].displayLevel).toBe(1) // clamp(round(0+0), 1, 10)
    })

    it('computes displayLevel for estimatedLevel=3, mastery=1 → 10', () => {
      const summary = makeSummary({
        clusters: [
          { clusterId: 'test', answered: 3, correct: 3, estimatedLevel: 3, mastery: 1 },
        ],
      })
      const result = parseScreeningResult(summary)!
      expect(result.clusters[0].displayLevel).toBe(10) // round(3*2.5 + 1*2.5) = 10
    })

    it('computes displayLevel for estimatedLevel=2, mastery=0.5 → 8', () => {
      const summary = makeSummary({
        clusters: [
          { clusterId: 'test', answered: 2, correct: 1, estimatedLevel: 2, mastery: 0.5 },
        ],
      })
      const result = parseScreeningResult(summary)!
      expect(result.clusters[0].displayLevel).toBe(6) // round(2*2.5 + 0.5*2.5) = round(6.25) = 6
    })
  })

  it('falls back answered to overallAnswered when summary.answered is missing', () => {
    const { answered: _, ...summaryWithoutAnswered } = makeSummary()
    const result = parseScreeningResult(summaryWithoutAnswered)!
    expect(result.answered).toBe(result.overallAnswered)
  })
})
