import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '@/lib/taxonomy/validate'
import type { RawTaxonomy, RawMicroskill } from '@/lib/taxonomy/validate'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeSkill = (overrides: Partial<RawMicroskill> = {}): RawMicroskill => ({
  topic_id: 'M8.ZR.01',
  topic_label: 'Ganzzahlige Division',
  cognitive_type: 'FACT',
  estimated_minutes: 3,
  prerequisite_topic_ids: [],
  curriculum_ref: 'KLP Mathematik NRW §3.1',
  ...overrides,
})

const validTaxonomy = (): RawTaxonomy => ({
  subject: 'Mathematik',
  grade: 8,
  curriculum: 'NRW',
  competency_areas: [
    {
      cluster_name: 'Zahlenrechnen',
      microskills: [
        makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
        makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
        makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
      ],
    },
  ],
})

// ── validateTaxonomy – happy path ─────────────────────────────────────────────

describe('validateTaxonomy – valid input', () => {
  it('returns no issues for a fully valid taxonomy', () => {
    const issues = validateTaxonomy(validTaxonomy())
    const errors = issues.filter(i => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })
})

// ── topic_id format validation ────────────────────────────────────────────────

describe('validateTaxonomy – topic_id format', () => {
  it('reports error for invalid topic_id format', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].topic_id = 'INVALID'
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'error' && i.topic_id === 'INVALID')).toBe(true)
  })

  it('reports warning when topic_id grade differs from taxonomy grade', () => {
    const tax = validTaxonomy()
    // M9 != grade 8
    tax.competency_areas[0].microskills[0].topic_id = 'M9.ZR.01'
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'warning' && i.topic_id === 'M9.ZR.01')).toBe(true)
  })

  it('accepts multi-digit grade in topic_id', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy(),
      grade: 10,
      competency_areas: [
        {
          cluster_name: 'Zahlenrechnen',
          microskills: [
            makeSkill({ topic_id: 'M10.ZR.01', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M10.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M10.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        },
      ],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.filter(i => i.severity === 'error' && i.message.includes('Format'))).toHaveLength(0)
  })
})

// ── cognitive_type validation ─────────────────────────────────────────────────

describe('validateTaxonomy – cognitive_type', () => {
  it('reports error for invalid cognitive_type', () => {
    const tax = validTaxonomy()
    // @ts-expect-error – intentionally wrong type for test
    tax.competency_areas[0].microskills[0].cognitive_type = 'MEMORIZE'
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('MEMORIZE'))).toBe(true)
  })
})

// ── estimated_minutes validation ──────────────────────────────────────────────

describe('validateTaxonomy – estimated_minutes', () => {
  it('reports warning for 0 minutes', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].estimated_minutes = 0
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('0'))).toBe(true)
  })

  it('reports warning for 6 minutes (> 5)', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].estimated_minutes = 6
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('6'))).toBe(true)
  })

  it('accepts valid values 1-5', () => {
    for (const mins of [1, 2, 3, 4, 5]) {
      const tax = validTaxonomy()
      tax.competency_areas[0].microskills[0].estimated_minutes = mins
      const issues = validateTaxonomy(tax)
      expect(issues.some(i => i.message.includes('ausserhalb 1-5'))).toBe(false)
    }
  })
})

// ── prerequisite_topic_ids validation ────────────────────────────────────────

describe('validateTaxonomy – prerequisites', () => {
  it('reports error for prerequisite not existing in taxonomy', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].prerequisite_topic_ids = ['M8.ZR.99']
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('M8.ZR.99'))).toBe(true)
  })

  it('accepts valid prerequisites pointing to existing skills', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(tax)
    const prereqErrors = issues.filter(i => i.message.includes('prerequisite'))
    expect(prereqErrors).toHaveLength(0)
  })
})

// ── curriculum_ref validation ─────────────────────────────────────────────────

describe('validateTaxonomy – curriculum_ref', () => {
  it('reports warning when curriculum_ref is empty string', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].curriculum_ref = ''
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('curriculum_ref'))).toBe(true)
  })

  it('reports warning when curriculum_ref is only whitespace', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].curriculum_ref = '   '
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('curriculum_ref'))).toBe(true)
  })
})

// ── cluster-level validation ──────────────────────────────────────────────────

describe('validateTaxonomy – cluster checks', () => {
  it('warns when cluster has fewer than 3 microskills', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills = [
      makeSkill({ topic_id: 'M8.ZR.01' }),
      makeSkill({ topic_id: 'M8.ZR.02' }),
    ]
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.message.includes('Minimum 3'))).toBe(true)
  })

  it('warns when cluster does not cover all cognitive types', () => {
    const tax = validTaxonomy()
    // Only FACT, no TRANSFER or ANALYSIS
    tax.competency_areas[0].microskills = [
      makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
    ]
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.message.includes('cognitive_types'))).toBe(true)
  })
})

// ── circular dependency detection ────────────────────────────────────────────

describe('validateTaxonomy – circular prerequisites', () => {
  it('detects direct circular dependency A → B → A', () => {
    const tax: RawTaxonomy = {
      subject: 'Mathematik',
      grade: 8,
      curriculum: 'NRW',
      competency_areas: [
        {
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: ['M8.ZR.02'] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: [] }),
          ],
        },
      ],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('Zirkulaere'))).toBe(true)
  })

  it('returns no circular error for linear DAG A → B → C', () => {
    const tax: RawTaxonomy = {
      subject: 'Mathematik',
      grade: 8,
      curriculum: 'NRW',
      competency_areas: [
        {
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: [] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: ['M8.ZR.02'] }),
          ],
        },
      ],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some(i => i.message.includes('Zirkulaere'))).toBe(false)
  })
})

// ── summarize ─────────────────────────────────────────────────────────────────

describe('summarize', () => {
  it('returns zeros for empty issues', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })

  it('correctly counts errors and warnings', () => {
    const issues = [
      { severity: 'error' as const, message: 'e1' },
      { severity: 'error' as const, message: 'e2' },
      { severity: 'warning' as const, message: 'w1' },
    ]
    expect(summarize(issues)).toEqual({ errors: 2, warnings: 1 })
  })
})
