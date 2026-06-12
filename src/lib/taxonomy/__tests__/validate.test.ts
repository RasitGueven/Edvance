import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '../validate'
import type { RawTaxonomy, RawMicroskill } from '../validate'

function makeSkill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Zahlenraum verstehen',
    cognitive_type: 'FACT',
    estimated_minutes: 3,
    prerequisite_topic_ids: [],
    curriculum_ref: 'NRW-KLP-M-8-1.1',
    ...overrides,
  }
}

function makeTaxonomy(overrides: Partial<RawTaxonomy> = {}): RawTaxonomy {
  return {
    subject: 'Mathematik',
    grade: 8,
    curriculum: 'NRW-KLP',
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
    ...overrides,
  }
}

describe('validateTaxonomy', () => {
  it('returns no issues for a valid taxonomy', () => {
    const issues = validateTaxonomy(makeTaxonomy())
    expect(issues).toHaveLength(0)
  })

  describe('topic_id format', () => {
    it('reports error for invalid topic_id format', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'INVALID', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      const errors = issues.filter(i => i.severity === 'error' && i.topic_id === 'INVALID')
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('INVALID')
    })

    it('reports warning when grade in topic_id differs from taxonomy.grade', () => {
      const taxonomy = makeTaxonomy({
        grade: 8,
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M9.ZR.01', cognitive_type: 'FACT' }), // grade 9 ≠ 8
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      const warnings = issues.filter(i => i.severity === 'warning' && i.topic_id === 'M9.ZR.01')
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0].message).toContain('Klassenstufe')
    })

    it('accepts valid formats like M5.AL.03 or M12.GEO.12', () => {
      const taxonomy = makeTaxonomy({
        grade: 5,
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M5.AL.03', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M5.AL.04', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M5.AL.05', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const formatErrors = validateTaxonomy(taxonomy)
        .filter(i => i.severity === 'error' && i.message.includes('Format'))
      expect(formatErrors).toHaveLength(0)
    })
  })

  describe('cognitive_type validation', () => {
    it('reports error for invalid cognitive_type', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ cognitive_type: 'INVALID' as never }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'error' && i.message.includes('cognitive_type'))).toBe(true)
    })

    it('accepts all valid cognitive types (no errors)', () => {
      for (const ct of ['FACT', 'TRANSFER', 'ANALYSIS'] as const) {
        const taxonomy = makeTaxonomy({
          competency_areas: [{
            cluster_name: 'Test',
            microskills: [
              makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: ct }),
              makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
              makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
            ],
          }],
        })
        // Only check for errors about invalid cognitive_type values — not cluster-level warnings
        const ctErrors = validateTaxonomy(taxonomy)
          .filter(i => i.severity === 'error' && i.message.includes('cognitive_type'))
        expect(ctErrors).toHaveLength(0)
      }
    })
  })

  describe('estimated_minutes validation', () => {
    it('reports warning for estimated_minutes < 1', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ estimated_minutes: 0, cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
    })

    it('reports warning for estimated_minutes > 5', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ estimated_minutes: 6, cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
    })

    it('accepts values 1-5 without warning', () => {
      for (const minutes of [1, 2, 3, 4, 5]) {
        const taxonomy = makeTaxonomy({
          competency_areas: [{
            cluster_name: 'Test',
            microskills: [
              makeSkill({ estimated_minutes: minutes, cognitive_type: 'FACT' }),
              makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
              makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
            ],
          }],
        })
        const minuteWarnings = validateTaxonomy(taxonomy)
          .filter(i => i.message.includes('estimated_minutes'))
        expect(minuteWarnings).toHaveLength(0)
      }
    })
  })

  describe('prerequisite_topic_ids', () => {
    it('reports error for non-existent prerequisite', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: ['M8.ZR.NONEXISTENT'] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'error' && i.message.includes('M8.ZR.NONEXISTENT'))).toBe(true)
    })

    it('accepts valid cross-references within the taxonomy', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: [] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: ['M8.ZR.02'] }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.message.includes('prerequisite_topic_id'))).toBe(false)
    })
  })

  describe('curriculum_ref', () => {
    it('reports warning for missing curriculum_ref', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ curriculum_ref: '', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'warning' && i.message.includes('curriculum_ref'))).toBe(true)
    })
  })

  describe('cluster-level checks', () => {
    it('warns when cluster has fewer than 3 microskills', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Kleiner Cluster',
          microskills: [
            makeSkill({ cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.message.includes('Kleiner Cluster') && i.message.includes('Minimum'))).toBe(true)
    })

    it('warns when cluster does not cover all cognitive types', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Monotone Cluster',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.message.includes('cognitive_types'))).toBe(true)
    })
  })

  describe('circular prerequisite detection', () => {
    it('reports error for direct circular dependency A→B→A', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: ['M8.ZR.02'] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: [] }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'error' && i.message.includes('Zirkulaere'))).toBe(true)
    })

    it('does not report circular error for acyclic graph', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: [] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: ['M8.ZR.01', 'M8.ZR.02'] }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.message.includes('Zirkulaere'))).toBe(false)
    })
  })
})

describe('summarize', () => {
  it('returns zeros for empty issues', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })

  it('counts errors and warnings correctly', () => {
    const issues = [
      { severity: 'error' as const, message: 'e1' },
      { severity: 'error' as const, message: 'e2' },
      { severity: 'warning' as const, message: 'w1' },
    ]
    expect(summarize(issues)).toEqual({ errors: 2, warnings: 1 })
  })

  it('reflects real validation output', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'INVALID', cognitive_type: 'FACT' }), // error
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    const { errors } = summarize(validateTaxonomy(taxonomy))
    expect(errors).toBeGreaterThan(0)
  })
})
