import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '@/lib/taxonomy/validate'
import type { RawTaxonomy, RawMicroskill } from '@/lib/taxonomy/validate'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSkill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Zahlenraum bis 1000',
    cognitive_type: 'FACT',
    estimated_minutes: 3,
    prerequisite_topic_ids: [],
    curriculum_ref: 'KLP NRW §4',
    ...overrides,
  }
}

function makeTaxonomy(overrides: Partial<RawTaxonomy> = {}): RawTaxonomy {
  return {
    subject: 'Mathematik',
    grade: 8,
    curriculum: 'KLP NRW',
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

// ── validateTaxonomy ─────────────────────────────────────────────────────────

describe('validateTaxonomy', () => {
  it('returns no issues for a valid taxonomy', () => {
    const issues = validateTaxonomy(makeTaxonomy())
    expect(issues).toHaveLength(0)
  })

  // ── topic_id format ──────────────────────────────────────────────────────────

  it('errors on invalid topic_id format', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'INVALID_ID', cognitive_type: 'FACT' }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    const issues = validateTaxonomy(tax)
    const errors = issues.filter(i => i.severity === 'error')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.message.includes('Format'))).toBe(true)
  })

  it('warns when topic_id grade does not match taxonomy grade', () => {
    const tax = makeTaxonomy({
      grade: 8,
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'M5.ZR.01', cognitive_type: 'FACT' }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    const warnings = validateTaxonomy(tax).filter(i => i.severity === 'warning')
    expect(warnings.some(w => w.message.includes('Klassenstufe'))).toBe(true)
  })

  // ── cognitive_type ────────────────────────────────────────────────────────────

  it('errors on invalid cognitive_type', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'UNKNOWN' as never }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    const errors = validateTaxonomy(tax).filter(i => i.severity === 'error')
    expect(errors.some(e => e.message.includes('cognitive_type'))).toBe(true)
  })

  // ── estimated_minutes ─────────────────────────────────────────────────────────

  it('warns when estimated_minutes is out of range', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', estimated_minutes: 0, cognitive_type: 'FACT' }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    const warnings = validateTaxonomy(tax).filter(i => i.severity === 'warning')
    expect(warnings.some(w => w.message.includes('estimated_minutes'))).toBe(true)
  })

  it('warns when estimated_minutes exceeds 5', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', estimated_minutes: 10, cognitive_type: 'FACT' }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    const warnings = validateTaxonomy(tax).filter(i => i.severity === 'warning')
    expect(warnings.some(w => w.message.includes('estimated_minutes'))).toBe(true)
  })

  // ── prerequisites ─────────────────────────────────────────────────────────────

  it('errors for unknown prerequisite', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: ['M8.ZR.99'] }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    const errors = validateTaxonomy(tax).filter(i => i.severity === 'error')
    expect(errors.some(e => e.message.includes('prerequisite_topic_id'))).toBe(true)
  })

  it('accepts valid prerequisites', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    expect(validateTaxonomy(tax)).toHaveLength(0)
  })

  // ── curriculum_ref ────────────────────────────────────────────────────────────

  it('warns for missing curriculum_ref', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', curriculum_ref: '', cognitive_type: 'FACT' }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    const warnings = validateTaxonomy(tax).filter(i => i.severity === 'warning')
    expect(warnings.some(w => w.message.includes('curriculum_ref'))).toBe(true)
  })

  // ── cluster-level ─────────────────────────────────────────────────────────────

  it('warns for cluster with fewer than 3 microskills', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Kleiner Cluster',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
        ],
      }],
    })
    const warnings = validateTaxonomy(tax).filter(i => i.severity === 'warning')
    expect(warnings.some(w => w.message.includes('Kleiner Cluster'))).toBe(true)
  })

  it('warns for cluster missing a cognitive_type', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Nur FACT',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
        ],
      }],
    })
    const warnings = validateTaxonomy(tax).filter(i => i.severity === 'warning')
    expect(warnings.some(w => w.message.includes('cognitive_types'))).toBe(true)
  })

  // ── circular dependencies ────────────────────────────────────────────────────

  it('errors on circular prerequisite', () => {
    const tax = makeTaxonomy({
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: ['M8.ZR.02'] }),
          makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
          makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      }],
    })
    const errors = validateTaxonomy(tax).filter(i => i.severity === 'error')
    expect(errors.some(e => e.message.includes('Zirkulaere'))).toBe(true)
  })

  it('handles empty competency_areas', () => {
    const tax = makeTaxonomy({ competency_areas: [] })
    const issues = validateTaxonomy(tax)
    const errors = issues.filter(i => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })
})

// ── summarize ────────────────────────────────────────────────────────────────

describe('summarize', () => {
  it('returns zero counts for empty issues', () => {
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

  it('counts only warnings correctly', () => {
    const issues = [
      { severity: 'warning' as const, message: 'W1' },
      { severity: 'warning' as const, message: 'W2' },
    ]
    expect(summarize(issues)).toEqual({ errors: 0, warnings: 2 })
  })

  it('counts only errors correctly', () => {
    const issues = [{ severity: 'error' as const, message: 'E1' }]
    expect(summarize(issues)).toEqual({ errors: 1, warnings: 0 })
  })
})
