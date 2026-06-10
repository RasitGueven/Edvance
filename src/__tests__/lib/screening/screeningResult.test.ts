import { describe, it, expect } from 'vitest'
import { parseScreeningResult } from '@/lib/screening/screeningResult'

describe('parseScreeningResult', () => {
  describe('null / invalid input', () => {
    it('null input → null', () => {
      expect(parseScreeningResult(null)).toBeNull()
    })

    it('wrong kind → null', () => {
      expect(parseScreeningResult({ kind: 'legacy', clusters: [] })).toBeNull()
    })

    it('missing clusters → null', () => {
      expect(parseScreeningResult({ kind: 'adaptive' })).toBeNull()
    })

    it('clusters not an array → null', () => {
      expect(parseScreeningResult({ kind: 'adaptive', clusters: 'bad' })).toBeNull()
    })
  })

  describe('valid summary with one cluster', () => {
    const validCluster = {
      clusterId: 'c1',
      answered: 4,
      correct: 3,
      pending: 0,
      estimatedLevel: 2,
      reachedAfb: 'II',
      mastery: 0.75,
      confidence: 'high',
    }

    const validSummary = {
      kind: 'adaptive',
      answered: 4,
      clusters: [validCluster],
    }

    it('parses a valid summary', () => {
      const result = parseScreeningResult(validSummary)
      expect(result).not.toBeNull()
      expect(result!.clusters).toHaveLength(1)
      expect(result!.clusters[0].clusterId).toBe('c1')
    })

    it('overallAnswered aggregates from clusters', () => {
      const result = parseScreeningResult(validSummary)!
      expect(result.overallAnswered).toBe(4)
    })

    it('overallCorrect aggregates from clusters', () => {
      const result = parseScreeningResult(validSummary)!
      expect(result.overallCorrect).toBe(3)
    })

    it('overallPending aggregates from clusters', () => {
      const result = parseScreeningResult(validSummary)!
      expect(result.overallPending).toBe(0)
    })
  })

  describe('displayLevel formula', () => {
    it('displayLevel = round(estimatedLevel * 2.5 + mastery * 2.5), clamped 1..10', () => {
      // estimatedLevel=2, mastery=1.0 → round(5 + 2.5) = round(7.5) = 8
      const summary = {
        kind: 'adaptive',
        clusters: [{
          clusterId: 'c1',
          answered: 2,
          correct: 2,
          pending: 0,
          estimatedLevel: 2,
          mastery: 1.0,
          confidence: 'high',
        }],
      }
      const result = parseScreeningResult(summary)!
      expect(result.clusters[0].displayLevel).toBe(8)
    })

    it('displayLevel is at least 1', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [{
          clusterId: 'c1',
          answered: 1,
          correct: 0,
          pending: 0,
          estimatedLevel: 0,
          mastery: 0,
          confidence: 'low',
        }],
      }
      const result = parseScreeningResult(summary)!
      // round(0 + 0) = 0, clamped to 1
      expect(result.clusters[0].displayLevel).toBe(1)
    })

    it('displayLevel is at most 10', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [{
          clusterId: 'c1',
          answered: 4,
          correct: 4,
          pending: 0,
          estimatedLevel: 3,
          mastery: 1.0,
          confidence: 'high',
        }],
      }
      const result = parseScreeningResult(summary)!
      // round(7.5 + 2.5) = 10
      expect(result.clusters[0].displayLevel).toBe(10)
    })
  })

  describe('reachedAfb fallback', () => {
    it('uses reachedAfb from data when provided', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [{
          clusterId: 'c1',
          answered: 2,
          correct: 2,
          pending: 0,
          estimatedLevel: 2,
          reachedAfb: 'II',
          mastery: 1.0,
          confidence: 'high',
        }],
      }
      const result = parseScreeningResult(summary)!
      expect(result.clusters[0].reachedAfb).toBe('II')
    })

    it('falls back to estimatedLevel when reachedAfb missing', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [{
          clusterId: 'c1',
          answered: 2,
          correct: 2,
          pending: 0,
          estimatedLevel: 3,
          mastery: 1.0,
          confidence: 'high',
        }],
      }
      const result = parseScreeningResult(summary)!
      expect(result.clusters[0].reachedAfb).toBe('III')
    })

    it('reachedAfb is null when estimatedLevel is 0 and not provided', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [{
          clusterId: 'c1',
          answered: 1,
          correct: 0,
          pending: 0,
          estimatedLevel: 0,
          mastery: 0,
          confidence: 'low',
        }],
      }
      const result = parseScreeningResult(summary)!
      expect(result.clusters[0].reachedAfb).toBeNull()
    })
  })

  describe('overallPct', () => {
    it('overallPct = round(correct / decided * 100)', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [{
          clusterId: 'c1',
          answered: 4,
          correct: 3,
          pending: 1,
          estimatedLevel: 2,
          mastery: 1.0,
          confidence: 'high',
        }],
      }
      const result = parseScreeningResult(summary)!
      // decided = 4 - 1 = 3, correct = 3 → 100%
      expect(result.overallPct).toBe(100)
    })

    it('overallPct is 0 when all pending (decided = 0)', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [{
          clusterId: 'c1',
          answered: 2,
          correct: 0,
          pending: 2,
          estimatedLevel: 0,
          mastery: 0,
          confidence: 'low',
        }],
      }
      const result = parseScreeningResult(summary)!
      expect(result.overallPct).toBe(0)
    })
  })

  describe('malformed cluster handling', () => {
    it('cluster without clusterId is skipped', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [
          { answered: 2, correct: 1, pending: 0, estimatedLevel: 1, mastery: 0.5, confidence: 'low' },
          { clusterId: 'valid', answered: 2, correct: 2, pending: 0, estimatedLevel: 2, mastery: 1.0, confidence: 'high' },
        ],
      }
      const result = parseScreeningResult(summary)!
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].clusterId).toBe('valid')
    })

    it('cluster with empty string clusterId is skipped', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [
          { clusterId: '', answered: 1, correct: 1, pending: 0, estimatedLevel: 1, mastery: 1.0, confidence: 'high' },
        ],
      }
      const result = parseScreeningResult(summary)!
      expect(result.clusters).toHaveLength(0)
    })
  })

  describe('multiple clusters', () => {
    it('aggregates across two clusters', () => {
      const summary = {
        kind: 'adaptive',
        clusters: [
          { clusterId: 'c1', answered: 3, correct: 2, pending: 0, estimatedLevel: 2, mastery: 0.67, confidence: 'medium' },
          { clusterId: 'c2', answered: 2, correct: 1, pending: 1, estimatedLevel: 1, mastery: 1.0, confidence: 'low' },
        ],
      }
      const result = parseScreeningResult(summary)!
      expect(result.overallAnswered).toBe(5)
      expect(result.overallCorrect).toBe(3)
      expect(result.overallPending).toBe(1)
    })
  })
})
