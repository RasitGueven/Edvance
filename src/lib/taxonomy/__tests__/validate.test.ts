import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '@/lib/taxonomy/validate'
import type { RawTaxonomy, RawMicroskill } from '@/lib/taxonomy/validate'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSkill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Zahlenraum verstehen',
    cognitive_type: 'FACT',
    estimated_minutes: 3,
    prerequisite_topic_ids: [],
    curriculum_ref: 'KLP NRW 2019 §4',
    ...overrides,
  }
}

function makeValidTaxonomy(): RawTaxonomy {
  return {
    subject: 'Mathematik',
    grade: 8,
    curriculum: 'NRW 2019',
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
  }
}

// ── validateTaxonomy ──────────────────────────────────────────────────────────

describe('validateTaxonomy', () => {
  it('returns no issues for a fully valid taxonomy', () => {
    expect(validateTaxonomy(makeValidTaxonomy())).toHaveLength(0)
  })

  describe('topic_id format', () => {
    it('flags invalid topic_id with error', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills[0].topic_id = 'INVALID'
      const issues = validateTaxonomy(tax)
      expect(issues.some(i => i.severity === 'error' && i.message.includes('Format'))).toBe(true)
    })

    it('warns when topic_id grade number mismatches taxonomy.grade', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills[0].topic_id = 'M9.ZR.01'
      const issues = validateTaxonomy(tax)
      expect(issues.some(i => i.severity === 'warning' && i.message.includes('Klassenstufe'))).toBe(true)
    })

    it('accepts valid Mxx.YY.NN format', () => {
      const tax = makeValidTaxonomy()
      // All three skills already use valid ids
      expect(validateTaxonomy(tax).filter(i => i.message.includes('Format'))).toHaveLength(0)
    })
  })

  describe('cognitive_type', () => {
    it('flags unknown cognitive_type with error', () => {
      const tax = makeValidTaxonomy()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tax.competency_areas[0].microskills[0].cognitive_type = 'UNKNOWN' as any
      const issues = validateTaxonomy(tax)
      expect(issues.some(i => i.severity === 'error' && i.message.includes('ist ungueltig'))).toBe(true)
    })

    it('accepts FACT, TRANSFER, ANALYSIS without error', () => {
      for (const ct of ['FACT', 'TRANSFER', 'ANALYSIS'] as const) {
        const tax = makeValidTaxonomy()
        tax.competency_areas[0].microskills[0].cognitive_type = ct
        const issues = validateTaxonomy(tax)
        expect(issues.filter(i => i.message.includes('ist ungueltig'))).toHaveLength(0)
      }
    })
  })

  describe('estimated_minutes boundaries', () => {
    it('warns for estimated_minutes = 0 (below range)', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills[0].estimated_minutes = 0
      expect(validateTaxonomy(tax).some(i => i.message.includes('estimated_minutes'))).toBe(true)
    })

    it('warns for estimated_minutes = 6 (above range)', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills[0].estimated_minutes = 6
      expect(validateTaxonomy(tax).some(i => i.message.includes('estimated_minutes'))).toBe(true)
    })

    it('accepts boundary values 1 and 5 without warning', () => {
      for (const val of [1, 5]) {
        const tax = makeValidTaxonomy()
        tax.competency_areas[0].microskills[0].estimated_minutes = val
        expect(validateTaxonomy(tax).filter(i => i.message.includes('estimated_minutes'))).toHaveLength(0)
      }
    })
  })

  describe('prerequisite references', () => {
    it('flags a prerequisite pointing to a non-existent topic_id', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills[0].prerequisite_topic_ids = ['M8.ZR.99']
      const issues = validateTaxonomy(tax)
      expect(issues.some(i => i.severity === 'error' && i.message.includes('prerequisite_topic_id'))).toBe(true)
    })

    it('accepts a valid intra-cluster prerequisite', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
      expect(validateTaxonomy(tax)).toHaveLength(0)
    })
  })

  describe('curriculum_ref', () => {
    it('warns when curriculum_ref is empty string', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills[0].curriculum_ref = ''
      expect(validateTaxonomy(tax).some(i => i.message.includes('curriculum_ref'))).toBe(true)
    })

    it('warns when curriculum_ref is whitespace only', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills[0].curriculum_ref = '   '
      expect(validateTaxonomy(tax).some(i => i.message.includes('curriculum_ref'))).toBe(true)
    })
  })

  describe('cluster-level checks', () => {
    it('warns when cluster has fewer than 3 microskills', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills = [makeSkill()]
      expect(validateTaxonomy(tax).some(i => i.message.includes('Minimum 3'))).toBe(true)
    })

    it('warns when cluster does not cover all three cognitive types', () => {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills = [
        makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
        makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
        makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
      ]
      expect(validateTaxonomy(tax).some(i => i.message.includes('cognitive_types'))).toBe(true)
    })
  })

  describe('circular dependency detection (DFS)', () => {
    it('flags a direct A → B → A cycle', () => {
      const tax: RawTaxonomy = {
        subject: 'Mathe',
        grade: 8,
        curriculum: 'Test',
        competency_areas: [
          {
            cluster_name: 'Test',
            microskills: [
              makeSkill({ topic_id: 'M8.TS.01', cognitive_type: 'FACT', prerequisite_topic_ids: ['M8.TS.02'] }),
              makeSkill({ topic_id: 'M8.TS.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.TS.01'] }),
              makeSkill({ topic_id: 'M8.TS.03', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: [] }),
            ],
          },
        ],
      }
      const issues = validateTaxonomy(tax)
      expect(issues.some(i => i.severity === 'error' && i.message.includes('Zirkulaere'))).toBe(true)
    })

    it('does not flag a valid A → B → C DAG', () => {
      const tax: RawTaxonomy = {
        subject: 'Mathe',
        grade: 8,
        curriculum: 'Test',
        competency_areas: [
          {
            cluster_name: 'DAG',
            microskills: [
              makeSkill({ topic_id: 'M8.DG.01', cognitive_type: 'FACT', prerequisite_topic_ids: [] }),
              makeSkill({ topic_id: 'M8.DG.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.DG.01'] }),
              makeSkill({ topic_id: 'M8.DG.03', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: ['M8.DG.02'] }),
            ],
          },
        ],
      }
      expect(validateTaxonomy(tax).filter(i => i.message.includes('Zirkulaere'))).toHaveLength(0)
    })
  })
})

// ── summarize ──────────────────────────────────────────────────────────────────

describe('summarize', () => {
  it('returns zeros for no issues', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })

  it('counts errors and warnings separately', () => {
    const issues = [
      { severity: 'error' as const, message: 'e1' },
      { severity: 'error' as const, message: 'e2' },
      { severity: 'warning' as const, message: 'w1' },
    ]
    expect(summarize(issues)).toEqual({ errors: 2, warnings: 1 })
  })

  it('counts only warnings when no errors', () => {
    const issues = [{ severity: 'warning' as const, message: 'w' }]
    expect(summarize(issues)).toEqual({ errors: 0, warnings: 1 })
  })
})
