import { describe, it, expect } from 'vitest'
import { deriveScreeningRecommendation } from '../recommendation'
import type { ParsedScreeningResult, ParsedClusterResult } from '@/lib/screening/screeningResult'
import type { SkillCluster } from '@/types'

function makeClusterResult(overrides: Partial<ParsedClusterResult> = {}): ParsedClusterResult {
  return {
    clusterId: 'c1',
    answered: 4,
    correct: 2,
    pending: 0,
    estimatedLevel: 1,
    reachedAfb: 'I',
    mastery: 0.5,
    displayLevel: 3,
    confidence: 'medium',
    ...overrides,
  }
}

function makeParsed(clusters: ParsedClusterResult[]): ParsedScreeningResult {
  const answered = clusters.reduce((s, c) => s + c.answered, 0)
  const correct = clusters.reduce((s, c) => s + c.correct, 0)
  const pending = clusters.reduce((s, c) => s + c.pending, 0)
  return {
    answered,
    clusters,
    overallAnswered: answered,
    overallCorrect: correct,
    overallPending: pending,
    overallPct: answered === 0 ? 0 : Math.round((correct / answered) * 100),
  }
}

function makeCluster(id: string, name = 'Cluster', sortOrder = 0): SkillCluster {
  return {
    id,
    name,
    subject: 'Mathematik',
    sort_order: sortOrder,
    description: null,
    active: true,
  }
}

describe('deriveScreeningRecommendation', () => {
  it('returns empty result when parsed is null', () => {
    const clusters = [makeCluster('c1'), makeCluster('c2')]
    const result = deriveScreeningRecommendation(null, clusters, {})
    expect(result.recommendedClusterId).toBeNull()
    expect(result.clusterStatusById).toEqual({})
    expect(result.orderedClusters).toEqual(clusters)
  })

  it('returns empty result when parsed has no clusters', () => {
    const parsed = makeParsed([])
    const clusters = [makeCluster('c1')]
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.recommendedClusterId).toBeNull()
    expect(result.clusterStatusById).toEqual({})
  })

  describe('clusterStatusById', () => {
    it('maps displayLevel <= 3 to Lücke', () => {
      const parsed = makeParsed([makeClusterResult({ clusterId: 'c1', displayLevel: 2 })])
      const result = deriveScreeningRecommendation(parsed, [makeCluster('c1')], {})
      expect(result.clusterStatusById['c1']?.label).toBe('Lücke')
    })

    it('maps displayLevel <= 6 to Erkennbar', () => {
      const parsed = makeParsed([makeClusterResult({ clusterId: 'c1', displayLevel: 5 })])
      const result = deriveScreeningRecommendation(parsed, [makeCluster('c1')], {})
      expect(result.clusterStatusById['c1']?.label).toBe('Erkennbar')
    })

    it('maps displayLevel > 6 to Sicher', () => {
      const parsed = makeParsed([makeClusterResult({ clusterId: 'c1', displayLevel: 8 })])
      const result = deriveScreeningRecommendation(parsed, [makeCluster('c1')], {})
      expect(result.clusterStatusById['c1']?.label).toBe('Sicher')
    })

    it('stores exact displayLevel', () => {
      const parsed = makeParsed([makeClusterResult({ clusterId: 'c1', displayLevel: 5 })])
      const result = deriveScreeningRecommendation(parsed, [makeCluster('c1')], {})
      expect(result.clusterStatusById['c1']?.displayLevel).toBe(5)
    })

    it('only maps clusters present in clusters array', () => {
      const parsed = makeParsed([
        makeClusterResult({ clusterId: 'c1', displayLevel: 3 }),
        makeClusterResult({ clusterId: 'c2', displayLevel: 7 }),
      ])
      // Only pass c1 in clusters, not c2
      const result = deriveScreeningRecommendation(parsed, [makeCluster('c1')], {})
      expect('c1' in result.clusterStatusById).toBe(true)
      expect('c2' in result.clusterStatusById).toBe(false)
    })
  })

  describe('recommendedClusterId', () => {
    it('recommends cluster with open tasks and lowest displayLevel', () => {
      const parsed = makeParsed([
        makeClusterResult({ clusterId: 'c1', displayLevel: 5 }),
        makeClusterResult({ clusterId: 'c2', displayLevel: 2 }),
      ])
      const clusters = [makeCluster('c1'), makeCluster('c2')]
      const progress = {
        c1: { completed: 2, total: 5 },
        c2: { completed: 1, total: 5 },
      }
      const result = deriveScreeningRecommendation(parsed, clusters, progress)
      expect(result.recommendedClusterId).toBe('c2') // lower displayLevel
    })

    it('skips clusters with no open tasks', () => {
      const parsed = makeParsed([
        makeClusterResult({ clusterId: 'c1', displayLevel: 2 }),
        makeClusterResult({ clusterId: 'c2', displayLevel: 5 }),
      ])
      const clusters = [makeCluster('c1'), makeCluster('c2')]
      const progress = {
        c1: { completed: 5, total: 5 }, // completed
        c2: { completed: 1, total: 5 }, // has open tasks
      }
      const result = deriveScreeningRecommendation(parsed, clusters, progress)
      expect(result.recommendedClusterId).toBe('c2')
    })

    it('returns null when all clusters are complete', () => {
      const parsed = makeParsed([
        makeClusterResult({ clusterId: 'c1', displayLevel: 2 }),
      ])
      const progress = { c1: { completed: 5, total: 5 } }
      const result = deriveScreeningRecommendation(parsed, [makeCluster('c1')], progress)
      expect(result.recommendedClusterId).toBeNull()
    })

    it('returns null when progress map is empty', () => {
      const parsed = makeParsed([makeClusterResult({ clusterId: 'c1', displayLevel: 2 })])
      const result = deriveScreeningRecommendation(parsed, [makeCluster('c1')], {})
      expect(result.recommendedClusterId).toBeNull()
    })
  })

  describe('orderedClusters', () => {
    it('puts recommended cluster first', () => {
      const parsed = makeParsed([
        makeClusterResult({ clusterId: 'c1', displayLevel: 5 }),
        makeClusterResult({ clusterId: 'c2', displayLevel: 2 }),
      ])
      const clusters = [makeCluster('c1', 'Algebra', 0), makeCluster('c2', 'Zahlen', 1)]
      const progress = {
        c1: { completed: 1, total: 5 },
        c2: { completed: 1, total: 5 },
      }
      const result = deriveScreeningRecommendation(parsed, clusters, progress)
      expect(result.orderedClusters[0].id).toBe('c2') // recommended → first
    })

    it('returns original order when no recommendation', () => {
      const parsed = makeParsed([makeClusterResult({ clusterId: 'c1', displayLevel: 2 })])
      const clusters = [makeCluster('c1'), makeCluster('c2')]
      const result = deriveScreeningRecommendation(parsed, clusters, {})
      expect(result.orderedClusters).toEqual(clusters)
    })
  })
})
