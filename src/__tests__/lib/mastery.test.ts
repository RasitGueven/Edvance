import { describe, it, expect } from 'vitest'
import { masteryStage, masteryStageFromLevel } from '@/lib/mastery'

describe('masteryStage', () => {
  describe('introduced (< 40)', () => {
    it('0 → introduced', () => {
      expect(masteryStage(0)).toBe('introduced')
    })

    it('39 → introduced', () => {
      expect(masteryStage(39)).toBe('introduced')
    })
  })

  describe('developing (40..59)', () => {
    it('40 → developing', () => {
      expect(masteryStage(40)).toBe('developing')
    })

    it('59 → developing', () => {
      expect(masteryStage(59)).toBe('developing')
    })
  })

  describe('progressing (60..74)', () => {
    it('60 → progressing', () => {
      expect(masteryStage(60)).toBe('progressing')
    })

    it('74 → progressing', () => {
      expect(masteryStage(74)).toBe('progressing')
    })
  })

  describe('proficient (75..84)', () => {
    it('75 → proficient', () => {
      expect(masteryStage(75)).toBe('proficient')
    })

    it('84 → proficient', () => {
      expect(masteryStage(84)).toBe('proficient')
    })
  })

  describe('mastered (≥ 85)', () => {
    it('85 → mastered', () => {
      expect(masteryStage(85)).toBe('mastered')
    })

    it('100 → mastered', () => {
      expect(masteryStage(100)).toBe('mastered')
    })
  })
})

describe('masteryStageFromLevel', () => {
  it('level 0 → introduced (score 0)', () => {
    expect(masteryStageFromLevel(0)).toBe('introduced')
  })

  it('level 4 → developing (score 40)', () => {
    expect(masteryStageFromLevel(4)).toBe('developing')
  })

  it('level 6 → progressing (score 60)', () => {
    expect(masteryStageFromLevel(6)).toBe('progressing')
  })

  it('level 7.5 → proficient (score 75)', () => {
    expect(masteryStageFromLevel(7.5)).toBe('proficient')
  })

  it('level 8.5 → mastered (score 85)', () => {
    expect(masteryStageFromLevel(8.5)).toBe('mastered')
  })

  it('level 10 → mastered (score 100)', () => {
    expect(masteryStageFromLevel(10)).toBe('mastered')
  })
})
