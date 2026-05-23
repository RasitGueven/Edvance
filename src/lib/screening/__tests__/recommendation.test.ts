import { describe, it, expect } from 'vitest'
import { deriveScreeningRecommendation } from '../recommendation'
import type { ParsedScreeningResult, ParsedClusterResult } from '../screeningResult'
import type { SkillCluster } from '@/types'
import type { ClusterProgressMap } from '../recommendation'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCluster(id: string, displayLevel: number): SkillCluster {
  return {
    id,
    subject: 'Mathematik',
    name: `Cluster ${id}`,
    description: null,
    sort_order: 0,
    class_levels: [8],
    active: true,
    created_at: new Date().toISOString(),
  }
}

function makeParsedCluster(clusterId: string, displayLevel: number): ParsedClusterResult {
  return {
    clusterId,
    answered: 4,
    correct: 3,
    pending: 0,
    estimatedLevel: 2,
    reachedAfb: 'II',
    mastery: 0.75,
    displayLevel,
    confidence: 'high',
  }
}

function makeParsed(clusters: ParsedClusterResult[]): ParsedScreeningResult {
  return {
    answered: clusters.reduce((s, c) => s + c.answered, 0),
    clusters,
    overallAnswered: clusters.reduce((s, c) => s + c.answered, 0),
    overallCorrect: clusters.reduce((s, c) => s + c.correct, 0),
    overallPending: 0,
    overallPct: 75,
  }
}

// ── deriveScreeningRecommendation ─────────────────────────────────────────────

describe('deriveScreeningRecommendation', () => {
  it('returns null recommendedClusterId when parsed is null', () => {
    const clusters = [makeCluster('c1', 5)]
    const result = deriveScreeningRecommendation(null, clusters, {})
    expect(result.recommendedClusterId).toBeNull()
    expect(result.orderedClusters).toEqual(clusters)
  })

  it('returns null recommendedClusterId when parsed has no clusters', () => {
    const clusters = [makeCluster('c1', 5)]
    const parsed = makeParsed([])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.recommendedClusterId).toBeNull()
  })

  it('assigns clusterStatusById based on displayLevel', () => {
    const clusters = [makeCluster('c1', 0)]
    const parsed = makeParsed([makeParsedCluster('c1', 2)])
    const result = deriveScreeningRecommendation(parsed, clusters, {
      c1: { completed: 0, total: 5 },
    })
    expect(result.clusterStatusById['c1'].label).toBe('Lücke')
    expect(result.clusterStatusById['c1'].displayLevel).toBe(2)
  })

  it('"Erkennbar" for displayLevel 4–6', () => {
    const clusters = [makeCluster('c1', 0)]
    const parsed = makeParsed([makeParsedCluster('c1', 5)])
    const result = deriveScreeningRecommendation(parsed, clusters, {
      c1: { completed: 0, total: 5 },
    })
    expect(result.clusterStatusById['c1'].label).toBe('Erkennbar')
  })

  it('"Sicher" for displayLevel 7+', () => {
    const clusters = [makeCluster('c1', 0)]
    const parsed = makeParsed([makeParsedCluster('c1', 8)])
    const result = deriveScreeningRecommendation(parsed, clusters, {
      c1: { completed: 0, total: 5 },
    })
    expect(result.clusterStatusById['c1'].label).toBe('Sicher')
  })

  it('picks weakest cluster with open tasks as recommendation', () => {
    const clusters = [makeCluster('strong', 0), makeCluster('weak', 0)]
    const parsed = makeParsed([
      makeParsedCluster('strong', 8),
      makeParsedCluster('weak', 2),
    ])
    const progress: ClusterProgressMap = {
      strong: { completed: 2, total: 5 },
      weak: { completed: 1, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('weak')
  })

  it('puts recommended cluster first in orderedClusters', () => {
    const clusters = [makeCluster('a', 0), makeCluster('b', 0)]
    const parsed = makeParsed([
      makeParsedCluster('a', 8),
      makeParsedCluster('b', 2),
    ])
    const progress: ClusterProgressMap = {
      a: { completed: 0, total: 5 },
      b: { completed: 0, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.orderedClusters[0].id).toBe('b')
  })

  it('ignores fully completed clusters for recommendation', () => {
    const clusters = [makeCluster('done', 0), makeCluster('open', 0)]
    const parsed = makeParsed([
      makeParsedCluster('done', 2),
      makeParsedCluster('open', 5),
    ])
    const progress: ClusterProgressMap = {
      done: { completed: 5, total: 5 },
      open: { completed: 1, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('open')
  })

  it('ignores clusters not in progress map', () => {
    const clusters = [makeCluster('c1', 0)]
    const parsed = makeParsed([makeParsedCluster('c1', 3)])
    const progress: ClusterProgressMap = {} // no progress entry for c1
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBeNull()
  })

  it('does not include status for clusters without screening data', () => {
    const clusters = [makeCluster('c1', 0), makeCluster('c2', 0)]
    const parsed = makeParsed([makeParsedCluster('c1', 5)])
    const result = deriveScreeningRecommendation(parsed, clusters, {
      c1: { completed: 0, total: 5 },
    })
    expect(result.clusterStatusById).not.toHaveProperty('c2')
  })
})
