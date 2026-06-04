import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '@/lib/taxonomy/validate'
import type { RawTaxonomy, RawMicroskill } from '@/lib/taxonomy/validate'

const validSkill = (overrides: Partial<RawMicroskill> = {}): RawMicroskill => ({
  topic_id: 'M8.ZR.01',
  topic_label: 'Zahlenraum verstehen',
  cognitive_type: 'FACT',
  estimated_minutes: 3,
  prerequisite_topic_ids: [],
  curriculum_ref: 'KLP §2.1',
  ...overrides,
})

const validTaxonomy = (overrides: Partial<RawTaxonomy> = {}): RawTaxonomy => ({
  subject: 'Mathematik',
  grade: 8,
  curriculum: 'NRW',
  competency_areas: [
    {
      cluster_name: 'Zahlenraum',
      microskills: [
        validSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
        validSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
        validSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
      ],
    },
  ],
  ...overrides,
})

describe('validateTaxonomy – valid input', () => {
  it('returns no issues for a valid taxonomy', () => {
    const issues = validateTaxonomy(validTaxonomy())
    expect(issues).toHaveLength(0)
  })
})

describe('validateTaxonomy – topic_id format', () => {
  it('reports error for malformed topic_id', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].topic_id = 'INVALID'
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('Format'))).toBe(true)
  })

  it('reports warning when topic_id grade mismatches taxonomy grade', () => {
    const tax = validTaxonomy({ grade: 9 })
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('Klassenstufe'))).toBe(true)
  })
})

describe('validateTaxonomy – cognitive_type', () => {
  it('reports error for invalid cognitive_type', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].cognitive_type = 'INVALID' as never
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('cognitive_type'))).toBe(true)
  })
})

describe('validateTaxonomy – estimated_minutes', () => {
  it('warns when estimated_minutes is 0', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].estimated_minutes = 0
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
  })

  it('warns when estimated_minutes is 6', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].estimated_minutes = 6
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
  })

  it('accepts boundaries 1 and 5', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].estimated_minutes = 1
    tax.competency_areas[0].microskills[1].estimated_minutes = 5
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.message.includes('estimated_minutes'))).toBe(false)
  })
})

describe('validateTaxonomy – prerequisites', () => {
  it('reports error for unknown prerequisite', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].prerequisite_topic_ids = ['M8.ZR.99']
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('M8.ZR.99'))).toBe(true)
  })

  it('accepts valid cross-skill prerequisites', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(tax)
    expect(issues.every(i => !i.message.includes('prerequisite'))).toBe(true)
  })
})

describe('validateTaxonomy – circular prerequisites', () => {
  it('detects direct cycle (A → B → A)', () => {
    const skillA = validSkill({ topic_id: 'M8.ZR.01', prerequisite_topic_ids: ['M8.ZR.02'] })
    const skillB = validSkill({ topic_id: 'M8.ZR.02', prerequisite_topic_ids: ['M8.ZR.01'] })
    const skillC = validSkill({ topic_id: 'M8.ZR.03', prerequisite_topic_ids: [] })
    const tax: RawTaxonomy = {
      subject: 'Mathematik',
      grade: 8,
      curriculum: 'NRW',
      competency_areas: [{ cluster_name: 'Zahlenraum', microskills: [skillA, skillB, skillC] }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('Zirkulaere'))).toBe(true)
  })
})

describe('validateTaxonomy – cluster coverage', () => {
  it('warns when cluster has fewer than 3 microskills', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills = [
      validSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      validSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
    ]
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('Minimum 3'))).toBe(true)
  })

  it('warns when cluster lacks a cognitive_type', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills = [
      validSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      validSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
      validSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
    ]
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.message.includes('cognitive_types'))).toBe(true)
  })
})

describe('validateTaxonomy – curriculum_ref', () => {
  it('warns when curriculum_ref is empty', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].curriculum_ref = ''
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.message.includes('curriculum_ref'))).toBe(true)
  })
})

describe('summarize', () => {
  it('counts errors and warnings separately', () => {
    const issues = [
      { severity: 'error' as const, message: 'e1' },
      { severity: 'error' as const, message: 'e2' },
      { severity: 'warning' as const, message: 'w1' },
    ]
    const result = summarize(issues)
    expect(result.errors).toBe(2)
    expect(result.warnings).toBe(1)
  })

  it('returns zeros for empty array', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })
})
