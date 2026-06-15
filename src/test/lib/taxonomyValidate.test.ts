import { describe, it, expect } from 'vitest'
import { validateTaxonomy, summarize } from '@/lib/taxonomy/validate'
import type { RawTaxonomy, RawMicroskill } from '@/lib/taxonomy/validate'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeSkill(overrides: Partial<RawMicroskill> = {}): RawMicroskill {
  return {
    topic_id: 'M8.ZR.01',
    topic_label: 'Grundrechenarten',
    cognitive_type: 'FACT',
    estimated_minutes: 3,
    prerequisite_topic_ids: [],
    curriculum_ref: 'KLP-NRW-M8-1.1',
    ...overrides,
  }
}

function makeValidTaxonomy(): RawTaxonomy {
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
  }
}

// ── validateTaxonomy ──────────────────────────────────────────────────────────

describe('validateTaxonomy()', () => {
  it('gibt keine Issues für eine valide Taxonomie zurück', () => {
    const issues = validateTaxonomy(makeValidTaxonomy())
    const { errors } = summarize(issues)
    expect(errors).toBe(0)
  })

  it('meldet Error bei ungültigem topic_id-Format', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].topic_id = 'INVALID'
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('Format'))).toBe(true)
  })

  it('meldet Warning bei abweichender Klassenstufe im topic_id', () => {
    const taxonomy = makeValidTaxonomy()
    // Grade 8 aber topic_id für Klasse 9
    taxonomy.competency_areas[0].microskills[0].topic_id = 'M9.ZR.01'
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('Klassenstufe'))).toBe(true)
  })

  it('meldet Error bei ungültigem cognitive_type', () => {
    const taxonomy = makeValidTaxonomy()
    // @ts-expect-error - bewusst ungültiger Wert
    taxonomy.competency_areas[0].microskills[0].cognitive_type = 'INVALID'
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('cognitive_type'))).toBe(true)
  })

  it('meldet Warning wenn estimated_minutes außerhalb 1-5', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].estimated_minutes = 0
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
  })

  it('meldet Warning wenn estimated_minutes > 5', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].estimated_minutes = 6
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.severity === 'warning' && i.message.includes('estimated_minutes'))).toBe(true)
  })

  it('meldet Error bei unbekannter prerequisite_topic_id', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].prerequisite_topic_ids = ['M8.XX.99']
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('prerequisite_topic_id'))).toBe(true)
  })

  it('akzeptiert valide prerequisite_topic_ids', () => {
    const taxonomy = makeValidTaxonomy()
    // ZR.02 hängt von ZR.01 ab (beide existieren)
    taxonomy.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(taxonomy)
    const prereqErrors = issues.filter(i => i.severity === 'error' && i.message.includes('prerequisite'))
    expect(prereqErrors).toHaveLength(0)
  })

  it('meldet Warning wenn Cluster < 3 Mikroskills hat', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills = [
      makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'TRANSFER' }),
    ]
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.message.includes('Minimum 3 empfohlen'))).toBe(true)
  })

  it('meldet Warning wenn nicht alle cognitive_types im Cluster vorhanden', () => {
    const taxonomy = makeValidTaxonomy()
    // Nur FACT, kein TRANSFER oder ANALYSIS
    taxonomy.competency_areas[0].microskills = [
      makeSkill({ topic_id: 'M8.ZR.01', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.02', cognitive_type: 'FACT' }),
      makeSkill({ topic_id: 'M8.ZR.03', cognitive_type: 'FACT' }),
    ]
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.message.includes('cognitive_types'))).toBe(true)
  })

  it('erkennt zirkuläre Abhängigkeiten', () => {
    const taxonomy = makeValidTaxonomy()
    // ZR.01 → ZR.02 → ZR.01 (Zirkel)
    taxonomy.competency_areas[0].microskills[0].prerequisite_topic_ids = ['M8.ZR.02']
    taxonomy.competency_areas[0].microskills[1].prerequisite_topic_ids = ['M8.ZR.01']
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.severity === 'error' && i.message.includes('Zirkulaere'))).toBe(true)
  })

  it('meldet Warning wenn curriculum_ref leer ist', () => {
    const taxonomy = makeValidTaxonomy()
    taxonomy.competency_areas[0].microskills[0].curriculum_ref = ''
    const issues = validateTaxonomy(taxonomy)
    expect(issues.some(i => i.message.includes('curriculum_ref fehlt'))).toBe(true)
  })
})

// ── summarize ─────────────────────────────────────────────────────────────────

describe('summarize()', () => {
  it('gibt 0/0 für leere Liste zurück', () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0 })
  })

  it('zählt errors und warnings korrekt', () => {
    const issues = [
      { severity: 'error' as const, message: 'Fehler 1' },
      { severity: 'error' as const, message: 'Fehler 2' },
      { severity: 'warning' as const, message: 'Warnung 1' },
    ]
    expect(summarize(issues)).toEqual({ errors: 2, warnings: 1 })
  })
})
