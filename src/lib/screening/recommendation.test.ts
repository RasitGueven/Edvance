import { describe, it, expect } from 'vitest'
import { deriveScreeningRecommendation } from './recommendation'
import type { ParsedScreeningResult, ParsedClusterResult } from './screeningResult'
import type { SkillCluster } from '@/types'

function makeCluster(id: string): SkillCluster {
  return {
    id,
    name: `Cluster ${id}`,
    subject_id: 'math',
    sort_order: 0,
    description: null,
  } as unknown as SkillCluster
}

function makeScreeningResult(clusters: Partial<ParsedClusterResult>[]): ParsedScreeningResult {
  return {
    answered: clusters.length,
    overallAnswered: clusters.length,
    overallCorrect: 0,
    overallPending: 0,
    overallPct: 0,
    clusters: clusters.map((c, i) => ({
      clusterId: c.clusterId ?? `c${i}`,
      answered: c.answered ?? 2,
      correct: c.correct ?? 1,
      pending: 0,
      estimatedLevel: c.estimatedLevel ?? 1,
      reachedAfb: null,
      mastery: c.mastery ?? 0.5,
      displayLevel: c.displayLevel ?? 3,
      confidence: 'medium',
      ...c,
    })),
  }
}

describe('deriveScreeningRecommendation', () => {
  const clusters: SkillCluster[] = [
    makeCluster('algebra'),
    makeCluster('geometrie'),
    makeCluster('statistik'),
  ]

  it('gibt leeres Ergebnis bei null-parsed zurück', () => {
    const result = deriveScreeningRecommendation(null, clusters, {})
    expect(result.recommendedClusterId).toBeNull()
    expect(result.clusterStatusById).toEqual({})
    expect(result.orderedClusters).toEqual(clusters)
  })

  it('gibt leeres Ergebnis bei leerem Clusters-Array zurück', () => {
    const parsed = makeScreeningResult([])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.recommendedClusterId).toBeNull()
  })

  it('ordnet Cluster-Status korrekt zu', () => {
    const parsed = makeScreeningResult([
      { clusterId: 'algebra', displayLevel: 2 },
      { clusterId: 'geometrie', displayLevel: 6 },
    ])
    const result = deriveScreeningRecommendation(parsed, clusters, {
      algebra: { completed: 0, total: 5 },
      geometrie: { completed: 0, total: 5 },
    })
    expect(result.clusterStatusById['algebra'].label).toBe('Lücke')
    expect(result.clusterStatusById['geometrie'].label).toBe('Erkennbar')
  })

  it('empfiehlt den Cluster mit niedrigstem displayLevel und offenen Aufgaben', () => {
    const parsed = makeScreeningResult([
      { clusterId: 'algebra', displayLevel: 4 },
      { clusterId: 'geometrie', displayLevel: 2 },
      { clusterId: 'statistik', displayLevel: 6 },
    ])
    const result = deriveScreeningRecommendation(parsed, clusters, {
      algebra: { completed: 1, total: 5 },
      geometrie: { completed: 0, total: 5 },  // niedrigster Level + offen
      statistik: { completed: 0, total: 5 },
    })
    expect(result.recommendedClusterId).toBe('geometrie')
  })

  it('ignoriert Cluster ohne offene Aufgaben bei Empfehlung', () => {
    const parsed = makeScreeningResult([
      { clusterId: 'algebra', displayLevel: 1 },  // niedrigster Level, aber fertig
      { clusterId: 'geometrie', displayLevel: 5 },
    ])
    const result = deriveScreeningRecommendation(parsed, clusters, {
      algebra: { completed: 5, total: 5 },   // fertig → nicht empfehlen
      geometrie: { completed: 0, total: 5 }, // offen
    })
    expect(result.recommendedClusterId).toBe('geometrie')
  })

  it('gibt null als recommendedClusterId wenn alle Cluster abgeschlossen', () => {
    const parsed = makeScreeningResult([
      { clusterId: 'algebra', displayLevel: 3 },
    ])
    const result = deriveScreeningRecommendation(parsed, clusters, {
      algebra: { completed: 5, total: 5 },
    })
    expect(result.recommendedClusterId).toBeNull()
  })

  it('setzt empfohlenen Cluster an die erste Stelle der orderedClusters', () => {
    const parsed = makeScreeningResult([
      { clusterId: 'geometrie', displayLevel: 2 },
    ])
    const result = deriveScreeningRecommendation(parsed, clusters, {
      geometrie: { completed: 0, total: 5 },
    })
    expect(result.orderedClusters[0].id).toBe('geometrie')
  })

  it('Label-Grenzwerte: displayLevel ≤3 → Lücke, ≤6 → Erkennbar, >6 → Sicher', () => {
    const parsed = makeScreeningResult([
      { clusterId: 'algebra', displayLevel: 3 },
      { clusterId: 'geometrie', displayLevel: 6 },
      { clusterId: 'statistik', displayLevel: 7 },
    ])
    const result = deriveScreeningRecommendation(parsed, clusters, {})
    expect(result.clusterStatusById['algebra'].label).toBe('Lücke')
    expect(result.clusterStatusById['geometrie'].label).toBe('Erkennbar')
    expect(result.clusterStatusById['statistik'].label).toBe('Sicher')
  })
})
