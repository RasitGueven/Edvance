import { describe, it, expect } from 'vitest'
import { parseScreeningResult } from '@/lib/screening/screeningResult'

function validSummary(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'adaptive',
    answered: 8,
    clusters: [
      {
        clusterId: 'algebra',
        answered: 4,
        correct: 3,
        pending: 0,
        estimatedLevel: 2,
        reachedAfb: 'II',
        mastery: 0.75,
        confidence: 'high',
      },
      {
        clusterId: 'geometrie',
        answered: 4,
        correct: 2,
        pending: 1,
        estimatedLevel: 1,
        reachedAfb: 'I',
        mastery: 0.5,
        confidence: 'medium',
      },
    ],
    ...overrides,
  }
}

describe('parseScreeningResult', () => {
  describe('returns null for invalid input', () => {
    it('null', () => expect(parseScreeningResult(null)).toBeNull())
    it('wrong kind', () =>
      expect(parseScreeningResult({ kind: 'manual', clusters: [] })).toBeNull())
    it('missing clusters', () =>
      expect(parseScreeningResult({ kind: 'adaptive' } as any)).toBeNull())
  })

  describe('valid summary', () => {
    it('returns a ParsedScreeningResult', () => {
      const result = parseScreeningResult(validSummary())
      expect(result).not.toBeNull()
      expect(result!.clusters).toHaveLength(2)
    })

    it('preserves overallAnswered as sum of cluster answered', () => {
      const result = parseScreeningResult(validSummary())!
      expect(result.overallAnswered).toBe(8) // 4 + 4
    })

    it('computes overallCorrect', () => {
      const result = parseScreeningResult(validSummary())!
      expect(result.overallCorrect).toBe(5) // 3 + 2
    })

    it('computes overallPending', () => {
      const result = parseScreeningResult(validSummary())!
      expect(result.overallPending).toBe(1)
    })

    it('computes overallPct (correct / decided * 100)', () => {
      // decided = 8 - 1 = 7, correct = 5 → 71%
      const result = parseScreeningResult(validSummary())!
      expect(result.overallPct).toBe(Math.round((5 / 7) * 100))
    })

    it('computes displayLevel = clamp(round(estimatedLevel * 2.5 + mastery * 2.5), 1, 10)', () => {
      const result = parseScreeningResult(validSummary())!
      const algebra = result.clusters.find(c => c.clusterId === 'algebra')!
      // estimatedLevel=2, mastery=0.75 → 2*2.5 + 0.75*2.5 = 5 + 1.875 = 6.875 → round → 7
      expect(algebra.displayLevel).toBe(7)
    })

    it('falls back to inferred reachedAfb when missing', () => {
      const summary = validSummary()
      summary.clusters[0] = { ...summary.clusters[0], reachedAfb: null }
      const result = parseScreeningResult(summary)!
      const algebra = result.clusters[0]
      // estimatedLevel=2 → inferred 'II'
      expect(algebra.reachedAfb).toBe('II')
    })

    it('skips clusters without a valid clusterId', () => {
      const summary = validSummary()
      summary.clusters.push({ clusterId: '', answered: 1, correct: 1, pending: 0, estimatedLevel: 1 })
      const result = parseScreeningResult(summary)!
      expect(result.clusters).toHaveLength(2) // invalid cluster excluded
    })

    it('clamps mastery to 0..1', () => {
      const summary = validSummary()
      summary.clusters[0] = { ...summary.clusters[0], mastery: 1.5 }
      const result = parseScreeningResult(summary)!
      expect(result.clusters[0].mastery).toBe(1)
    })

    it('defaults confidence to "low" for unknown value', () => {
      const summary = validSummary()
      summary.clusters[0] = { ...summary.clusters[0], confidence: 'unknown' }
      const result = parseScreeningResult(summary)!
      expect(result.clusters[0].confidence).toBe('low')
    })
  })
})
