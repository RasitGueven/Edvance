import { describe, it, expect } from 'vitest'
import {
  deriveScreeningRecommendation,
  type ClusterProgressMap,
} from '@/lib/screening/recommendation'
import type { ParsedScreeningResult } from '@/lib/screening/screeningResult'
import type { SkillCluster } from '@/types'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeCluster(id: string, sort_order = 0): SkillCluster {
  return {
    id,
    name: id,
    subject: 'Mathematik',
    sort_order,
    description: null,
  }
}

function makeResult(clusters: { clusterId: string; displayLevel: number }[]): ParsedScreeningResult {
  return {
    answered: 8,
    overallAnswered: 8,
    overallCorrect: 5,
    overallPending: 0,
    overallPct: 62,
    clusters: clusters.map(({ clusterId, displayLevel }) => ({
      clusterId,
      answered: 4,
      correct: 3,
      pending: 0,
      estimatedLevel: 2,
      reachedAfb: 'II',
      mastery: 0.75,
      displayLevel,
      confidence: 'high',
    })),
  }
}

// ── null / empty parsed ───────────────────────────────────────────────────────

describe('deriveScreeningRecommendation – no parsed result', () => {
  it('returns passthrough when parsed is null', () => {
    const clusters = [makeCluster('c1'), makeCluster('c2')]
    const result = deriveScreeningRecommendation(null, clusters, {})
    expect(result.recommendedClusterId).toBeNull()
    expect(result.orderedClusters).toEqual(clusters)
    expect(result.clusterStatusById).toEqual({})
  })

  it('returns passthrough for parsed with empty clusters', () => {
    const parsed: ParsedScreeningResult = { ...makeResult([]), clusters: [] }
    const clusters = [makeCluster('c1')]
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.recommendedClusterId).toBeNull()
  })
})

// ── status labels ─────────────────────────────────────────────────────────────

describe('deriveScreeningRecommendation – status labels', () => {
  it('assigns "Lücke" for displayLevel <= 3', () => {
    const clusters = [makeCluster('c1')]
    const parsed = makeResult([{ clusterId: 'c1', displayLevel: 2 }])
    const result = deriveScreeningRecommendation(parsed, clusters, { c1: { completed: 1, total: 5 } })
    expect(result.clusterStatusById['c1'].label).toBe('Lücke')
  })

  it('assigns "Erkennbar" for displayLevel 4-6', () => {
    const clusters = [makeCluster('c1')]
    const parsed = makeResult([{ clusterId: 'c1', displayLevel: 5 }])
    const result = deriveScreeningRecommendation(parsed, clusters, { c1: { completed: 1, total: 5 } })
    expect(result.clusterStatusById['c1'].label).toBe('Erkennbar')
  })

  it('assigns "Sicher" for displayLevel > 6', () => {
    const clusters = [makeCluster('c1')]
    const parsed = makeResult([{ clusterId: 'c1', displayLevel: 8 }])
    const result = deriveScreeningRecommendation(parsed, clusters, { c1: { completed: 1, total: 5 } })
    expect(result.clusterStatusById['c1'].label).toBe('Sicher')
  })
})

// ── recommendation logic ──────────────────────────────────────────────────────

describe('deriveScreeningRecommendation – recommended cluster', () => {
  it('picks the cluster with the lowest displayLevel that has open tasks', () => {
    const clusters = [makeCluster('c1'), makeCluster('c2')]
    const parsed = makeResult([
      { clusterId: 'c1', displayLevel: 7 },
      { clusterId: 'c2', displayLevel: 3 },
    ])
    const progress: ClusterProgressMap = {
      c1: { completed: 1, total: 5 },
      c2: { completed: 1, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('c2')
  })

  it('skips clusters with no open tasks', () => {
    const clusters = [makeCluster('c1'), makeCluster('c2')]
    const parsed = makeResult([
      { clusterId: 'c1', displayLevel: 2 },
      { clusterId: 'c2', displayLevel: 5 },
    ])
    const progress: ClusterProgressMap = {
      c1: { completed: 5, total: 5 }, // fully completed
      c2: { completed: 1, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('c2')
  })

  it('returns null when all clusters are fully completed', () => {
    const clusters = [makeCluster('c1')]
    const parsed = makeResult([{ clusterId: 'c1', displayLevel: 3 }])
    const progress: ClusterProgressMap = { c1: { completed: 5, total: 5 } }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBeNull()
  })

  it('places the recommended cluster first in orderedClusters', () => {
    const clusters = [makeCluster('c1', 0), makeCluster('c2', 1)]
    const parsed = makeResult([
      { clusterId: 'c1', displayLevel: 7 },
      { clusterId: 'c2', displayLevel: 2 },
    ])
    const progress: ClusterProgressMap = {
      c1: { completed: 1, total: 5 },
      c2: { completed: 1, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.orderedClusters[0].id).toBe('c2')
  })
})
