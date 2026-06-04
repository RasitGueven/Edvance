import { describe, it, expect } from 'vitest'
import {
  deriveScreeningRecommendation,
  type ClusterProgressMap,
} from '@/lib/screening/recommendation'
import type { ParsedScreeningResult } from '@/lib/screening/screeningResult'
import type { SkillCluster } from '@/types'

function makeCluster(id: string, name = id): SkillCluster {
  return {
    id,
    name,
    subject_id: 'subj-1',
    class_level_min: 5,
    class_level_max: 10,
    sort_order: 0,
  }
}

function makeParsed(clusters: { clusterId: string; displayLevel: number }[]): ParsedScreeningResult {
  const parsedClusters = clusters.map((c) => ({
    clusterId: c.clusterId,
    answered: 4,
    correct: 2,
    pending: 0,
    estimatedLevel: 1 as const,
    reachedAfb: 'I' as const,
    mastery: 0.5,
    displayLevel: c.displayLevel,
    confidence: 'medium' as const,
  }))
  const overallAnswered = parsedClusters.reduce((s, c) => s + c.answered, 0)
  return {
    answered: overallAnswered,
    clusters: parsedClusters,
    overallAnswered,
    overallCorrect: parsedClusters.reduce((s, c) => s + c.correct, 0),
    overallPending: 0,
    overallPct: 50,
  }
}

describe('deriveScreeningRecommendation – null parsed', () => {
  it('returns empty status map and original cluster order when parsed is null', () => {
    const clusters = [makeCluster('c1'), makeCluster('c2')]
    const result = deriveScreeningRecommendation(null, clusters, {})
    expect(result.clusterStatusById).toEqual({})
    expect(result.recommendedClusterId).toBeNull()
    expect(result.orderedClusters).toEqual(clusters)
  })

  it('returns original order when parsed has no clusters', () => {
    const clusters = [makeCluster('c1')]
    const result = deriveScreeningRecommendation(makeParsed([]), clusters, {})
    expect(result.orderedClusters).toEqual(clusters)
  })
})

describe('deriveScreeningRecommendation – status labels', () => {
  it('maps displayLevel ≤3 → Lücke', () => {
    const clusters = [makeCluster('c1')]
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 2 }])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['c1'].label).toBe('Lücke')
  })

  it('maps displayLevel 4–6 → Erkennbar', () => {
    const clusters = [makeCluster('c1')]
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 5 }])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['c1'].label).toBe('Erkennbar')
  })

  it('maps displayLevel >6 → Sicher', () => {
    const clusters = [makeCluster('c1')]
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 8 }])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['c1'].label).toBe('Sicher')
  })

  it('does not include clusters not in parsed result', () => {
    const clusters = [makeCluster('c1'), makeCluster('unknown')]
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 5 }])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['unknown']).toBeUndefined()
  })
})

describe('deriveScreeningRecommendation – recommendedClusterId', () => {
  it('recommends the cluster with lowest displayLevel that has open tasks', () => {
    const clusters = [makeCluster('c1'), makeCluster('c2')]
    const parsed = makeParsed([
      { clusterId: 'c1', displayLevel: 7 },
      { clusterId: 'c2', displayLevel: 2 },
    ])
    const progress: ClusterProgressMap = {
      c1: { completed: 2, total: 5 },
      c2: { completed: 1, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('c2')
  })

  it('ignores clusters with no open tasks (fully completed)', () => {
    const clusters = [makeCluster('c1'), makeCluster('c2')]
    const parsed = makeParsed([
      { clusterId: 'c1', displayLevel: 1 },
      { clusterId: 'c2', displayLevel: 5 },
    ])
    const progress: ClusterProgressMap = {
      c1: { completed: 5, total: 5 },
      c2: { completed: 2, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('c2')
  })

  it('returns null when no cluster has open tasks', () => {
    const clusters = [makeCluster('c1')]
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 4 }])
    const progress: ClusterProgressMap = {
      c1: { completed: 5, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBeNull()
  })
})

describe('deriveScreeningRecommendation – orderedClusters', () => {
  it('puts recommended cluster first', () => {
    const clusters = [makeCluster('c1'), makeCluster('c2'), makeCluster('c3')]
    const parsed = makeParsed([
      { clusterId: 'c1', displayLevel: 5 },
      { clusterId: 'c2', displayLevel: 2 },
      { clusterId: 'c3', displayLevel: 7 },
    ])
    const progress: ClusterProgressMap = {
      c2: { completed: 1, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.orderedClusters[0].id).toBe('c2')
  })

  it('keeps original order when there is no recommendation', () => {
    const clusters = [makeCluster('c1'), makeCluster('c2')]
    const parsed = makeParsed([{ clusterId: 'c1', displayLevel: 4 }])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.orderedClusters.map((c) => c.id)).toEqual(['c1', 'c2'])
  })
})
