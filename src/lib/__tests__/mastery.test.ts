import { describe, it, expect } from 'vitest'
import {
  masteryStage,
  masteryStageFromLevel,
  MASTERY_STAGE_COLOR,
  MASTERY_STAGE_LABEL,
  MASTERY_STAGES,
} from '@/lib/mastery'

describe('masteryStage – Score zu Stage', () => {
  it('gibt "mastered" für Score >= 85', () => {
    expect(masteryStage(85)).toBe('mastered')
    expect(masteryStage(100)).toBe('mastered')
    expect(masteryStage(90)).toBe('mastered')
  })

  it('gibt "proficient" für Score 75–84', () => {
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(80)).toBe('proficient')
    expect(masteryStage(84)).toBe('proficient')
  })

  it('gibt "progressing" für Score 60–74', () => {
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(70)).toBe('progressing')
    expect(masteryStage(74)).toBe('progressing')
  })

  it('gibt "developing" für Score 40–59', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(50)).toBe('developing')
    expect(masteryStage(59)).toBe('developing')
  })

  it('gibt "introduced" für Score < 40', () => {
    expect(masteryStage(0)).toBe('introduced')
    expect(masteryStage(39)).toBe('introduced')
    expect(masteryStage(20)).toBe('introduced')
  })

  it('behandelt Grenzwerte korrekt', () => {
    expect(masteryStage(39)).toBe('introduced')
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(59)).toBe('developing')
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(74)).toBe('progressing')
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(84)).toBe('proficient')
    expect(masteryStage(85)).toBe('mastered')
  })
})

describe('masteryStageFromLevel – Level (1-10) zu Stage', () => {
  it('multipliziert Level mit 10 für Score', () => {
    // level 9 → score 90 → mastered
    expect(masteryStageFromLevel(9)).toBe('mastered')
    // level 8 → score 80 → proficient
    expect(masteryStageFromLevel(8)).toBe('proficient')
    // level 7 → score 70 → progressing
    expect(masteryStageFromLevel(7)).toBe('progressing')
    // level 5 → score 50 → developing
    expect(masteryStageFromLevel(5)).toBe('developing')
    // level 3 → score 30 → introduced
    expect(masteryStageFromLevel(3)).toBe('introduced')
  })

  it('funktioniert für alle Level 1-10', () => {
    const validStages = ['introduced', 'developing', 'progressing', 'proficient', 'mastered']
    for (let level = 1; level <= 10; level++) {
      expect(validStages).toContain(masteryStageFromLevel(level))
    }
  })
})

describe('MASTERY_STAGE_COLOR – CSS-Variablen', () => {
  it('enthält alle Stages', () => {
    const stages = ['introduced', 'developing', 'progressing', 'proficient', 'mastered'] as const
    stages.forEach(stage => {
      expect(MASTERY_STAGE_COLOR[stage]).toBeDefined()
    })
  })

  it('referenziert CSS-Variablen (var(--...))', () => {
    Object.values(MASTERY_STAGE_COLOR).forEach(value => {
      expect(value).toMatch(/^var\(--/)
    })
  })
})

describe('MASTERY_STAGE_LABEL – Deutsche Labels', () => {
  it('enthält alle Stages', () => {
    const stages = ['introduced', 'developing', 'progressing', 'proficient', 'mastered'] as const
    stages.forEach(stage => {
      expect(MASTERY_STAGE_LABEL[stage]).toBeDefined()
      expect(typeof MASTERY_STAGE_LABEL[stage]).toBe('string')
      expect(MASTERY_STAGE_LABEL[stage].length).toBeGreaterThan(0)
    })
  })
})

describe('MASTERY_STAGES – Reihenfolge', () => {
  it('enthält alle 5 Stages in aufsteigender Reihenfolge', () => {
    expect(MASTERY_STAGES).toEqual([
      'introduced',
      'developing',
      'progressing',
      'proficient',
      'mastered',
    ])
  })

  it('hat genau 5 Einträge', () => {
    expect(MASTERY_STAGES).toHaveLength(5)
  })
})
