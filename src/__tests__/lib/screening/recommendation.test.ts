import { describe, it, expect } from 'vitest'
import { deriveScreeningRecommendation } from '@/lib/screening/recommendation'
import type { SkillCluster } from '@/types'
import type { ParsedScreeningResult } from '@/lib/screening/screeningResult'
import type { ClusterProgressMap } from '@/lib/screening/recommendation'

function makeCluster(id: string, sort_order: number): SkillCluster {
  return {
    id,
    subject_id: 's1',
    name: `Cluster ${id}`,
    class_level_min: 5,
    class_level_max: 10,
    sort_order,
  }
}

function makeParsedResult(clusters: ParsedScreeningResult['clusters']): ParsedScreeningResult {
  const answered = clusters.reduce((s, c) => s + c.answered, 0)
  const correct = clusters.reduce((s, c) => s + c.correct, 0)
  const pending = clusters.reduce((s, c) => s + c.pending, 0)
  const decided = answered - pending
  return {
    answered,
    clusters,
    overallAnswered: answered,
    overallCorrect: correct,
    overallPending: pending,
    overallPct: decided === 0 ? 0 : Math.round((correct / decided) * 100),
  }
}

function makeClusterResult(
  clusterId: string,
  displayLevel: number,
): ParsedScreeningResult['clusters'][number] {
  return {
    clusterId,
    answered: 4,
    correct: 2,
    pending: 0,
    estimatedLevel: 2,
    reachedAfb: 'II',
    mastery: 0.5,
    displayLevel,
    confidence: 'medium',
  }
}

describe('deriveScreeningRecommendation', () => {
  describe('null parsed result', () => {
    it('returns original clusters and null recommendedClusterId', () => {
      const clusters = [makeCluster('c1', 1), makeCluster('c2', 2)]
      const result = deriveScreeningRecommendation(null, clusters, {})
      expect(result.recommendedClusterId).toBeNull()
      expect(result.orderedClusters).toEqual(clusters)
    })

    it('empty clusterStatusById when parsed is null', () => {
      const result = deriveScreeningRecommendation(null, [makeCluster('c1', 1)], {})
      expect(result.clusterStatusById).toEqual({})
    })
  })

  describe('parsed result with empty clusters', () => {
    it('empty clusters → recommendedClusterId is null', () => {
      const parsed = makeParsedResult([])
      const clusters = [makeCluster('c1', 1)]
      const result = deriveScreeningRecommendation(parsed, clusters, {})
      expect(result.recommendedClusterId).toBeNull()
    })
  })

  describe('recommendation logic', () => {
    it('cluster with lowest displayLevel and open tasks gets recommended', () => {
      const clusters = [makeCluster('c1', 1), makeCluster('c2', 2)]
      const parsed = makeParsedResult([
        makeClusterResult('c1', 5),
        makeClusterResult('c2', 3),
      ])
      const progress: ClusterProgressMap = {
        c1: { completed: 1, total: 5 },
        c2: { completed: 2, total: 5 },
      }
      const result = deriveScreeningRecommendation(parsed, clusters, progress)
      // c2 has lower displayLevel (3) and open tasks
      expect(result.recommendedClusterId).toBe('c2')
    })

    it('cluster with no open tasks is skipped for recommendation', () => {
      const clusters = [makeCluster('c1', 1), makeCluster('c2', 2)]
      const parsed = makeParsedResult([
        makeClusterResult('c1', 2), // lowest level
        makeClusterResult('c2', 5),
      ])
      const progress: ClusterProgressMap = {
        c1: { completed: 5, total: 5 }, // all done
        c2: { completed: 1, total: 5 },
      }
      const result = deriveScreeningRecommendation(parsed, clusters, progress)
      // c1 is done → c2 should be recommended
      expect(result.recommendedClusterId).toBe('c2')
    })

    it('cluster with zero total tasks is skipped', () => {
      const clusters = [makeCluster('c1', 1)]
      const parsed = makeParsedResult([makeClusterResult('c1', 2)])
      const progress: ClusterProgressMap = {
        c1: { completed: 0, total: 0 },
      }
      const result = deriveScreeningRecommendation(parsed, clusters, progress)
      expect(result.recommendedClusterId).toBeNull()
    })

    it('cluster missing from progress is skipped', () => {
      const clusters = [makeCluster('c1', 1)]
      const parsed = makeParsedResult([makeClusterResult('c1', 2)])
      const result = deriveScreeningRecommendation(parsed, clusters, {})
      expect(result.recommendedClusterId).toBeNull()
    })
  })

  describe('orderedClusters', () => {
    it('puts recommended cluster first', () => {
      const clusters = [makeCluster('c1', 1), makeCluster('c2', 2), makeCluster('c3', 3)]
      const parsed = makeParsedResult([
        makeClusterResult('c1', 6),
        makeClusterResult('c2', 3),
        makeClusterResult('c3', 8),
      ])
      const progress: ClusterProgressMap = {
        c1: { completed: 1, total: 5 },
        c2: { completed: 1, total: 5 },
        c3: { completed: 1, total: 5 },
      }
      const result = deriveScreeningRecommendation(parsed, clusters, progress)
      expect(result.orderedClusters[0].id).toBe('c2')
    })

    it('keeps all clusters in result', () => {
      const clusters = [makeCluster('c1', 1), makeCluster('c2', 2)]
      const parsed = makeParsedResult([
        makeClusterResult('c1', 4),
        makeClusterResult('c2', 6),
      ])
      const progress: ClusterProgressMap = {
        c1: { completed: 1, total: 3 },
        c2: { completed: 0, total: 3 },
      }
      const result = deriveScreeningRecommendation(parsed, clusters, progress)
      expect(result.orderedClusters).toHaveLength(2)
    })

    it('null recommendation → original order preserved', () => {
      const clusters = [makeCluster('c1', 1), makeCluster('c2', 2)]
      const parsed = makeParsedResult([
        makeClusterResult('c1', 4),
        makeClusterResult('c2', 6),
      ])
      const result = deriveScreeningRecommendation(parsed, clusters, {})
      expect(result.orderedClusters).toEqual(clusters)
    })
  })

  describe('clusterStatusById', () => {
    it('assigns Lücke label for displayLevel ≤ 3', () => {
      const clusters = [makeCluster('c1', 1)]
      const parsed = makeParsedResult([makeClusterResult('c1', 3)])
      const result = deriveScreeningRecommendation(parsed, clusters, {})
      expect(result.clusterStatusById['c1'].label).toBe('Lücke')
    })

    it('assigns Erkennbar label for displayLevel ≤ 6', () => {
      const clusters = [makeCluster('c1', 1)]
      const parsed = makeParsedResult([makeClusterResult('c1', 6)])
      const result = deriveScreeningRecommendation(parsed, clusters, {})
      expect(result.clusterStatusById['c1'].label).toBe('Erkennbar')
    })

    it('assigns Sicher label for displayLevel > 6', () => {
      const clusters = [makeCluster('c1', 1)]
      const parsed = makeParsedResult([makeClusterResult('c1', 7)])
      const result = deriveScreeningRecommendation(parsed, clusters, {})
      expect(result.clusterStatusById['c1'].label).toBe('Sicher')
    })

    it('clusters not in parsed result have no entry in clusterStatusById', () => {
      const clusters = [makeCluster('c1', 1), makeCluster('c2', 2)]
      const parsed = makeParsedResult([makeClusterResult('c1', 5)])
      const result = deriveScreeningRecommendation(parsed, clusters, {})
      expect(result.clusterStatusById['c2']).toBeUndefined()
    })
  })
})
