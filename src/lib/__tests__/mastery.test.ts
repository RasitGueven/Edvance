import { describe, it, expect } from 'vitest'
import {
  masteryStage,
  masteryStageFromLevel,
  MASTERY_STAGE_LABEL,
  MASTERY_STAGES,
} from '../mastery'

describe('masteryStage', () => {
  it('returns "mastered" for score >= 85', () => {
    expect(masteryStage(85)).toBe('mastered')
    expect(masteryStage(100)).toBe('mastered')
  })

  it('returns "proficient" for score 75–84', () => {
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(84)).toBe('proficient')
  })

  it('returns "progressing" for score 60–74', () => {
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(74)).toBe('progressing')
  })

  it('returns "developing" for score 40–59', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(59)).toBe('developing')
  })

  it('returns "introduced" for score < 40', () => {
    expect(masteryStage(0)).toBe('introduced')
    expect(masteryStage(39)).toBe('introduced')
  })

  it('handles boundary at exactly 40', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(39)).toBe('introduced')
  })
})

describe('masteryStageFromLevel', () => {
  it('maps level 10 to "mastered"', () => {
    expect(masteryStageFromLevel(10)).toBe('mastered')
  })

  it('maps level 8 to "proficient"', () => {
    expect(masteryStageFromLevel(8)).toBe('proficient')
  })

  it('maps level 6 to "progressing"', () => {
    expect(masteryStageFromLevel(6)).toBe('progressing')
  })

  it('maps level 4 to "developing"', () => {
    expect(masteryStageFromLevel(4)).toBe('developing')
  })

  it('maps level 1 to "introduced"', () => {
    expect(masteryStageFromLevel(1)).toBe('introduced')
  })
})

describe('MASTERY_STAGE_LABEL', () => {
  it('has a German label for every stage', () => {
    for (const stage of MASTERY_STAGES) {
      expect(MASTERY_STAGE_LABEL[stage]).toBeTruthy()
    }
  })

  it('labels are non-empty strings', () => {
    for (const stage of MASTERY_STAGES) {
      expect(typeof MASTERY_STAGE_LABEL[stage]).toBe('string')
      expect(MASTERY_STAGE_LABEL[stage].length).toBeGreaterThan(0)
    }
  })
})

describe('MASTERY_STAGES', () => {
  it('contains all 5 stages in ascending order', () => {
    expect(MASTERY_STAGES).toEqual([
      'introduced',
      'developing',
      'progressing',
      'proficient',
      'mastered',
    ])
  })
})
