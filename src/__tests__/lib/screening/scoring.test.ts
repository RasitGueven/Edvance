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

function makeLog(
  level: 1 | 2 | 3,
  correct: boolean | null,
  clusterId = 'c1',
  itemId = `item-${Math.random()}`,
): AdaptiveAnswerLog {
  return { itemId, clusterId, level, correct, durationMs: 10_000 }
}

describe('levelToAfb', () => {
  it('maps levels to AFB labels', () => {
    expect(levelToAfb(1)).toBe('I')
    expect(levelToAfb(2)).toBe('II')
    expect(levelToAfb(3)).toBe('III')
  })

  it('returns null for 0', () => {
    expect(levelToAfb(0)).toBeNull()
  })
})

describe('requiredHits', () => {
  it('requires 2 hits for level 3 (lucky-guess protection)', () => {
    expect(requiredHits(3)).toBe(2)
  })

  it('requires 1 hit for levels 1 and 2', () => {
    expect(requiredHits(1)).toBe(1)
    expect(requiredHits(2)).toBe(1)
  })
})

describe('correctOnLevel', () => {
  const log = [
    makeLog(1, true),
    makeLog(1, false),
    makeLog(2, true),
    makeLog(2, null),  // unanswered
    makeLog(3, true),
    makeLog(3, true),
  ]

  it('counts correct answers on level 1', () => {
    expect(correctOnLevel(log, 1)).toBe(1)
  })

  it('counts correct answers on level 2', () => {
    expect(correctOnLevel(log, 2)).toBe(1)
  })

  it('counts correct answers on level 3', () => {
    expect(correctOnLevel(log, 3)).toBe(2)
  })

  it('returns 0 for level with no entries', () => {
    expect(correctOnLevel([], 1)).toBe(0)
  })

  it('does not count null (unanswered) as correct', () => {
    const logWithNull = [makeLog(1, null), makeLog(1, null)]
    expect(correctOnLevel(logWithNull, 1)).toBe(0)
  })
})

describe('estimateLevel', () => {
  it('returns 0 for empty log', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('estimates level 1 when only L1 correct', () => {
    const log = [makeLog(1, true), makeLog(2, false)]
    expect(estimateLevel(log)).toBe(1)
  })

  it('estimates level 2 when L2 correct (1 hit needed)', () => {
    const log = [makeLog(1, true), makeLog(2, true)]
    expect(estimateLevel(log)).toBe(2)
  })

  it('estimates level 3 when 2 L3 correct', () => {
    const log = [makeLog(3, true), makeLog(3, true), makeLog(1, true)]
    expect(estimateLevel(log)).toBe(3)
  })

  it('does NOT reach level 3 with only 1 correct on L3 (lucky-guess protection)', () => {
    const log = [makeLog(3, true), makeLog(3, false)]
    // 1 correct on L3 < requiredHits(3)=2, so best stays at 0
    expect(estimateLevel(log)).toBe(0)
  })

  it('downgrades when mastery on best level < 50%', () => {
    // L2: 1 correct, 2 wrong → mastery 1/3 < 50% → downgrade to L1
    const log = [
      makeLog(1, true),
      makeLog(2, true),
      makeLog(2, false),
      makeLog(2, false),
    ]
    expect(estimateLevel(log)).toBe(1)
  })
})

describe('confidenceFor', () => {
  it('returns "low" for few answers or many pending', () => {
    expect(confidenceFor(1, 5, 1, [])).toBe('low')
  })

  it('returns "medium" when answered >= 2 and pending is small fraction', () => {
    const log = [makeLog(1, true), makeLog(1, true)]
    expect(confidenceFor(2, 0, 1, log)).toBe('medium')
  })

  it('returns "high" when answered >= 4, no pending, level > 0, and has correct on that level', () => {
    const log = [
      makeLog(2, true),
      makeLog(2, true),
      makeLog(2, false),
      makeLog(2, false),
    ]
    expect(confidenceFor(4, 0, 2, log)).toBe('high')
  })

  it('returns "low" for level 0 with only 1 answer', () => {
    expect(confidenceFor(1, 5, 0, [])).toBe('low')
  })

  it('can return "medium" at level 0 if enough answers and few pending', () => {
    // level 0 only blocks "high" — medium still possible
    expect(confidenceFor(5, 0, 0, [])).toBe('medium')
  })
})

describe('summarizeLogs', () => {
  it('returns empty array for empty logs', () => {
    expect(summarizeLogs([])).toHaveLength(0)
  })

  it('groups by clusterId correctly', () => {
    const logs = [
      makeLog(1, true, 'c1'),
      makeLog(2, false, 'c1'),
      makeLog(1, true, 'c2'),
    ]
    const summary = summarizeLogs(logs)
    expect(summary).toHaveLength(2)
    const c1 = summary.find((s) => s.clusterId === 'c1')
    expect(c1).toBeDefined()
    expect(c1?.answered).toBe(2)
    expect(c1?.correct).toBe(1)
  })

  it('preserves encounter order', () => {
    const logs = [
      makeLog(1, true, 'c2'),
      makeLog(1, true, 'c1'),
    ]
    const summary = summarizeLogs(logs)
    expect(summary[0].clusterId).toBe('c2')
    expect(summary[1].clusterId).toBe('c1')
  })

  it('calculates mastery as correct / decided', () => {
    const logs = [
      makeLog(1, true, 'c1'),
      makeLog(1, true, 'c1'),
      makeLog(1, false, 'c1'),
    ]
    const summary = summarizeLogs(logs)
    expect(summary[0].mastery).toBeCloseTo(2 / 3)
  })

  it('counts pending (null) separately from decided', () => {
    const logs = [
      makeLog(1, true, 'c1'),
      makeLog(1, null, 'c1'),
    ]
    const summary = summarizeLogs(logs)
    expect(summary[0].pending).toBe(1)
    expect(summary[0].answered).toBe(2)
    expect(summary[0].mastery).toBe(1)  // 1 correct / 1 decided
  })

  it('reports reachedAfb correctly', () => {
    const logs = [makeLog(2, true, 'c1'), makeLog(2, true, 'c1')]
    const summary = summarizeLogs(logs)
    expect(summary[0].reachedAfb).toBe('II')
  })
})
