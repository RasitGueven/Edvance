import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '../validate'
import type { RawTaxonomy, RawMicroskill } from '../validate'

// ── Fixture helpers ──────────────────────────────────────────────────────────

function microskill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Grundrechenarten',
    cognitive_type: 'FACT',
    estimated_minutes: 3,
    prerequisite_topic_ids: [],
    curriculum_ref: 'NRW-2022-M8-1.1',
    ...overrides,
  }
}

function validTaxonomy(): RawTaxonomy {
  return {
    subject: 'Mathematik',
    grade: 8,
    curriculum: 'NRW-2022',
    competency_areas: [
      {
        cluster_name: 'Zahlen & Rechnen',
        microskills: [
          microskill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
          microskill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          microskill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      },
    ],
  }
}

// ── validateTaxonomy ─────────────────────────────────────────────────────────

describe('validateTaxonomy()', () => {
  it('returns no issues for a fully valid taxonomy', () => {
    const issues = validateTaxonomy(validTaxonomy())
    expect(issues).toHaveLength(0)
  })

  it('reports an error for an invalid topic_id format', () => {
    const taxonomy = validTaxonomy()
    taxonomy.competency_areas[0]!.microskills[0]!.topic_id = 'INVALID'
    const issues = validateTaxonomy(taxonomy)
    const error = issues.find(i => i.severity === 'error' && i.topic_id === 'INVALID')
    expect(error).toBeDefined()
    expect(error?.message).toContain('Format')
  })

  it('reports a warning when topic_id grade number mismatches taxonomy grade', () => {
    const taxonomy = validTaxonomy()
    // M9 in a grade-8 taxonomy → warning
    taxonomy.competency_areas[0]!.microskills[0]!.topic_id = 'M9.ZR.01'
    const issues = validateTaxonomy(taxonomy)
    const warn = issues.find(i => i.severity === 'warning' && i.topic_id === 'M9.ZR.01')
    expect(warn).toBeDefined()
    expect(warn?.message).toContain('Klassenstufe')
  })

  it('reports an error for an invalid cognitive_type', () => {
    const taxonomy = validTaxonomy()
    // @ts-expect-error intentionally invalid
    taxonomy.competency_areas[0]!.microskills[0]!.cognitive_type = 'UNKNOWN'
    const issues = validateTaxonomy(taxonomy)
    const error = issues.find(i => i.severity === 'error' && i.message.includes('cognitive_type'))
    expect(error).toBeDefined()
  })

  it('reports a warning for estimated_minutes outside 1-5', () => {
    const taxonomy = validTaxonomy()
    taxonomy.competency_areas[0]!.microskills[0]!.estimated_minutes = 10
    const issues = validateTaxonomy(taxonomy)
    const warn = issues.find(i => i.severity === 'warning' && i.message.includes('estimated_minutes'))
    expect(warn).toBeDefined()
  })

  it('reports an error for a prerequisite that does not exist', () => {
    const taxonomy = validTaxonomy()
    taxonomy.competency_areas[0]!.microskills[0]!.prerequisite_topic_ids = ['M8.ZR.99']
    const issues = validateTaxonomy(taxonomy)
    const error = issues.find(i => i.severity === 'error' && i.message.includes('M8.ZR.99'))
    expect(error).toBeDefined()
  })

  it('reports a warning for an empty curriculum_ref', () => {
    const taxonomy = validTaxonomy()
    taxonomy.competency_areas[0]!.microskills[0]!.curriculum_ref = ''
    const issues = validateTaxonomy(taxonomy)
    const warn = issues.find(i => i.severity === 'warning' && i.message.includes('curriculum_ref'))
    expect(warn).toBeDefined()
  })

  it('reports a warning for a cluster with fewer than 3 microskills', () => {
    const taxonomy = validTaxonomy()
    taxonomy.competency_areas[0]!.microskills = [
      microskill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      microskill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
    ]
    const issues = validateTaxonomy(taxonomy)
    const warn = issues.find(i => i.message.includes('Minimum 3'))
    expect(warn).toBeDefined()
  })

  it('reports a warning when a cluster does not cover all cognitive types', () => {
    const taxonomy = validTaxonomy()
    // Remove ANALYSIS type → only FACT and TRANSFER remain
    taxonomy.competency_areas[0]!.microskills = [
      microskill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      microskill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
      microskill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
    ]
    const issues = validateTaxonomy(taxonomy)
    const warn = issues.find(i => i.message.includes('cognitive_types'))
    expect(warn).toBeDefined()
  })

  it('detects a direct circular dependency between two skills', () => {
    const taxonomy = validTaxonomy()
    taxonomy.competency_areas[0]!.microskills[0]!.prerequisite_topic_ids = ['M8.ZR.02']
    taxonomy.competency_areas[0]!.microskills[1]!.prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(taxonomy)
    const cycle = issues.find(i => i.severity === 'error' && i.message.includes('Zirkulaere'))
    expect(cycle).toBeDefined()
  })

  it('accepts valid prerequisites without errors', () => {
    const taxonomy = validTaxonomy()
    // ZR.02 depends on ZR.01 — valid DAG
    taxonomy.competency_areas[0]!.microskills[1]!.prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(taxonomy)
    const cycleErrors = issues.filter(i => i.message.includes('Zirkulaere'))
    expect(cycleErrors).toHaveLength(0)
  })
})

// ── summarize ────────────────────────────────────────────────────────────────

describe('summarize()', () => {
  it('counts zero errors and warnings for an empty list', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })

  it('counts errors and warnings correctly', () => {
    const issues = [
      { severity: 'error' as const, message: 'E1' },
      { severity: 'error' as const, message: 'E2' },
      { severity: 'warning' as const, message: 'W1' },
    ]
    expect(summarize(issues)).toEqual({ errors: 2, warnings: 1 })
  })
})
