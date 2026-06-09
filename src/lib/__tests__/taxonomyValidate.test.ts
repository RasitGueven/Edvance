import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '../taxonomy/validate'
import type { RawTaxonomy, RawMicroskill } from '../taxonomy/validate'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeSkill = (overrides: Partial<RawMicroskill> = {}): RawMicroskill => ({
  topic_id: 'M8.ZR.01',
  topic_label: 'Zahlenraumvorstellung',
  cognitive_type: 'FACT',
  estimated_minutes: 3,
  prerequisite_topic_ids: [],
  curriculum_ref: 'LP-NRW-M8',
  ...overrides,
})

const makeValidTaxonomy = (): RawTaxonomy => ({
  subject: 'Mathematik',
  grade: 8,
  curriculum: 'NRW',
  competency_areas: [
    {
      cluster_name: 'Zahlenraum',
      microskills: [
        makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
        makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
        makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
      ],
    },
  ],
})

// ─── validateTaxonomy ─────────────────────────────────────────────────────────

describe('validateTaxonomy', () => {
  it('returns no issues for a valid taxonomy', () => {
    const issues = validateTaxonomy(makeValidTaxonomy())
    expect(issues).toHaveLength(0)
  })

  it('reports error for invalid topic_id format', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].topic_id = 'INVALID'
    const issues = validateTaxonomy(taxonomy)
    const errors = issues.filter(i => i.severity === 'error')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain('topic_id')
  })

  it('reports warning when topic_id grade mismatches taxonomy.grade', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].topic_id = 'M9.ZR.01'
    const issues = validateTaxonomy(taxonomy)
    const warnings = issues.filter(i => i.severity === 'warning' && i.topic_id === 'M9.ZR.01')
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings[0].message).toContain('Klassenstufe')
  })

  it('reports error for invalid cognitive_type', () => {
    const taxonomy = makeValidTaxonomy()
    // @ts-expect-error intentionally wrong type for test
    taxonomy.competency_areas[0].microskills[0].cognitive_type = 'INVALID_TYPE'
    const issues = validateTaxonomy(taxonomy)
    const errors = issues.filter(i => i.severity === 'error' && i.message.includes('cognitive_type'))
    expect(errors).toHaveLength(1)
  })

  it('reports warning for estimated_minutes out of range (too low)', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].estimated_minutes = 0
    const issues = validateTaxonomy(taxonomy)
    const warnings = issues.filter(i => i.severity === 'warning' && i.message.includes('estimated_minutes'))
    expect(warnings).toHaveLength(1)
  })

  it('reports warning for estimated_minutes out of range (too high)', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].estimated_minutes = 6
    const issues = validateTaxonomy(taxonomy)
    const warnings = issues.filter(i => i.severity === 'warning' && i.message.includes('estimated_minutes'))
    expect(warnings).toHaveLength(1)
  })

  it('reports error for missing prerequisite topic_id', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].prerequisite_topic_ids = ['M8.ZR.99']
    const issues = validateTaxonomy(taxonomy)
    const errors = issues.filter(i => i.severity === 'error' && i.message.includes('prerequisite_topic_id'))
    expect(errors).toHaveLength(1)
  })

  it('reports warning for missing curriculum_ref', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].curriculum_ref = ''
    const issues = validateTaxonomy(taxonomy)
    const warnings = issues.filter(i => i.severity === 'warning' && i.message.includes('curriculum_ref'))
    expect(warnings).toHaveLength(1)
  })

  it('reports warning when cluster has fewer than 3 microskills', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills = [
      makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
    ]
    const issues = validateTaxonomy(taxonomy)
    const warnings = issues.filter(i => i.message.includes('Minimum 3'))
    expect(warnings).toHaveLength(1)
  })

  it('reports warning when cluster does not cover all cognitive types', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills = [
      makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
    ]
    const issues = validateTaxonomy(taxonomy)
    const warnings = issues.filter(i => i.message.includes('cognitive_types'))
    expect(warnings).toHaveLength(1)
  })

  it('detects circular prerequisites', () => {
    const taxonomy: RawTaxonomy = {
      subject: 'Mathematik',
      grade: 8,
      curriculum: 'NRW',
      competency_areas: [
        {
          cluster_name: 'Zirkel',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: ['M8.ZR.02'] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: [] }),
          ],
        },
      ],
    }
    const issues = validateTaxonomy(taxonomy)
    const circularErrors = issues.filter(i => i.severity === 'error' && i.message.includes('Zirkulaere'))
    expect(circularErrors.length).toBeGreaterThan(0)
  })

  it('accepts valid prerequisites (DAG without cycle)', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
    taxonomy.competency_areas[0].microskills[2].prerequisite_topic_ids = ['M8.ZR.02']
    const issues = validateTaxonomy(taxonomy)
    const circularErrors = issues.filter(i => i.message.includes('Zirkulaere'))
    expect(circularErrors).toHaveLength(0)
  })
})

// ─── summarize ────────────────────────────────────────────────────────────────

describe('summarize', () => {
  it('returns zeros for empty issues', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })

  it('counts errors and warnings correctly', () => {
    const issues = [
      { severity: 'error' as const, message: 'err1' },
      { severity: 'error' as const, message: 'err2' },
      { severity: 'warning' as const, message: 'warn1' },
    ]
    expect(summarize(issues)).toEqual({ errors: 2, warnings: 1 })
  })
})
