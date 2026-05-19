import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '@/lib/taxonomy/validate'
import type { RawTaxonomy, RawMicroskill } from '@/lib/taxonomy/validate'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSkill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Zahlen und Rechnen 1',
    cognitive_type: 'FACT',
    estimated_minutes: 3,
    prerequisite_topic_ids: [],
    curriculum_ref: 'NRW-2022/M8',
    ...overrides,
  }
}

function makeTaxonomy(overrides: Partial<RawTaxonomy> = {}): RawTaxonomy {
  return {
    subject: 'Mathematik',
    grade: 8,
    curriculum: 'NRW-2022',
    competency_areas: [
      {
        cluster_name: 'Zahlen und Rechnen',
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

// ── validateTaxonomy ──────────────────────────────────────────────────────────

describe('validateTaxonomy()', () => {
  it('returns no issues for a valid taxonomy', () => {
    const issues = validateTaxonomy(makeTaxonomy())
    const errors = issues.filter(i => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })

  describe('topic_id format', () => {
    it('raises error for malformed topic_id', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'INVALID_ID', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'error' && i.topic_id === 'INVALID_ID')).toBe(true)
    })

    it('raises warning when grade in topic_id mismatches taxonomy grade', () => {
      const taxonomy = makeTaxonomy({
        grade: 8,
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M9.ZR.01', cognitive_type: 'FACT' }), // grade 9 in M8 taxonomy
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'warning' && i.topic_id === 'M9.ZR.01')).toBe(true)
    })
  })

  describe('cognitive_type', () => {
    it('raises error for invalid cognitive_type', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'MEMORIZE' as never }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'error' && i.topic_id === 'M8.ZR.01')).toBe(true)
    })
  })

  describe('estimated_minutes', () => {
    it('raises warning when estimated_minutes is 0', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', estimated_minutes: 0, cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'warning' && i.topic_id === 'M8.ZR.01')).toBe(true)
    })

    it('raises warning when estimated_minutes is 6', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', estimated_minutes: 6, cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'warning' && i.topic_id === 'M8.ZR.01')).toBe(true)
    })
  })

  describe('prerequisite_topic_ids', () => {
    it('raises error when prerequisite does not exist', () => {
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
      expect(issues.some(i => i.severity === 'error' && i.topic_id === 'M8.ZR.01')).toBe(true)
    })

    it('passes when prerequisite exists', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      const errors = issues.filter(i => i.severity === 'error')
      expect(errors).toHaveLength(0)
    })
  })

  describe('circular dependencies', () => {
    it('raises error for direct circular dependency', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', prerequisite_topic_ids: ['M8.ZR.02'] }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER', prerequisite_topic_ids: ['M8.ZR.01'] }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'error' && i.message.includes('Zirkulaere'))).toBe(true)
    })
  })

  describe('curriculum_ref', () => {
    it('raises warning when curriculum_ref is empty', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Test',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT', curriculum_ref: '' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'ANALYSIS' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'warning' && i.topic_id === 'M8.ZR.01')).toBe(true)
    })
  })

  describe('cluster-level checks', () => {
    it('warns when cluster has fewer than 3 microskills', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Kleiner Cluster',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'warning' && i.message.includes('Kleiner Cluster'))).toBe(true)
    })

    it('warns when not all cognitive types are covered', () => {
      const taxonomy = makeTaxonomy({
        competency_areas: [{
          cluster_name: 'Nur FACT',
          microskills: [
            makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
            makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
          ],
        }],
      })
      const issues = validateTaxonomy(taxonomy)
      expect(issues.some(i => i.severity === 'warning' && i.message.includes('Nur FACT'))).toBe(true)
    })
  })
})

// ── summarize ─────────────────────────────────────────────────────────────────

describe('summarize() [taxonomy]', () => {
  it('returns zero counts for no issues', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })

  it('counts errors and warnings correctly', () => {
    const issues = [
      { severity: 'error' as const, message: 'err1' },
      { severity: 'error' as const, message: 'err2' },
      { severity: 'warning' as const, message: 'warn1' },
    ]
    expect(summarize(issues)).toEqual({ errors: 2, warnings: 1 })
  })
})
