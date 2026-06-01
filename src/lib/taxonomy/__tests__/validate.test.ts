import { describe, it, expect } from 'vitest'
import { validateTaxonomy } from '@/lib/taxonomy/validate'
import type { RawTaxonomy, RawMicroskill } from '@/lib/taxonomy/validate'

function makeSkill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Zahlenrechnen Grundlagen',
    cognitive_type: 'FACT',
    estimated_minutes: 3,
    prerequisite_topic_ids: [],
    curriculum_ref: 'NRW-KLP-2023-M8',
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
        cluster_name: 'Zahlen & Rechnen',
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

describe('validateTaxonomy – valid input', () => {
  it('returns no issues for a valid taxonomy', () => {
    const issues = validateTaxonomy(makeTaxonomy())
    expect(issues).toHaveLength(0)
  })
})

describe('validateTaxonomy – topic_id format', () => {
  it('errors on invalid topic_id format', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [makeSkill({ topic_id: 'INVALID' })],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some((i) => i.severity === 'error' && i.topic_id === 'INVALID')).toBe(true)
  })

  it('warns when topic_id grade does not match taxonomy grade', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [makeSkill({ topic_id: 'M9.ZR.01' })], // grade 9 in grade-8 taxonomy
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some((i) => i.severity === 'warning' && i.topic_id === 'M9.ZR.01')).toBe(true)
  })

  it('accepts valid 2-digit cluster codes', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [makeSkill({ topic_id: 'M8.FK.01' })],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })
})

describe('validateTaxonomy – cognitive_type', () => {
  it('errors on invalid cognitive_type', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [makeSkill({ cognitive_type: 'INVALID' as never })],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('cognitive_type'))).toBe(true)
  })

  it('accepts FACT, TRANSFER, ANALYSIS — no cognitive_type errors', () => {
    for (const ct of ['FACT', 'TRANSFER', 'ANALYSIS'] as const) {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'X',
          microskills: [makeSkill({ cognitive_type: ct, topic_id: 'M8.ZR.01' })],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      // cognitive_type itself is valid — no error about it; cluster-level warnings are expected
      expect(issues.filter((i) => i.severity === 'error' && i.message.includes('cognitive_type'))).toHaveLength(0)
    }
  })
})

describe('validateTaxonomy – estimated_minutes', () => {
  it('warns when estimated_minutes < 1', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [makeSkill({ estimated_minutes: 0 })],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
  })

  it('warns when estimated_minutes > 5', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [makeSkill({ estimated_minutes: 10 })],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
  })

  it('accepts values 1–5', () => {
    for (const m of [1, 2, 3, 4, 5]) {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'X',
          microskills: [makeSkill({ estimated_minutes: m })],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.filter((i) => i.message.includes('estimated_minutes'))).toHaveLength(0)
    }
  })
})

describe('validateTaxonomy – prerequisites', () => {
  it('errors when prerequisite does not exist in taxonomy', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [makeSkill({ prerequisite_topic_ids: ['M8.ZR.99'] })],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('M8.ZR.99'))).toBe(true)
  })

  it('accepts prerequisites that exist in the same taxonomy', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', prerequisite_topic_ids: [] }),
          makeSkill({ topic_id: 'M8.ZR.02', prerequisite_topic_ids: ['M8.ZR.01'] }),
        ],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.filter((i) => i.message.includes('prerequisite'))).toHaveLength(0)
  })
})

describe('validateTaxonomy – curriculum_ref', () => {
  it('warns when curriculum_ref is empty', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [makeSkill({ curriculum_ref: '' })],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('curriculum_ref'))).toBe(true)
  })

  it('warns when curriculum_ref is whitespace only', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [makeSkill({ curriculum_ref: '   ' })],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some((i) => i.message.includes('curriculum_ref'))).toBe(true)
  })
})

describe('validateTaxonomy – multiple issues', () => {
  it('collects all issues across multiple skills', () => {
    const taxonomy = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'X',
        microskills: [
          makeSkill({ topic_id: 'BAD-ID', cognitive_type: 'WRONG' as never }),
          makeSkill({ topic_id: 'M8.ZR.01', estimated_minutes: 0 }),
        ],
      }],
    })
    const issues = validateTaxonomy(taxonomy)
    expect(issues.length).toBeGreaterThanOrEqual(3)
  })
})
