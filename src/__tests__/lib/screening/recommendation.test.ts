import { describe, it, expect } from 'vitest'
import { deriveScreeningRecommendation } from '@/lib/screening/recommendation'
import type { ParsedScreeningResult } from '@/lib/screening/screeningResult'
import type { SkillCluster } from '@/types'

function makeCluster(id: string, sortOrder = 0): SkillCluster {
  return {
    id,
    name: `Cluster ${id}`,
    subject_id: 'math',
    class_level_min: 5,
    class_level_max: 8,
    sort_order: sortOrder,
  }
}

function makeParsed(clusters: { clusterId: string; displayLevel: number }[]): ParsedScreeningResult {
  return {
    answered: clusters.length * 4,
    overallAnswered: clusters.length * 4,
    overallCorrect: clusters.length * 2,
    overallPending: 0,
    overallPct: 50,
    clusters: clusters.map((c) => ({
      clusterId: c.clusterId,
      displayLevel: c.displayLevel,
      reachedAfb: null,
      mastery: 0.5,
      answered: 4,
      correct: 2,
      pending: 0,
      estimatedLevel: 2 as 0 | 1 | 2 | 3,
      confidence: 'medium' as const,
    })),
  }
}

describe('deriveScreeningRecommendation', () => {
  it('returns empty result when parsed is null', () => {
    const result = deriveScreeningRecommendation(null, [], {})
    expect(result.clusterStatusById).toEqual({})
    expect(result.recommendedClusterId).toBeNull()
    expect(result.orderedClusters).toEqual([])
  })

  it('returns empty result when parsed has no clusters', () => {
    const parsed = makeParsed([])
    const clusters = [makeCluster('c1')]
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById).toEqual({})
    expect(result.recommendedClusterId).toBeNull()
  })

  it('maps displayLevel <= 3 to "Lücke"', () => {
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 2 }])
    const clusters = [makeCluster('c1')]
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['c1']?.label).toBe('Lücke')
  })

  it('maps displayLevel 4–6 to "Erkennbar"', () => {
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 5 }])
    const clusters = [makeCluster('c1')]
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['c1']?.label).toBe('Erkennbar')
  })

  it('maps displayLevel > 6 to "Sicher"', () => {
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 8 }])
    const clusters = [makeCluster('c1')]
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['c1']?.label).toBe('Sicher')
  })

  it('recommends the cluster with lowest displayLevel that has open tasks', () => {
    const parsed = makeParsed([
      { clusterId: 'c1', displayLevel: 7 },
      { clusterId: 'c2', displayLevel: 3 },
      { clusterId: 'c3', displayLevel: 5 },
    ])
    const clusters = [makeCluster('c1'), makeCluster('c2'), makeCluster('c3')]
    const progress = {
      c1: { completed: 2, total: 5 },
      c2: { completed: 1, total: 4 },
      c3: { completed: 0, total: 3 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('c2')
  })

  it('does not recommend cluster with no open tasks', () => {
    const parsed = makeParsed([
      { clusterId: 'c1', displayLevel: 2 },  // lowest but done
      { clusterId: 'c2', displayLevel: 5 },
    ])
    const clusters = [makeCluster('c1'), makeCluster('c2')]
    const progress = {
      c1: { completed: 5, total: 5 },  // fully done
      c2: { completed: 0, total: 3 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('c2')
  })

  it('returns null recommendedClusterId when all clusters are done', () => {
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 3 }])
    const clusters = [makeCluster('c1')]
    const progress = { c1: { completed: 5, total: 5 } }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBeNull()
  })

  it('places recommended cluster first in orderedClusters', () => {
    const parsed = makeParsed([
      { clusterId: 'c1', displayLevel: 8 },
      { clusterId: 'c2', displayLevel: 2 },
    ])
    const clusters = [makeCluster('c1', 0), makeCluster('c2', 1)]
    const progress = {
      c1: { completed: 0, total: 3 },
      c2: { completed: 0, total: 3 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.orderedClusters[0].id).toBe('c2')
    expect(result.orderedClusters[1].id).toBe('c1')
  })
})
