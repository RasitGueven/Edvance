import { describe, it, expect } from 'vitest'
import { deriveScreeningRecommendation } from '@/lib/screening/recommendation'
import type { ParsedScreeningResult } from '@/lib/screening/screeningResult'
import type { SkillCluster } from '@/types'

const makeCluster = (id: string, name = id): SkillCluster => ({
  id,
  name,
  sort_order: 0,
  subject_id: 'math',
  class_level_min: 8,
  class_level_max: 8,
})

const makeParsedResult = (clusters: Array<{ clusterId: string; displayLevel: number }>): ParsedScreeningResult => {
  const parsedClusters = clusters.map(({ clusterId, displayLevel }) => ({
    clusterId,
    displayLevel,
    reachedAfb: (displayLevel <= 3 ? 'I' : displayLevel <= 6 ? 'II' : 'III') as 'I' | 'II' | 'III',
    mastery: displayLevel / 10,
    answered: 4,
    correct: Math.round(displayLevel / 2),
    pending: 0,
    confidence: 'high' as const,
    estimatedLevel: (Math.min(3, Math.ceil(displayLevel / 3)) as 0 | 1 | 2 | 3),
  }))
  const overallAnswered = parsedClusters.reduce((s, c) => s + c.answered, 0)
  const overallCorrect = parsedClusters.reduce((s, c) => s + c.correct, 0)
  return {
    answered: overallAnswered,
    clusters: parsedClusters,
    overallAnswered,
    overallCorrect,
    overallPending: 0,
    overallPct: overallAnswered === 0 ? 0 : Math.round((overallCorrect / overallAnswered) * 100),
  }
}

describe('deriveScreeningRecommendation – null/empty input', () => {
  it('returns all clusters unordered when parsed is null', () => {
    const clusters = [makeCluster('A'), makeCluster('B')]
    const result = deriveScreeningRecommendation(null, clusters, {})
    expect(result.orderedClusters).toEqual(clusters)
    expect(result.recommendedClusterId).toBeNull()
    expect(result.clusterStatusById).toEqual({})
  })

  it('returns all clusters unordered when parsed has no clusters', () => {
    const clusters = [makeCluster('A')]
    const parsed = makeParsedResult([])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.recommendedClusterId).toBeNull()
  })
})

describe('deriveScreeningRecommendation – status labels', () => {
  it('assigns "Lücke" label for displayLevel ≤ 3', () => {
    const clusters = [makeCluster('A')]
    const parsed = makeParsedResult([{ clusterId: 'A', displayLevel: 2 }])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['A'].label).toBe('Lücke')
  })

  it('assigns "Erkennbar" label for displayLevel 4-6', () => {
    const clusters = [makeCluster('A')]
    const parsed = makeParsedResult([{ clusterId: 'A', displayLevel: 5 }])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['A'].label).toBe('Erkennbar')
  })

  it('assigns "Sicher" label for displayLevel > 6', () => {
    const clusters = [makeCluster('A')]
    const parsed = makeParsedResult([{ clusterId: 'A', displayLevel: 8 }])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['A'].label).toBe('Sicher')
  })
})

describe('deriveScreeningRecommendation – recommended cluster', () => {
  it('recommends the screened cluster with lowest displayLevel that has open tasks', () => {
    const clusters = [makeCluster('A'), makeCluster('B')]
    const parsed = makeParsedResult([
      { clusterId: 'A', displayLevel: 7 },
      { clusterId: 'B', displayLevel: 2 },
    ])
    const progress = {
      'A': { completed: 0, total: 5 },
      'B': { completed: 1, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('B')
  })

  it('skips clusters with no open tasks (completed === total)', () => {
    const clusters = [makeCluster('A'), makeCluster('B')]
    const parsed = makeParsedResult([
      { clusterId: 'A', displayLevel: 2 },
      { clusterId: 'B', displayLevel: 5 },
    ])
    const progress = {
      'A': { completed: 5, total: 5 },
      'B': { completed: 3, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBe('B')
  })

  it('returns null when all clusters are complete', () => {
    const clusters = [makeCluster('A')]
    const parsed = makeParsedResult([{ clusterId: 'A', displayLevel: 5 }])
    const progress = { 'A': { completed: 5, total: 5 } }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.recommendedClusterId).toBeNull()
  })

  it('places recommended cluster first in orderedClusters', () => {
    const clusters = [makeCluster('A'), makeCluster('B'), makeCluster('C')]
    const parsed = makeParsedResult([
      { clusterId: 'A', displayLevel: 7 },
      { clusterId: 'B', displayLevel: 3 },
    ])
    const progress = {
      'A': { completed: 0, total: 5 },
      'B': { completed: 0, total: 5 },
    }
    const result = deriveScreeningRecommendation(parsed, clusters, progress)
    expect(result.orderedClusters[0].id).toBe('B')
  })
})
