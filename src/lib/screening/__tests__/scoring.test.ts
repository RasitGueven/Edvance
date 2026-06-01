import { describe, it, expect } from 'vitest'
import {
  levelToAfb,
  requiredHits,
  correctOnLevel,
  estimateLevel,
  confidenceFor,
  summarizeLogs,
} from '@/lib/screening/scoring'
import type { AdaptiveAnswerLog } from '@/lib/screening/adaptive'
import type { ScreeningLevel } from '@/types'

function makeLog(
  overrides: Partial<AdaptiveAnswerLog> & { level: ScreeningLevel; correct: boolean | null },
): AdaptiveAnswerLog {
  return {
    itemId: 'item-1',
    clusterId: 'cluster-1',
    durationMs: 5000,
    ...overrides,
  }
}

describe('levelToAfb', () => {
  it('maps 1 → I', () => expect(levelToAfb(1)).toBe('I'))
  it('maps 2 → II', () => expect(levelToAfb(2)).toBe('II'))
  it('maps 3 → III', () => expect(levelToAfb(3)).toBe('III'))
  it('maps 0 → null', () => expect(levelToAfb(0)).toBeNull())
})

describe('requiredHits', () => {
  it('returns 1 for level 1', () => expect(requiredHits(1)).toBe(1))
  it('returns 1 for level 2', () => expect(requiredHits(2)).toBe(1))
  it('returns 2 for level 3 (lucky-guess protection)', () => expect(requiredHits(3)).toBe(2))
})

describe('correctOnLevel', () => {
  const log = [
    makeLog({ level: 1, correct: true }),
    makeLog({ level: 1, correct: false }),
    makeLog({ level: 2, correct: true }),
    makeLog({ level: 2, correct: null }),
    makeLog({ level: 3, correct: true }),
    makeLog({ level: 3, correct: true }),
  ]

  it('counts correct on level 1', () => expect(correctOnLevel(log, 1)).toBe(1))
  it('counts correct on level 2', () => expect(correctOnLevel(log, 2)).toBe(1))
  it('counts correct on level 3', () => expect(correctOnLevel(log, 3)).toBe(2))
  it('ignores null (pending) answers', () => {
    expect(correctOnLevel(log, 2)).toBe(1) // null not counted
  })
})

describe('estimateLevel', () => {
  it('returns 0 for empty log', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('returns 1 when only level 1 is correct', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: false }),
    ]
    expect(estimateLevel(log)).toBe(1)
  })

  it('returns 3 when 2 correct on level 3', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: true }),
      makeLog({ level: 3, correct: true }),
      makeLog({ level: 3, correct: true }),
    ]
    expect(estimateLevel(log)).toBe(3)
  })

  it('does not promote to level 3 with only 1 correct (lucky-guess)', () => {
    const log = [
      makeLog({ level: 3, correct: true }),
      makeLog({ level: 3, correct: false }),
    ]
    const result = estimateLevel(log)
    expect(result).toBeLessThan(3)
  })

  it('downgrades when mastery on best level < 50%', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: true }),
      makeLog({ level: 2, correct: false }),
      makeLog({ level: 2, correct: false }),
    ]
    const result = estimateLevel(log)
    expect(result).toBeLessThanOrEqual(1)
  })
})

describe('confidenceFor', () => {
  it('returns "low" for few answered items', () => {
    const result = confidenceFor(1, 5, 1, [])
    expect(result).toBe('low')
  })

  it('returns "high" when ≥4 answered, 0 pending, level>0 with 1 correct', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
    ]
    const result = confidenceFor(4, 0, 1, log)
    expect(result).toBe('high')
  })

  it('returns "medium" for moderate progress', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
    ]
    const result = confidenceFor(2, 0, 1, log)
    expect(result).toBe('medium')
  })
})

describe('summarizeLogs', () => {
  it('returns empty array for empty log', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('groups logs by clusterId', () => {
    const logs = [
      makeLog({ clusterId: 'c1', level: 1, correct: true }),
      makeLog({ clusterId: 'c2', level: 1, correct: false }),
      makeLog({ clusterId: 'c1', level: 2, correct: true }),
    ]
    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)
    const c1 = result.find((r) => r.clusterId === 'c1')
    expect(c1?.answered).toBe(2)
    expect(c1?.correct).toBe(2)
  })

  it('preserves first-encounter order', () => {
    const logs = [
      makeLog({ itemId: 'i1', clusterId: 'c2', level: 1, correct: true }),
      makeLog({ itemId: 'i2', clusterId: 'c1', level: 1, correct: true }),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].clusterId).toBe('c2')
    expect(result[1].clusterId).toBe('c1')
  })

  it('counts pending (null) answers', () => {
    const logs = [
      makeLog({ clusterId: 'c1', level: 1, correct: null }),
      makeLog({ clusterId: 'c1', level: 1, correct: true }),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].pending).toBe(1)
  })

  it('computes mastery as correct / decided (ignoring pending)', () => {
    const logs = [
      makeLog({ clusterId: 'c1', level: 1, correct: true }),
      makeLog({ clusterId: 'c1', level: 1, correct: false }),
      makeLog({ clusterId: 'c1', level: 1, correct: null }),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].mastery).toBeCloseTo(0.5)
  })

  it('sets reachedAfb based on estimatedLevel', () => {
    const logs = [
      makeLog({ clusterId: 'c1', level: 1, correct: true }),
      makeLog({ clusterId: 'c1', level: 2, correct: true }),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].reachedAfb).toBe('II')
    expect(result[0].estimatedLevel).toBe(2)
  })
})
