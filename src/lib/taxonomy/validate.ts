// Validierung der Mikroskill-Taxonomie.
// Wird sowohl im Seed-Script als auch optional im Build genutzt.
//
// Checks:
//   - topic_id-Format (z.B. "M8.ZR.03" — Fach + Klasse + Cluster + Nummer)
//   - prerequisite_topic_ids verweisen auf existierende topic_ids
//   - keine zirkulaeren Abhaengigkeiten (DAG-Check via DFS)
//   - cognitive_type aus erlaubter Menge
//   - estimated_minutes 1-5

import type { CognitiveType } from '@/types'

export type RawMicroskill = {
  topic_id: string
  topic_label: string
  cognitive_type: CognitiveType
  estimated_minutes: number
  prerequisite_topic_ids: string[]
  curriculum_ref: string
  description?: string
}

export type RawCluster = {
  cluster_name: string
  microskills: RawMicroskill[]
}

export type RawTaxonomy = {
  subject: string
  grade: number
  curriculum: string
  competency_areas: RawCluster[]
}

export type ValidationIssue = {
  severity: 'error' | 'warning'
  topic_id?: string
  message: string
}

const TOPIC_ID_PATTERN = /^M(\d{1,2})\.([A-Z]{2,3})\.(\d{2})$/
const VALID_COGNITIVE: CognitiveType[] = ['FACT', 'TRANSFER', 'ANALYSIS']

export function validateTaxonomy(taxonomy: RawTaxonomy): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const allSkills: RawMicroskill[] = taxonomy.competency_areas.flatMap(
    (c) => c.microskills,
  )
  const knownIds = new Set<string>(allSkills.map((s) => s.topic_id))

  // ── per-skill checks ─────────────────────────────────────────────────────
  for (const skill of allSkills) {
    const m = skill.topic_id.match(TOPIC_ID_PATTERN)
    if (!m) {
      issues.push({
        severity: 'error',
        topic_id: skill.topic_id,
        message: `topic_id "${skill.topic_id}" entspricht nicht dem Format Mxx.YY.NN`,
      })
    } else if (Number(m[1]) !== taxonomy.grade) {
      issues.push({
        severity: 'warning',
        topic_id: skill.topic_id,
        message: `topic_id Klassenstufe (${m[1]}) weicht von taxonomy.grade (${taxonomy.grade}) ab`,
      })
    }

    if (!VALID_COGNITIVE.includes(skill.cognitive_type)) {
      issues.push({
        severity: 'error',
        topic_id: skill.topic_id,
        message: `cognitive_type "${skill.cognitive_type}" ist ungueltig`,
      })
    }

    if (skill.estimated_minutes < 1 || skill.estimated_minutes > 5) {
      issues.push({
        severity: 'warning',
        topic_id: skill.topic_id,
        message: `estimated_minutes ${skill.estimated_minutes} ausserhalb 1-5`,
      })
    }

    for (const pre of skill.prerequisite_topic_ids) {
      if (!knownIds.has(pre)) {
        issues.push({
          severity: 'error',
          topic_id: skill.topic_id,
          message: `prerequisite_topic_id "${pre}" existiert nicht in dieser Taxonomie`,
        })
      }
    }

    if (!skill.curriculum_ref || skill.curriculum_ref.trim().length === 0) {
      issues.push({
        severity: 'warning',
        topic_id: skill.topic_id,
        message: 'curriculum_ref fehlt',
      })
    }
  }

  // ── cluster-level checks ─────────────────────────────────────────────────
  for (const cluster of taxonomy.competency_areas) {
    if (cluster.microskills.length < 3) {
      issues.push({
        severity: 'warning',
        message: `Cluster "${cluster.cluster_name}" hat nur ${cluster.microskills.length} Mikroskills (Minimum 3 empfohlen)`,
      })
    }
    const hasFact = cluster.microskills.some((s) => s.cognitive_type === 'FACT')
    const hasTransfer = cluster.microskills.some((s) => s.cognitive_type === 'TRANSFER')
    const hasAnalysis = cluster.microskills.some((s) => s.cognitive_type === 'ANALYSIS')
    if (!(hasFact && hasTransfer && hasAnalysis)) {
      issues.push({
        severity: 'warning',
        message: `Cluster "${cluster.cluster_name}" deckt nicht alle cognitive_types ab (FACT/TRANSFER/ANALYSIS)`,
      })
    }
  }

  // ── circular prerequisites (DFS) ─────────────────────────────────────────
  const adjacency = new Map<string, string[]>()
  for (const s of allSkills) adjacency.set(s.topic_id, s.prerequisite_topic_ids)

  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map<string, number>()
  for (const id of knownIds) color.set(id, WHITE)

  function dfs(node: string, path: string[]): void {
    color.set(node, GRAY)
    for (const dep of adjacency.get(node) ?? []) {
      if (!knownIds.has(dep)) continue
      const c = color.get(dep) ?? WHITE
      if (c === GRAY) {
        issues.push({
          severity: 'error',
          topic_id: node,
          message: `Zirkulaere Abhaengigkeit: ${[...path, node, dep].join(' → ')}`,
        })
      } else if (c === WHITE) {
        dfs(dep, [...path, node])
      }
    }
    color.set(node, BLACK)
  }

  for (const id of knownIds) {
    if ((color.get(id) ?? WHITE) === WHITE) dfs(id, [])
  }

  return issues
}

export function summarize(issues: ValidationIssue[]): {
  errors: number
  warnings: number
} {
  let errors = 0
  let warnings = 0
  for (const i of issues) {
    if (i.severity === 'error') errors += 1
    else warnings += 1
  }
  return { errors, warnings }
}
