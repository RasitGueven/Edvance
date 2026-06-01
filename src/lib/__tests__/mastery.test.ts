import { describe, it, expect } from 'vitest'
import { masteryStage, masteryStageFromLevel } from '@/lib/mastery'
import type { MasteryStage } from '@/lib/mastery'

describe('masteryStage', () => {
  const cases: [number, MasteryStage][] = [
    [0, 'introduced'],
    [39, 'introduced'],
    [40, 'developing'],
    [59, 'developing'],
    [60, 'progressing'],
    [74, 'progressing'],
    [75, 'proficient'],
    [84, 'proficient'],
    [85, 'mastered'],
    [100, 'mastered'],
  ]

  it.each(cases)('score %i → %s', (score, expected) => {
    expect(masteryStage(score)).toBe(expected)
  })
})

describe('masteryStageFromLevel', () => {
  it('converts level 10 → mastered (score 100)', () => {
    expect(masteryStageFromLevel(10)).toBe('mastered')
  })

  it('converts level 8 → proficient (score 80)', () => {
    expect(masteryStageFromLevel(8)).toBe('proficient')
  })

  it('converts level 6 → progressing (score 60)', () => {
    expect(masteryStageFromLevel(6)).toBe('progressing')
  })

  it('converts level 4 → developing (score 40)', () => {
    expect(masteryStageFromLevel(4)).toBe('developing')
  })

  it('converts level 1 → introduced (score 10)', () => {
    expect(masteryStageFromLevel(1)).toBe('introduced')
  })
})
