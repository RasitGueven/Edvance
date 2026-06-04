import { describe, it, expect } from 'vitest'
import { masteryStage, masteryStageFromLevel, MASTERY_STAGES, MASTERY_STAGE_LABEL, MASTERY_STAGE_COLOR } from '@/lib/mastery'

describe('masteryStage', () => {
  it('returns "introduced" for score < 40', () => {
    expect(masteryStage(0)).toBe('introduced')
    expect(masteryStage(39)).toBe('introduced')
  })

  it('returns "developing" for score 40-59', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(59)).toBe('developing')
  })

  it('returns "progressing" for score 60-74', () => {
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(74)).toBe('progressing')
  })

  it('returns "proficient" for score 75-84', () => {
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(84)).toBe('proficient')
  })

  it('returns "mastered" for score ≥ 85', () => {
    expect(masteryStage(85)).toBe('mastered')
    expect(masteryStage(100)).toBe('mastered')
  })
})

describe('masteryStageFromLevel', () => {
  it('maps level 1 (10%) to "introduced"', () => {
    expect(masteryStageFromLevel(1)).toBe('introduced')
  })

  it('maps level 5 (50%) to "developing"', () => {
    expect(masteryStageFromLevel(5)).toBe('developing')
  })

  it('maps level 9 (90%) to "mastered"', () => {
    expect(masteryStageFromLevel(9)).toBe('mastered')
  })

  it('maps level 10 (100%) to "mastered"', () => {
    expect(masteryStageFromLevel(10)).toBe('mastered')
  })
})

describe('MASTERY_STAGES', () => {
  it('contains all 5 stages in order', () => {
    expect(MASTERY_STAGES).toEqual([
      'introduced',
      'developing',
      'progressing',
      'proficient',
      'mastered',
    ])
  })
})

describe('MASTERY_STAGE_LABEL', () => {
  it('has a German label for every stage', () => {
    for (const stage of MASTERY_STAGES) {
      expect(MASTERY_STAGE_LABEL[stage]).toBeTruthy()
      expect(typeof MASTERY_STAGE_LABEL[stage]).toBe('string')
    }
  })

  it('labels are in German', () => {
    expect(MASTERY_STAGE_LABEL.mastered).toBe('Gemeistert')
    expect(MASTERY_STAGE_LABEL.introduced).toBe('Eingeführt')
  })
})

describe('MASTERY_STAGE_COLOR', () => {
  it('uses CSS variable format for every stage', () => {
    for (const stage of MASTERY_STAGES) {
      expect(MASTERY_STAGE_COLOR[stage]).toMatch(/^var\(--/)
    }
  })
})
