import { useEffect, useMemo, useState } from 'react'
import { listCompletedScreeningTests } from '@/lib/supabase/screening'
import {
  parseScreeningResult,
  type ParsedScreeningResult,
} from '@/lib/screening/screeningResult'
import {
  deriveScreeningRecommendation,
  type ClusterStatus,
} from '@/lib/screening/recommendation'
import type { ResumePoint } from '@/lib/supabase/resume'
import type { SkillCluster } from '@/types'
import type { ClusterProgress } from '@/pages/student/ClusterGrid'

export type ScreeningRecommendationView = {
  clusterStatusById: Record<string, ClusterStatus>
  recommendedClusterId: string | null
  orderedClusters: SkillCluster[]
  // Resume hat Vorrang: true nur, wenn nichts Angefangenes aufnehmbar ist
  // (genau ein primärer CTA pro Screen).
  showRecommendation: boolean
}

// Lädt das jüngste abgeschlossene Screening des Schülers und leitet daraus
// Cluster-Status, Empfehlung und Grid-Reihenfolge ab. Graceful-Degrade:
// kein/alter Lauf → Parser null → Verhalten wie ohne Screening.
export function useScreeningRecommendation(
  studentId: string | null,
  clusters: SkillCluster[],
  clusterProgress: ClusterProgress,
  resume: ResumePoint | null,
): ScreeningRecommendationView {
  const [parsed, setParsed] = useState<ParsedScreeningResult | null>(null)

  useEffect(() => {
    if (!studentId) return
    let cancelled = false
    void listCompletedScreeningTests(studentId).then(({ data }) => {
      if (cancelled) return
      const latest = data && data.length > 0 ? data[0] : null
      setParsed(latest ? parseScreeningResult(latest.result_summary) : null)
    })
    return () => {
      cancelled = true
    }
  }, [studentId])

  const { clusterStatusById, recommendedClusterId, orderedClusters } = useMemo(
    () => deriveScreeningRecommendation(parsed, clusters, clusterProgress),
    [parsed, clusters, clusterProgress],
  )

  return {
    clusterStatusById,
    recommendedClusterId,
    orderedClusters,
    showRecommendation:
      !(resume && resume.taskId) && recommendedClusterId !== null,
  }
}
