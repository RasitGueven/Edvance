import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '../taxonomy/validate'
import type { RawTaxonomy, RawMicroskill } from '../taxonomy/validate'

// ── Factories ──────────────────────────────────────────────────

function microskill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Zahlenraum Grundlagen',
    cognitive_type: 'FACT',
    estimated_minutes: 3,
    prerequisite_topic_ids: [],
    curriculum_ref: 'KLP NRW 8',
    ...overrides,
  }
}

function validTaxonomy(): RawTaxonomy {
  return {
    subject: 'Mathematik',
    grade: 8,
    curriculum: 'KLP NRW',
    competency_areas: [
      {
        cluster_name: 'Zahlenraum',
        microskills: [
          microskill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
          microskill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          microskill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
        ],
      },
    ],
  }
}

// ── validateTaxonomy ────────────────────────────────────────────

describe('validateTaxonomy – valid input', () => {
  it('returns no issues for a valid taxonomy', () => {
    const issues = validateTaxonomy(validTaxonomy())
    expect(issues).toHaveLength(0)
  })
})

describe('validateTaxonomy – topic_id format', () => {
  it('errors on invalid topic_id format', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].topic_id = 'BAD_ID'
    const issues = validateTaxonomy(tax)
    const err = issues.find(i => i.severity === 'error' && i.topic_id === 'BAD_ID')
    expect(err).toBeDefined()
    expect(err?.message).toContain('Format')
  })

  it('warns when topic_id grade does not match taxonomy.grade', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].topic_id = 'M9.ZR.01'
    const issues = validateTaxonomy(tax)
    const warn = issues.find(
      i => i.severity === 'warning' && i.topic_id === 'M9.ZR.01',
    )
    expect(warn).toBeDefined()
    expect(warn?.message).toContain('Klassenstufe')
  })

  it('accepts topic_id with two-digit grade', () => {
    const tax = validTaxonomy()
    tax.grade = 10
    tax.competency_areas[0].microskills.forEach((s, i) => {
      s.topic_id = `M10.ZR.0${i + 1}`
    })
    const issues = validateTaxonomy(tax)
    const gradeErrors = issues.filter(i => i.message.includes('Klassenstufe'))
    expect(gradeErrors).toHaveLength(0)
  })
})

describe('validateTaxonomy – cognitive_type', () => {
  it('errors on invalid cognitive_type', () => {
    const tax = validTaxonomy()
    // @ts-expect-error intentional invalid value
    tax.competency_areas[0].microskills[0].cognitive_type = 'INVALID'
    const issues = validateTaxonomy(tax)
    const err = issues.find(
      i => i.severity === 'error' && i.message.includes('cognitive_type'),
    )
    expect(err).toBeDefined()
  })

  it('accepts FACT, TRANSFER, ANALYSIS', () => {
    for (const type of ['FACT', 'TRANSFER', 'ANALYSIS'] as const) {
      const tax = validTaxonomy()
      tax.competency_areas[0].microskills[0].cognitive_type = type
      // Only check per-skill errors (severity:'error'), not cluster-level warnings
      const issues = validateTaxonomy(tax).filter(
        i => i.severity === 'error' && i.message.includes('cognitive_type'),
      )
      expect(issues).toHaveLength(0)
    }
  })
})

describe('validateTaxonomy – estimated_minutes', () => {
  it('warns when estimated_minutes < 1', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].estimated_minutes = 0
    const issues = validateTaxonomy(tax)
    const warn = issues.find(
      i => i.severity === 'warning' && i.message.includes('estimated_minutes'),
    )
    expect(warn).toBeDefined()
  })

  it('warns when estimated_minutes > 5', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].estimated_minutes = 6
    const issues = validateTaxonomy(tax)
    const warn = issues.find(
      i => i.severity === 'warning' && i.message.includes('estimated_minutes'),
    )
    expect(warn).toBeDefined()
  })

  it('accepts values 1–5 without warning', () => {
    for (const min of [1, 2, 3, 4, 5]) {
      const tax = validTaxonomy()
      tax.competency_areas[0].microskills[0].estimated_minutes = min
      const issues = validateTaxonomy(tax).filter(i =>
        i.message.includes('estimated_minutes'),
      )
      expect(issues).toHaveLength(0)
    }
  })
})

describe('validateTaxonomy – prerequisites', () => {
  it('errors for prerequisite that does not exist', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].prerequisite_topic_ids = ['M8.XX.99']
    const issues = validateTaxonomy(tax)
    const err = issues.find(
      i => i.severity === 'error' && i.message.includes('M8.XX.99'),
    )
    expect(err).toBeDefined()
  })

  it('accepts valid cross-references within taxonomy', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(tax).filter(i => i.message.includes('prerequisite'))
    expect(issues).toHaveLength(0)
  })
})

describe('validateTaxonomy – circular dependencies', () => {
  it('errors on direct circular dependency (A→B→A)', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].prerequisite_topic_ids = ['M8.ZR.02']
    tax.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(tax)
    const circular = issues.find(i => i.message.includes('Zirkulaere'))
    expect(circular).toBeDefined()
  })

  it('does not report circular for linear chain (A→B→C)', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[2].prerequisite_topic_ids = ['M8.ZR.02']
    tax.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(tax).filter(i => i.message.includes('Zirkulaere'))
    expect(issues).toHaveLength(0)
  })
})

describe('validateTaxonomy – cluster checks', () => {
  it('warns when cluster has fewer than 3 microskills', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills = [
      microskill({ topic_id: 'M8.ZR.01' }),
      microskill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
    ]
    const issues = validateTaxonomy(tax)
    const warn = issues.find(i => i.message.includes('Minimum 3'))
    expect(warn).toBeDefined()
  })

  it('warns when cluster does not cover all cognitive types', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills = [
      microskill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      microskill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
      microskill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
    ]
    const issues = validateTaxonomy(tax)
    const warn = issues.find(i => i.message.includes('cognitive_types'))
    expect(warn).toBeDefined()
  })
})

describe('validateTaxonomy – curriculum_ref', () => {
  it('warns when curriculum_ref is empty', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].curriculum_ref = ''
    const issues = validateTaxonomy(tax)
    const warn = issues.find(i => i.message.includes('curriculum_ref'))
    expect(warn).toBeDefined()
  })

  it('warns when curriculum_ref is only whitespace', () => {
    const tax = validTaxonomy()
    tax.competency_areas[0].microskills[0].curriculum_ref = '   '
    const issues = validateTaxonomy(tax)
    const warn = issues.find(i => i.message.includes('curriculum_ref'))
    expect(warn).toBeDefined()
  })
})

// ── summarize ───────────────────────────────────────────────────

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

  it('works with only warnings', () => {
    const issues = [
      { severity: 'warning' as const, message: 'w' },
      { severity: 'warning' as const, message: 'w2' },
    ]
    expect(summarize(issues).warnings).toBe(2)
    expect(summarize(issues).errors).toBe(0)
  })
})
