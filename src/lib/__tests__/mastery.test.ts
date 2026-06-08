import { describe, it, expect } from 'vitest'
import {
  masteryStage,
  masteryStageFromLevel,
  MASTERY_STAGE_COLOR,
  MASTERY_STAGE_LABEL,
  MASTERY_STAGES,
} from '@/lib/mastery'

describe('masteryStage', () => {
  it('returns "mastered" for score >= 85', () => {
    expect(masteryStage(85)).toBe('mastered')
    expect(masteryStage(100)).toBe('mastered')
    expect(masteryStage(90)).toBe('mastered')
  })

  it('returns "proficient" for score 75-84', () => {
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(80)).toBe('proficient')
    expect(masteryStage(84)).toBe('proficient')
  })

  it('returns "progressing" for score 60-74', () => {
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(70)).toBe('progressing')
    expect(masteryStage(74)).toBe('progressing')
  })

  it('returns "developing" for score 40-59', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(50)).toBe('developing')
    expect(masteryStage(59)).toBe('developing')
  })

  it('returns "introduced" for score < 40', () => {
    expect(masteryStage(0)).toBe('introduced')
    expect(masteryStage(20)).toBe('introduced')
    expect(masteryStage(39)).toBe('introduced')
  })
})

describe('masteryStageFromLevel', () => {
  it('maps level 1-10 to mastery stages correctly', () => {
    // level 10 → score 100 → mastered
    expect(masteryStageFromLevel(10)).toBe('mastered')
    // level 9 → score 90 → mastered
    expect(masteryStageFromLevel(9)).toBe('mastered')
    // level 8 → score 80 → proficient
    expect(masteryStageFromLevel(8)).toBe('proficient')
    // level 7 → score 70 → progressing
    expect(masteryStageFromLevel(7)).toBe('progressing')
    // level 6 → score 60 → progressing
    expect(masteryStageFromLevel(6)).toBe('progressing')
    // level 5 → score 50 → developing
    expect(masteryStageFromLevel(5)).toBe('developing')
    // level 4 → score 40 → developing
    expect(masteryStageFromLevel(4)).toBe('developing')
    // level 3 → score 30 → introduced
    expect(masteryStageFromLevel(3)).toBe('introduced')
    // level 1 → score 10 → introduced
    expect(masteryStageFromLevel(1)).toBe('introduced')
  })
})

describe('MASTERY_STAGE_COLOR', () => {
  it('has a CSS variable for each stage', () => {
    for (const stage of MASTERY_STAGES) {
      expect(MASTERY_STAGE_COLOR[stage]).toMatch(/^var\(--/)
    }
  })

  it('covers all 5 stages', () => {
    expect(Object.keys(MASTERY_STAGE_COLOR)).toHaveLength(5)
  })
})

describe('MASTERY_STAGE_LABEL', () => {
  it('has a German label for each stage', () => {
    expect(MASTERY_STAGE_LABEL.introduced).toBe('Eingeführt')
    expect(MASTERY_STAGE_LABEL.developing).toBe('In Entwicklung')
    expect(MASTERY_STAGE_LABEL.progressing).toBe('Fortschritt')
    expect(MASTERY_STAGE_LABEL.proficient).toBe('Sicher')
    expect(MASTERY_STAGE_LABEL.mastered).toBe('Gemeistert')
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
