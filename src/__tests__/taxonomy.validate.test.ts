import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '@/lib/taxonomy/validate'
import type { RawTaxonomy } from '@/lib/taxonomy/validate'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const validSkill = {
  topic_id: 'M8.ZR.01',
  topic_label: 'Zahlenrechnen Grundlagen',
  cognitive_type: 'FACT' as const,
  estimated_minutes: 3,
  prerequisite_topic_ids: [],
  curriculum_ref: 'KLP NRW §4.1',
}

const validTaxonomy: RawTaxonomy = {
  subject: 'Mathematik',
  grade: 8,
  curriculum: 'NRW',
  competency_areas: [
    {
      cluster_name: 'Zahlen & Rechnen',
      microskills: [
        validSkill,
        { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'Brüche', cognitive_type: 'TRANSFER' },
        { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'Gleichungen', cognitive_type: 'ANALYSIS' },
      ],
    },
  ],
}

// ── validateTaxonomy – valid input ────────────────────────────────────────────

describe('validateTaxonomy – valid input', () => {
  it('returns no issues for a fully valid taxonomy', () => {
    const issues = validateTaxonomy(validTaxonomy)
    expect(issues).toHaveLength(0)
  })
})

// ── validateTaxonomy – topic_id format ────────────────────────────────────────

describe('validateTaxonomy – topic_id format', () => {
  it('raises error for malformed topic_id', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy,
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          { ...validSkill, topic_id: 'INVALID' },
          { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B', cognitive_type: 'TRANSFER' },
          { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'C', cognitive_type: 'ANALYSIS' },
        ],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'error' && i.topic_id === 'INVALID')).toBe(true)
  })

  it('warns when topic_id grade != taxonomy.grade', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy,
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          { ...validSkill, topic_id: 'M7.ZR.01' }, // grade 7 but taxonomy.grade = 8
          { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B', cognitive_type: 'TRANSFER' },
          { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'C', cognitive_type: 'ANALYSIS' },
        ],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.topic_id === 'M7.ZR.01')).toBe(true)
  })
})

// ── validateTaxonomy – cognitive_type ─────────────────────────────────────────

describe('validateTaxonomy – cognitive_type', () => {
  it('raises error for invalid cognitive_type', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy,
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          { ...validSkill, cognitive_type: 'UNKNOWN' as unknown as 'FACT' },
          { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B', cognitive_type: 'TRANSFER' },
          { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'C', cognitive_type: 'ANALYSIS' },
        ],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('cognitive_type'))).toBe(true)
  })
})

// ── validateTaxonomy – estimated_minutes ─────────────────────────────────────

describe('validateTaxonomy – estimated_minutes', () => {
  it('warns for estimated_minutes out of 1–5 range', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy,
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          { ...validSkill, estimated_minutes: 0 },
          { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B', cognitive_type: 'TRANSFER' },
          { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'C', cognitive_type: 'ANALYSIS' },
        ],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
  })

  it('does not warn for estimated_minutes = 5', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy,
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          { ...validSkill, estimated_minutes: 5 },
          { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B', cognitive_type: 'TRANSFER' },
          { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'C', cognitive_type: 'ANALYSIS' },
        ],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.every((i) => !i.message.includes('estimated_minutes'))).toBe(true)
  })
})

// ── validateTaxonomy – prerequisite resolution ────────────────────────────────

describe('validateTaxonomy – prerequisites', () => {
  it('errors on unknown prerequisite_topic_id', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy,
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          { ...validSkill, prerequisite_topic_ids: ['M8.ZZ.99'] }, // non-existent
          { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B', cognitive_type: 'TRANSFER' },
          { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'C', cognitive_type: 'ANALYSIS' },
        ],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('M8.ZZ.99'))).toBe(true)
  })

  it('detects circular dependencies', () => {
    const tax: RawTaxonomy = {
      subject: 'Mathematik',
      grade: 8,
      curriculum: 'NRW',
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          { ...validSkill, topic_id: 'M8.ZR.01', prerequisite_topic_ids: ['M8.ZR.02'] },
          { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] },
          { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'C', cognitive_type: 'ANALYSIS', prerequisite_topic_ids: [] },
        ],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('Zirkulaere'))).toBe(true)
  })
})

// ── validateTaxonomy – cluster checks ────────────────────────────────────────

describe('validateTaxonomy – cluster checks', () => {
  it('warns for cluster with fewer than 3 microskills', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy,
      competency_areas: [{
        cluster_name: 'Kleiner Cluster',
        microskills: [validSkill, { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B', cognitive_type: 'TRANSFER' }],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('Kleiner Cluster'))).toBe(true)
  })

  it('warns when cluster does not cover all cognitive_types', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy,
      competency_areas: [{
        cluster_name: 'Nur FACT',
        microskills: [
          validSkill,
          { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B' },
          { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'C' },
        ],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.message.includes('cognitive_types'))).toBe(true)
  })

  it('warns for missing curriculum_ref', () => {
    const tax: RawTaxonomy = {
      ...validTaxonomy,
      competency_areas: [{
        cluster_name: 'Test',
        microskills: [
          { ...validSkill, curriculum_ref: '' },
          { ...validSkill, topic_id: 'M8.ZR.02', topic_label: 'B', cognitive_type: 'TRANSFER' },
          { ...validSkill, topic_id: 'M8.ZR.03', topic_label: 'C', cognitive_type: 'ANALYSIS' },
        ],
      }],
    }
    const issues = validateTaxonomy(tax)
    expect(issues.some((i) => i.message.includes('curriculum_ref'))).toBe(true)
  })
})

// ── summarize ────────────────────────────────────────────────────────────────

describe('summarize', () => {
  it('returns zeros for empty issues', () => {
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
})
