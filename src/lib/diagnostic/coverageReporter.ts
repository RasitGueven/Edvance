// Coverage-Report fuer einen DiagnosticTest:
// Welche Cluster sind abgedeckt, welche fehlen und warum.

import type { DiagnosticTest } from '@/types'
import type { GenerateResult } from '@/lib/diagnostic/generator'

export type CoverageReport = {
  subject: string
  grade: number
  total_clusters_expected: number
  clusters_covered: number
  coverage_pct: number
  total_minutes: number
  in_target_range: boolean
  per_cluster: { topic_id: string; topic_label: string; covered: boolean; reason?: string }[]
  missing_input_types: string[]
  warnings: string[]
}

const REQUIRED_INPUT_TYPES = ['MC', 'STEPS', 'MATCHING']
const TARGET_MIN_MINUTES = 16
const TARGET_MAX_MINUTES = 22

export function buildCoverageReport(
  result: GenerateResult,
  expectedClusters: { id: string; name: string }[],
): CoverageReport {
  const test = result.test
  const coveredTopicIds = new Set(test.coverage.map((c) => c.topic_id))
  const presentTypes = new Set(test.tasks.map((t) => t.input_type))
  const uncoveredById = new Map(result.uncovered.map((u) => [u.topic_id, u.reason]))

  const perCluster = expectedClusters.map((c) => {
    // expectedCluster.id (UUID) wird in uncovered referenziert; in coverage steckt nur topic_id (microskill code)
    // Cluster-Abdeckung: ueber irgendeine task die diesem Cluster angehoert. Wir wissen das ueber uncovered list.
    const isUncovered = uncoveredById.has(c.id)
    return {
      topic_id: c.id,
      topic_label: c.name,
      covered: !isUncovered && coveredTopicIds.size > 0,
      reason: uncoveredById.get(c.id),
    }
  })
  const coveredCount = perCluster.filter((p) => p.covered).length

  return {
    subject: test.subject,
    grade: test.grade,
    total_clusters_expected: expectedClusters.length,
    clusters_covered: coveredCount,
    coverage_pct:
      expectedClusters.length === 0
        ? 0
        : Math.round((coveredCount / expectedClusters.length) * 100),
    total_minutes: test.estimated_total_minutes,
    in_target_range:
      test.estimated_total_minutes >= TARGET_MIN_MINUTES &&
      test.estimated_total_minutes <= TARGET_MAX_MINUTES,
    per_cluster: perCluster,
    missing_input_types: REQUIRED_INPUT_TYPES.filter((t) => !presentTypes.has(t as never)),
    warnings: result.warnings,
  }
}

export function formatCoverageReport(report: CoverageReport): string {
  const lines: string[] = []
  lines.push('═══════════════════════════════════════════')
  lines.push(`  COVERAGE: ${report.subject} Klasse ${report.grade}`)
  lines.push('═══════════════════════════════════════════')
  lines.push(
    `  Cluster:           ${report.clusters_covered}/${report.total_clusters_expected} (${report.coverage_pct}%)`,
  )
  lines.push(
    `  Zeit:              ${report.total_minutes} Min ${report.in_target_range ? '✓ Zielkorridor 16-22' : '⚠ ausserhalb 16-22'}`,
  )
  if (report.missing_input_types.length > 0) {
    lines.push(`  Fehlende Inputtypen: ${report.missing_input_types.join(', ')}`)
  }
  lines.push('  ── pro Cluster ──')
  for (const c of report.per_cluster) {
    const tag = c.covered ? '✓' : '✗'
    const reason = c.reason ? `  (${c.reason})` : ''
    lines.push(`  ${tag} ${c.topic_label}${reason}`)
  }
  if (report.warnings.length > 0) {
    lines.push('  ── Warnungen ──')
    for (const w of report.warnings) lines.push(`  ⚠ ${w}`)
  }
  lines.push('═══════════════════════════════════════════')
  return lines.join('\n')
}

// Re-export DiagnosticTest type fuer Convenience.
export type { DiagnosticTest }
