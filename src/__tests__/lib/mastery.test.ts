import { describe, it, expect } from 'vitest'
import {
  masteryStage,
  masteryStageFromLevel,
  MASTERY_STAGE_COLOR,
  MASTERY_STAGE_LABEL,
  MASTERY_STAGES,
} from '@/lib/mastery'

describe('masteryStage', () => {
  it('returns introduced for score < 40', () => {
    expect(masteryStage(0)).toBe('introduced')
    expect(masteryStage(39)).toBe('introduced')
  })

  it('returns developing for score 40-59', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(59)).toBe('developing')
  })

  it('returns progressing for score 60-74', () => {
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(74)).toBe('progressing')
  })

  it('returns proficient for score 75-84', () => {
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(84)).toBe('proficient')
  })

  it('returns mastered for score >= 85', () => {
    expect(masteryStage(85)).toBe('mastered')
    expect(masteryStage(100)).toBe('mastered')
  })
})

describe('masteryStageFromLevel', () => {
  it('converts level 1-10 to a stage via score = level * 10', () => {
    expect(masteryStageFromLevel(1)).toBe('introduced')  // 10
    expect(masteryStageFromLevel(4)).toBe('developing')  // 40
    expect(masteryStageFromLevel(6)).toBe('progressing') // 60
    expect(masteryStageFromLevel(8)).toBe('proficient')  // 80
    expect(masteryStageFromLevel(9)).toBe('mastered')    // 90
  })
})

describe('MASTERY_STAGE_COLOR', () => {
  it('has a CSS variable for every stage', () => {
    for (const stage of MASTERY_STAGES) {
      expect(MASTERY_STAGE_COLOR[stage]).toMatch(/^var\(--/)
    }
  })
})

describe('MASTERY_STAGE_LABEL', () => {
  it('has a German label for every stage', () => {
    expect(MASTERY_STAGE_LABEL.introduced).toBe('Eingeführt')
    expect(MASTERY_STAGE_LABEL.mastered).toBe('Gemeistert')
  })
})
