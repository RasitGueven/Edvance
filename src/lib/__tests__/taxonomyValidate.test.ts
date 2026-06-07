import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '../taxonomy/validate'
import type { RawTaxonomy, RawMicroskill, RawCluster } from '../taxonomy/validate'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeSkill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Zahlenraumverständnis',
    cognitive_type: 'FACT',
    estimated_minutes: 2,
    prerequisite_topic_ids: [],
    curriculum_ref: 'LP-NRW-2023',
    ...overrides,
  }
}

function makeCluster(overrides: Partial<RawCluster> = {}): RawCluster {
  return {
    cluster_name: 'Zahlenraum',
    microskills: [
      makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
      makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
    ],
    ...overrides,
  }
}

function makeTaxonomy(overrides: Partial<RawTaxonomy> = {}): RawTaxonomy {
  return {
    subject: 'Mathematik',
    grade: 8,
    curriculum: 'NRW-2023',
    competency_areas: [makeCluster()],
    ...overrides,
  }
}

// ── validateTaxonomy ──────────────────────────────────────────────────────────

describe('validateTaxonomy', () => {
  it('returns no issues for a valid taxonomy', () => {
    expect(validateTaxonomy(makeTaxonomy())).toEqual([])
  })

  it('reports error for invalid topic_id format', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            makeSkill({ topic_id: 'INVALID-FORMAT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const errors = issues.filter((i) => i.severity === 'error' && i.message.includes('Format'))
    expect(errors.length).toBeGreaterThan(0)
  })

  it('warns when topic_id grade mismatches taxonomy grade', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            makeSkill({ topic_id: 'M5.ZR.01', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const warnings = issues.filter((i) => i.severity === 'warning' && i.message.includes('Klassenstufe'))
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('reports error for invalid cognitive_type', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            // @ts-expect-error testing invalid value
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'UNKNOWN' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const errors = issues.filter((i) => i.severity === 'error' && i.message.includes('cognitive_type'))
    expect(errors.length).toBeGreaterThan(0)
  })

  it('warns when estimated_minutes is out of range', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', estimated_minutes: 0 }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const warnings = issues.filter((i) => i.severity === 'warning' && i.message.includes('estimated_minutes'))
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('reports error for unknown prerequisite_topic_id', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', prerequisite_topic_ids: ['M8.ZR.99'] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const errors = issues.filter((i) => i.severity === 'error' && i.message.includes('prerequisite'))
    expect(errors.length).toBeGreaterThan(0)
  })

  it('warns when curriculum_ref is empty', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', curriculum_ref: '' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const warnings = issues.filter((i) => i.severity === 'warning' && i.message.includes('curriculum_ref'))
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('warns for cluster with less than 3 microskills', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const warnings = issues.filter((i) => i.severity === 'warning' && i.message.includes('Minimum'))
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('warns when cluster does not cover all cognitive types', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const warnings = issues.filter((i) => i.severity === 'warning' && i.message.includes('cognitive_types'))
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('detects circular prerequisites', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', prerequisite_topic_ids: ['M8.ZR.02'] }),
            makeSkill({ topic_id: 'M8.ZR.02', prerequisite_topic_ids: ['M8.ZR.01'], cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const cycleErrors = issues.filter((i) => i.severity === 'error' && i.message.includes('Zirkul'))
    expect(cycleErrors.length).toBeGreaterThan(0)
  })

  it('does not flag a valid DAG prerequisite chain', () => {
    const tax = makeTaxonomy({
      competency_areas: [
        makeCluster({
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', prerequisite_topic_ids: [] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: ['M8.ZR.02'] }),
          ],
        }),
      ],
    })
    const issues = validateTaxonomy(tax)
    const cycleErrors = issues.filter((i) => i.severity === 'error' && i.message.includes('Zirkul'))
    expect(cycleErrors).toHaveLength(0)
  })
})

// ── summarize ─────────────────────────────────────────────────────────────────

describe('summarize', () => {
  it('returns zeros for empty issues', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })

  it('counts errors and warnings separately', () => {
    const issues = [
      { severity: 'error' as const, message: 'Fehler 1' },
      { severity: 'error' as const, message: 'Fehler 2' },
      { severity: 'warning' as const, message: 'Warnung 1' },
    ]
    expect(summarize(issues)).toEqual({ errors: 2, warnings: 1 })
  })

  it('counts only warnings when no errors', () => {
    const issues = [
      { severity: 'warning' as const, message: 'W1' },
      { severity: 'warning' as const, message: 'W2' },
    ]
    expect(summarize(issues)).toEqual({ errors: 0, warnings: 2 })
  })
})
