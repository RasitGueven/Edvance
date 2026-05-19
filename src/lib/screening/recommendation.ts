// Reine, deterministische Ableitung: Screening-Auswertung + Cluster-Liste
// → Status-Label je Cluster + ein Empfehlungs-Cluster + Grid-Reihenfolge
// (schwächster, noch nicht fertiger Cluster nach vorn). Kein Supabase,
// kein React, keine pages-Imports — testbar wie screening-sim. Label-
// Mapping konsistent mit CLAUDE.md / behaviorAnalysis: displayLevel ≤3
// Lücke, ≤6 Erkennbar, >6 Sicher.

import type { ParsedScreeningResult } from '@/lib/screening/screeningResult'
import type { SkillCluster } from '@/types'

export type ClusterStatusLabel = 'Lücke' | 'Erkennbar' | 'Sicher'

export type ClusterStatus = {
  label: ClusterStatusLabel
  displayLevel: number
}

// Order-unabhängige Fortschritts-Map (id → erledigt/gesamt). Lokal
// definiert, damit lib nicht von pages abhängt.
export type ClusterProgressMap = Record<
  string,
  { completed: number; total: number }
>

export type ScreeningRecommendation = {
  clusterStatusById: Record<string, ClusterStatus>
  recommendedClusterId: string | null
  orderedClusters: SkillCluster[]
}

function labelForDisplayLevel(displayLevel: number): ClusterStatusLabel {
  if (displayLevel <= 3) return 'Lücke'
  if (displayLevel <= 6) return 'Erkennbar'
  return 'Sicher'
}

export function deriveScreeningRecommendation(
  parsed: ParsedScreeningResult | null,
  clusters: SkillCluster[],
  clusterProgress: ClusterProgressMap,
): ScreeningRecommendation {
  if (!parsed || parsed.clusters.length === 0) {
    return {
      clusterStatusById: {},
      recommendedClusterId: null,
      orderedClusters: clusters,
    }
  }

  const byId = new Map(parsed.clusters.map((c) => [c.clusterId, c]))

  const clusterStatusById: Record<string, ClusterStatus> = {}
  for (const c of clusters) {
    const sc = byId.get(c.id)
    if (sc) {
      clusterStatusById[c.id] = {
        label: labelForDisplayLevel(sc.displayLevel),
        displayLevel: sc.displayLevel,
      }
    }
  }

  // Empfehlung: gescreenter Cluster mit noch offenen Aufgaben, niedrigster
  // displayLevel zuerst; Gleichstand → ursprüngliche (sort_order-)Reihenfolge.
  let recommendedClusterId: string | null = null
  let bestLevel = Number.POSITIVE_INFINITY
  for (const c of clusters) {
    const sc = byId.get(c.id)
    if (!sc) continue
    const prog = clusterProgress[c.id]
    const hasOpen = !!prog && prog.total > 0 && prog.completed < prog.total
    if (!hasOpen) continue
    if (sc.displayLevel < bestLevel) {
      bestLevel = sc.displayLevel
      recommendedClusterId = c.id
    }
  }

  const orderedClusters =
    recommendedClusterId === null
      ? clusters
      : [
          ...clusters.filter((c) => c.id === recommendedClusterId),
          ...clusters.filter((c) => c.id !== recommendedClusterId),
        ]

  return { clusterStatusById, recommendedClusterId, orderedClusters }
}
