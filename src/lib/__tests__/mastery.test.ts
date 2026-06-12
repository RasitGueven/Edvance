import { describe, it, expect } from 'vitest'
import {
  masteryStage,
  masteryStageFromLevel,
  MASTERY_STAGE_LABEL,
  MASTERY_STAGE_COLOR,
  MASTERY_STAGES,
} from '../mastery'

describe('masteryStage', () => {
  it('returns mastered for score >= 85', () => {
    expect(masteryStage(85)).toBe('mastered')
    expect(masteryStage(100)).toBe('mastered')
    expect(masteryStage(90)).toBe('mastered')
  })

  it('returns proficient for 75 <= score < 85', () => {
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(84)).toBe('proficient')
    expect(masteryStage(80)).toBe('proficient')
  })

  it('returns progressing for 60 <= score < 75', () => {
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(74)).toBe('progressing')
    expect(masteryStage(67)).toBe('progressing')
  })

  it('returns developing for 40 <= score < 60', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(59)).toBe('developing')
    expect(masteryStage(50)).toBe('developing')
  })

  it('returns introduced for score < 40', () => {
    expect(masteryStage(0)).toBe('introduced')
    expect(masteryStage(39)).toBe('introduced')
    expect(masteryStage(20)).toBe('introduced')
  })

  it('handles boundary values exactly', () => {
    expect(masteryStage(84)).toBe('proficient')
    expect(masteryStage(85)).toBe('mastered')
    expect(masteryStage(74)).toBe('progressing')
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(59)).toBe('developing')
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(39)).toBe('introduced')
    expect(masteryStage(40)).toBe('developing')
  })
})

describe('masteryStageFromLevel', () => {
  it('converts level to stage via level * 10', () => {
    // level * 10 maps to: 9→90→mastered, 8→80→proficient, 7→70→progressing,
    // 6→60→progressing, 5→50→developing, 3→30→introduced, 2→20→introduced
    expect(masteryStageFromLevel(9)).toBe('mastered')
    expect(masteryStageFromLevel(8)).toBe('proficient')
    expect(masteryStageFromLevel(7)).toBe('progressing') // 70 < 75 → progressing
    expect(masteryStageFromLevel(6)).toBe('progressing') // 60 >= 60
    expect(masteryStageFromLevel(5)).toBe('developing')  // 50 >= 40
    expect(masteryStageFromLevel(3)).toBe('introduced')  // 30 < 40
    expect(masteryStageFromLevel(2)).toBe('introduced')  // 20 < 40
    expect(masteryStageFromLevel(1)).toBe('introduced')  // 10 < 40
  })

  it('level 10 is mastered', () => {
    expect(masteryStageFromLevel(10)).toBe('mastered')
  })
})

describe('MASTERY_STAGE_LABEL', () => {
  it('has a label for every stage', () => {
    for (const stage of MASTERY_STAGES) {
      expect(MASTERY_STAGE_LABEL[stage]).toBeTruthy()
    }
  })

  it('labels are in German', () => {
    expect(MASTERY_STAGE_LABEL.mastered).toBe('Gemeistert')
    expect(MASTERY_STAGE_LABEL.proficient).toBe('Sicher')
    expect(MASTERY_STAGE_LABEL.progressing).toBe('Fortschritt')
    expect(MASTERY_STAGE_LABEL.developing).toBe('In Entwicklung')
    expect(MASTERY_STAGE_LABEL.introduced).toBe('Eingeführt')
  })
})

describe('MASTERY_STAGE_COLOR', () => {
  it('has a CSS variable for every stage', () => {
    for (const stage of MASTERY_STAGES) {
      expect(MASTERY_STAGE_COLOR[stage]).toMatch(/^var\(--/)
    }
  })
})

describe('MASTERY_STAGES', () => {
  it('has exactly 5 stages in ascending order', () => {
    expect(MASTERY_STAGES).toHaveLength(5)
    expect(MASTERY_STAGES[0]).toBe('introduced')
    expect(MASTERY_STAGES[4]).toBe('mastered')
  })
})
