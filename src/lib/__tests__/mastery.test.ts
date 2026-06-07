import { describe, it, expect } from 'vitest'
import {
  masteryStage,
  masteryStageFromLevel,
  MASTERY_STAGE_COLOR,
  MASTERY_STAGE_LABEL,
  MASTERY_STAGES,
} from '../mastery'

describe('masteryStage', () => {
  it('returns "mastered" for score ≥ 85', () => {
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
})

describe('masteryStageFromLevel', () => {
  it('converts level 10 (score 100) to "mastered"', () => {
    expect(masteryStageFromLevel(10)).toBe('mastered')
  })

  it('converts level 5 (score 50) to "developing"', () => {
    expect(masteryStageFromLevel(5)).toBe('developing')
  })

  it('converts level 0 (score 0) to "introduced"', () => {
    expect(masteryStageFromLevel(0)).toBe('introduced')
  })

  it('is consistent with masteryStage(level * 10)', () => {
    for (let l = 0; l <= 10; l++) {
      expect(masteryStageFromLevel(l)).toBe(masteryStage(l * 10))
    }
  })
})

describe('MASTERY_STAGE_COLOR', () => {
  it('has a CSS variable for each stage', () => {
    for (const stage of MASTERY_STAGES) {
      expect(MASTERY_STAGE_COLOR[stage]).toMatch(/^var\(--/)
    }
  })
})

describe('MASTERY_STAGE_LABEL', () => {
  it('has a German label for each stage', () => {
    for (const stage of MASTERY_STAGES) {
      expect(typeof MASTERY_STAGE_LABEL[stage]).toBe('string')
      expect(MASTERY_STAGE_LABEL[stage].length).toBeGreaterThan(0)
    }
  })

  it('returns "Eingeführt" for introduced', () => {
    expect(MASTERY_STAGE_LABEL.introduced).toBe('Eingeführt')
  })

  it('returns "Gemeistert" for mastered', () => {
    expect(MASTERY_STAGE_LABEL.mastered).toBe('Gemeistert')
  })
})

describe('MASTERY_STAGES', () => {
  it('has exactly 5 stages in ascending order', () => {
    expect(MASTERY_STAGES).toEqual([
      'introduced',
      'developing',
      'progressing',
      'proficient',
      'mastered',
    ])
  })
})
