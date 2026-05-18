import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from './validate'
import type { RawTaxonomy, RawMicroskill } from './validate'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSkill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Zahlenraum erweitern',
    cognitive_type: 'FACT',
    estimated_minutes: 3,
    prerequisite_topic_ids: [],
    curriculum_ref: 'LP 2022 §3.1',
    ...overrides,
  }
}

function makeValidTaxonomy(): RawTaxonomy {
  return {
    subject: 'Mathematik',
    grade: 8,
    curriculum: 'NRW LP 2022',
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

// ── validateTaxonomy – valid input ────────────────────────────────────────────

describe('validateTaxonomy() – valid taxonomy', () => {
  it('returns no issues for a fully valid taxonomy', () => {
    const issues = validateTaxonomy(makeValidTaxonomy())
    expect(issues).toHaveLength(0)
  })
})

// ── topic_id format ───────────────────────────────────────────────────────────

describe('validateTaxonomy() – topic_id format', () => {
  it('errors on topic_id with wrong prefix', () => {
    const tax = makeValidTaxonomy()
    tax.competency_areas[0].microskills[0].topic_id = 'X8.ZR.01'
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'error' && i.topic_id === 'X8.ZR.01')).toBe(true)
  })

  it('errors on topic_id missing section separator', () => {
    const tax = makeValidTaxonomy()
    tax.competency_areas[0].microskills[0].topic_id = 'M8ZR01'
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('Format'))).toBe(true)
  })

  it('warns when grade in topic_id does not match taxonomy.grade', () => {
    const tax = makeValidTaxonomy()
    // topic_id says grade 5 but taxonomy is grade 8
    tax.competency_areas[0].microskills[0].topic_id = 'M5.ZR.01'
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('Klassenstufe'))).toBe(true)
  })

  it('accepts valid two-digit grades like M10.AB.01', () => {
    const tax = makeValidTaxonomy()
    tax.grade = 10
    tax.competency_areas[0].microskills.forEach((s, i) => {
      s.topic_id = `M10.ZR.0${i + 1}`
    })
    const issues = validateTaxonomy(tax)
    const formatErrors = issues.filter((i) => i.severity === 'error' && i.message.includes('Format'))
    expect(formatErrors).toHaveLength(0)
  })
})

// ── cognitive_type ────────────────────────────────────────────────────────────

describe('validateTaxonomy() – cognitive_type', () => {
  it('errors on unknown cognitive_type', () => {
    const tax = makeValidTaxonomy()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tax.competency_areas[0].microskills[0].cognitive_type = 'UNKNOWN' as any
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('cognitive_type'))).toBe(true)
  })

  it('accepts all three valid cognitive types', () => {
    const tax = makeValidTaxonomy()
    const issues = validateTaxonomy(tax)
    const cogErrors = issues.filter((i) => i.message.includes('cognitive_type'))
    expect(cogErrors).toHaveLength(0)
  })
})

// ── estimated_minutes ─────────────────────────────────────────────────────────

describe('validateTaxonomy() – estimated_minutes', () => {
  it('warns for estimated_minutes = 0', () => {
    const tax = makeValidTaxonomy()
    tax.competency_areas[0].microskills[0].estimated_minutes = 0
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
  })

  it('warns for estimated_minutes = 6', () => {
    const tax = makeValidTaxonomy()
    tax.competency_areas[0].microskills[0].estimated_minutes = 6
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
  })

  it('accepts estimated_minutes 1-5 without warnings', () => {
    for (const mins of [1, 2, 3, 4, 5]) {
      const tax = makeValidTaxonomy()
      tax.competency_areas[0].microskills.forEach((s) => {
        s.estimated_minutes = mins
      })
      const issues = validateTaxonomy(tax)
      const minuteWarnings = issues.filter((i) => i.message.includes('estimated_minutes'))
      expect(minuteWarnings).toHaveLength(0)
    }
  })
})

// ── prerequisite_topic_ids ────────────────────────────────────────────────────

describe('validateTaxonomy() – prerequisites', () => {
  it('errors when prerequisite references unknown topic_id', () => {
    const tax = makeValidTaxonomy()
    tax.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.99']
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('M8.ZR.99'))).toBe(true)
  })

  it('accepts known prerequisite references', () => {
    const tax = makeValidTaxonomy()
    tax.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(tax)
    const prereqErrors = issues.filter((i) => i.message.includes('prerequisite'))
    expect(prereqErrors).toHaveLength(0)
  })
})

// ── curriculum_ref ────────────────────────────────────────────────────────────

describe('validateTaxonomy() – curriculum_ref', () => {
  it('warns on missing curriculum_ref', () => {
    const tax = makeValidTaxonomy()
    tax.competency_areas[0].microskills[0].curriculum_ref = ''
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('curriculum_ref'))).toBe(true)
  })

  it('warns on whitespace-only curriculum_ref', () => {
    const tax = makeValidTaxonomy()
    tax.competency_areas[0].microskills[0].curriculum_ref = '   '
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('curriculum_ref'))).toBe(true)
  })
})

// ── cluster-level checks ──────────────────────────────────────────────────────

describe('validateTaxonomy() – cluster checks', () => {
  it('warns when cluster has fewer than 3 microskills', () => {
    const tax = makeValidTaxonomy()
    tax.competency_areas[0].microskills = [makeSkill()]
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('Minimum 3'))).toBe(true)
  })

  it('warns when cluster does not cover all cognitive types', () => {
    const tax = makeValidTaxonomy()
    // All FACT → missing TRANSFER and ANALYSIS
    tax.competency_areas[0].microskills = [
      makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
    ]
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('cognitive_types'))).toBe(true)
  })
})

// ── circular dependency detection ────────────────────────────────────────────

describe('validateTaxonomy() – circular dependency', () => {
  it('detects a direct cycle A → B → A', () => {
    const tax = makeValidTaxonomy()
    const skills = tax.competency_areas[0].microskills
    skills[0].prerequisite_topic_ids = [skills[1].topic_id]
    skills[1].prerequisite_topic_ids = [skills[0].topic_id]
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('Zirkulaere'))).toBe(true)
  })

  it('does not flag a valid linear chain A → B → C', () => {
    const tax = makeValidTaxonomy()
    const skills = tax.competency_areas[0].microskills
    skills[2].prerequisite_topic_ids = [skills[1].topic_id]
    skills[1].prerequisite_topic_ids = [skills[0].topic_id]
    skills[0].prerequisite_topic_ids = []
    const issues = validateTaxonomy(tax)
    const cycleErrors = issues.filter((i) => i.message.includes('Zirkulaere'))
    expect(cycleErrors).toHaveLength(0)
  })
})

// ── summarize ─────────────────────────────────────────────────────────────────

describe('summarize()', () => {
  it('counts errors and warnings separately', () => {
    const issues = [
      { severity: 'error' as const, message: 'e1' },
      { severity: 'error' as const, message: 'e2' },
      { severity: 'warning' as const, message: 'w1' },
    ]
    expect(summarize(issues)).toEqual({ errors: 2, warnings: 1 })
  })

  it('returns zeros for empty array', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })
})
