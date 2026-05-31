import { describe, it, expect } from 'vitest'
import { masteryStage, masteryStageFromLevel } from '@/lib/mastery'

describe('masteryStage', () => {
  it('returns "introduced" for scores below 40', () => {
    expect(masteryStage(0)).toBe('introduced')
    expect(masteryStage(20)).toBe('introduced')
    expect(masteryStage(39)).toBe('introduced')
  })

  it('returns "developing" for scores 40–59', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(50)).toBe('developing')
    expect(masteryStage(59)).toBe('developing')
  })

  it('returns "progressing" for scores 60–74', () => {
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(70)).toBe('progressing')
    expect(masteryStage(74)).toBe('progressing')
  })

  it('returns "proficient" for scores 75–84', () => {
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(80)).toBe('proficient')
    expect(masteryStage(84)).toBe('proficient')
  })

  it('returns "mastered" for scores 85 and above', () => {
    expect(masteryStage(85)).toBe('mastered')
    expect(masteryStage(100)).toBe('mastered')
  })

  it('handles boundary values exactly', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(85)).toBe('mastered')
  })
})

describe('masteryStageFromLevel', () => {
  it('converts level 1–10 by multiplying by 10', () => {
    // level 1 → score 10 → introduced
    expect(masteryStageFromLevel(1)).toBe('introduced')
    // level 4 → score 40 → developing
    expect(masteryStageFromLevel(4)).toBe('developing')
    // level 6 → score 60 → progressing
    expect(masteryStageFromLevel(6)).toBe('progressing')
    // level 8 → score 80 → proficient
    expect(masteryStageFromLevel(8)).toBe('proficient')
    // level 9 → score 90 → mastered
    expect(masteryStageFromLevel(9)).toBe('mastered')
    // level 10 → score 100 → mastered
    expect(masteryStageFromLevel(10)).toBe('mastered')
  })
})
