import { describe, it, expect } from 'vitest'
import {
  levelToAfb,
  requiredHits,
  correctOnLevel,
  estimateLevel,
  confidenceFor,
  summarizeLogs,
} from '../scoring'
import type { AdaptiveAnswerLog } from '../adaptive'
import type { ScreeningLevel } from '@/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeLog(
  level: ScreeningLevel,
  correct: boolean | null,
  itemId = 'item-1',
): AdaptiveAnswerLog {
  return { itemId, clusterId: 'cluster-1', level, correct, durationMs: 1000 }
}

// ── levelToAfb ───────────────────────────────────────────────────────────────

describe('levelToAfb', () => {
  it('maps 1 → "I"', () => expect(levelToAfb(1)).toBe('I'))
  it('maps 2 → "II"', () => expect(levelToAfb(2)).toBe('II'))
  it('maps 3 → "III"', () => expect(levelToAfb(3)).toBe('III'))
  it('maps 0 → null', () => expect(levelToAfb(0)).toBeNull())
})

// ── requiredHits ─────────────────────────────────────────────────────────────

describe('requiredHits', () => {
  it('returns 2 for AFB III (level 3)', () => expect(requiredHits(3)).toBe(2))
  it('returns 1 for AFB I (level 1)', () => expect(requiredHits(1)).toBe(1))
  it('returns 1 for AFB II (level 2)', () => expect(requiredHits(2)).toBe(1))
})

// ── correctOnLevel ────────────────────────────────────────────────────────────

describe('correctOnLevel', () => {
  it('counts correct answers on given level', () => {
    const log = [
      makeLog(1, true, 'a'),
      makeLog(1, false, 'b'),
      makeLog(1, true, 'c'),
      makeLog(2, true, 'd'),
    ]
    expect(correctOnLevel(log, 1)).toBe(2)
    expect(correctOnLevel(log, 2)).toBe(1)
  })

  it('ignores pending (null correct) items', () => {
    const log = [makeLog(1, null), makeLog(1, true)]
    expect(correctOnLevel(log, 1)).toBe(1)
  })

  it('returns 0 for empty log', () => {
    expect(correctOnLevel([], 1)).toBe(0)
  })
})

// ── estimateLevel ─────────────────────────────────────────────────────────────

describe('estimateLevel', () => {
  it('returns 0 for empty log', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('returns 1 when only level-1 has enough correct', () => {
    const log = [makeLog(1, true, 'a')]
    expect(estimateLevel(log)).toBe(1)
  })

  it('returns 2 when level-1 and level-2 both have 1 correct', () => {
    const log = [makeLog(1, true, 'a'), makeLog(2, true, 'b')]
    expect(estimateLevel(log)).toBe(2)
  })

  it('requires 2 correct for level 3', () => {
    // Only 1 correct on level 3 → should not reach level 3
    const log = [
      makeLog(1, true, 'a'),
      makeLog(2, true, 'b'),
      makeLog(3, true, 'c'),
      makeLog(3, false, 'd'),
    ]
    const lvl = estimateLevel(log)
    // mastery on level 3 = 1/2 = 0.5, exactly at boundary
    // only 1 correct < requiredHits(3)=2, so best stays at 2
    expect(lvl).toBe(2)
  })

  it('returns 3 when level 3 has 2 correct', () => {
    const log = [
      makeLog(1, true, 'a'),
      makeLog(2, true, 'b'),
      makeLog(3, true, 'c'),
      makeLog(3, true, 'd'),
    ]
    expect(estimateLevel(log)).toBe(3)
  })

  it('downgrades if mastery on best level < 50%', () => {
    // level 1: 1 correct out of 3 → mastery = 33% < 50% → downgrade from 1 to 0
    const log = [
      makeLog(1, true, 'a'),
      makeLog(1, false, 'b'),
      makeLog(1, false, 'c'),
    ]
    expect(estimateLevel(log)).toBe(0)
  })
})

// ── confidenceFor ─────────────────────────────────────────────────────────────

describe('confidenceFor', () => {
  it('returns "low" when not many answers', () => {
    expect(confidenceFor(1, 2, 1, [makeLog(1, true)])).toBe('low')
  })

  it('returns "high" when answered >= 4, pending = 0, level > 0', () => {
    const log = [
      makeLog(1, true, 'a'),
      makeLog(1, true, 'b'),
      makeLog(2, true, 'c'),
      makeLog(2, true, 'd'),
    ]
    expect(confidenceFor(4, 0, 2, log)).toBe('high')
  })

  it('returns "medium" when enough answered with few pending', () => {
    const log = [makeLog(1, true, 'a'), makeLog(1, true, 'b')]
    // answered=2, pending=0 (<= max(1, floor(2/3)=0) = 1)
    expect(confidenceFor(2, 0, 1, log)).toBe('medium')
  })
})

// ── summarizeLogs ─────────────────────────────────────────────────────────────

describe('summarizeLogs', () => {
  it('returns empty array for no logs', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('groups by clusterId', () => {
    const log = [
      { itemId: 'a', clusterId: 'c1', level: 1 as ScreeningLevel, correct: true, durationMs: 1000 },
      { itemId: 'b', clusterId: 'c2', level: 1 as ScreeningLevel, correct: false, durationMs: 1000 },
      { itemId: 'c', clusterId: 'c1', level: 2 as ScreeningLevel, correct: true, durationMs: 1000 },
    ]
    const result = summarizeLogs(log)
    expect(result).toHaveLength(2)
    const c1 = result.find((r) => r.clusterId === 'c1')!
    expect(c1.answered).toBe(2)
    expect(c1.correct).toBe(2)
  })

  it('preserves cluster encounter order', () => {
    const log = [
      { itemId: 'a', clusterId: 'z-cluster', level: 1 as ScreeningLevel, correct: true, durationMs: 500 },
      { itemId: 'b', clusterId: 'a-cluster', level: 1 as ScreeningLevel, correct: true, durationMs: 500 },
    ]
    const result = summarizeLogs(log)
    expect(result[0].clusterId).toBe('z-cluster')
    expect(result[1].clusterId).toBe('a-cluster')
  })

  it('counts pending items correctly', () => {
    const log = [
      { itemId: 'a', clusterId: 'c1', level: 1 as ScreeningLevel, correct: null, durationMs: 1000 },
      { itemId: 'b', clusterId: 'c1', level: 1 as ScreeningLevel, correct: true, durationMs: 1000 },
    ]
    const result = summarizeLogs(log)
    expect(result[0].pending).toBe(1)
    expect(result[0].correct).toBe(1)
  })

  it('computes mastery excluding pending', () => {
    const log = [
      { itemId: 'a', clusterId: 'c1', level: 1 as ScreeningLevel, correct: true, durationMs: 1000 },
      { itemId: 'b', clusterId: 'c1', level: 1 as ScreeningLevel, correct: false, durationMs: 1000 },
      { itemId: 'c', clusterId: 'c1', level: 1 as ScreeningLevel, correct: null, durationMs: 1000 },
    ]
    const result = summarizeLogs(log)
    // decided = 2, correct = 1 → mastery = 0.5
    expect(result[0].mastery).toBeCloseTo(0.5)
  })
})
