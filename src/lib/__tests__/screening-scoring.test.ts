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

const makeLog = (level: 1 | 2 | 3, correct: boolean | null): AdaptiveAnswerLog => ({
  itemId: `item-${Math.random()}`,
  clusterId: 'cluster-A',
  level,
  correct,
  durationMs: 5000,
})

describe('levelToAfb', () => {
  it('maps level 0 to null', () => expect(levelToAfb(0)).toBeNull())
  it('maps level 1 to "I"', () => expect(levelToAfb(1)).toBe('I'))
  it('maps level 2 to "II"', () => expect(levelToAfb(2)).toBe('II'))
  it('maps level 3 to "III"', () => expect(levelToAfb(3)).toBe('III'))
})

describe('requiredHits', () => {
  it('returns 1 for level 1', () => expect(requiredHits(1)).toBe(1))
  it('returns 1 for level 2', () => expect(requiredHits(2)).toBe(1))
  it('returns 2 for level 3 (lucky-guess protection)', () => expect(requiredHits(3)).toBe(2))
})

describe('correctOnLevel', () => {
  it('counts correct answers on the given level', () => {
    const log = [makeLog(1, true), makeLog(1, false), makeLog(2, true), makeLog(1, true)]
    expect(correctOnLevel(log, 1)).toBe(2)
    expect(correctOnLevel(log, 2)).toBe(1)
    expect(correctOnLevel(log, 3)).toBe(0)
  })

  it('ignores pending (null) answers', () => {
    const log = [makeLog(1, null), makeLog(1, true)]
    expect(correctOnLevel(log, 1)).toBe(1)
  })
})

describe('estimateLevel', () => {
  it('returns 0 for empty log', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('returns 1 when only 1 correct answer on level 1', () => {
    const log = [makeLog(1, true), makeLog(1, false)]
    expect(estimateLevel(log)).toBe(1)
  })

  it('returns 2 for 1 correct on level 2 with enough mastery', () => {
    const log = [makeLog(1, true), makeLog(2, true)]
    expect(estimateLevel(log)).toBe(2)
  })

  it('requires 2 correct on level 3 (no lucky guess)', () => {
    const log = [makeLog(3, true)]
    expect(estimateLevel(log)).toBeLessThan(3)
  })

  it('returns 3 when 2 correct on level 3', () => {
    const log = [makeLog(3, true), makeLog(3, true)]
    expect(estimateLevel(log)).toBe(3)
  })

  it('downgrades when mastery < 50% on estimated level', () => {
    // 1 correct + 3 wrong on level 2 → mastery 25% → downgrade to 1
    const log = [
      makeLog(1, true),
      makeLog(2, true),
      makeLog(2, false),
      makeLog(2, false),
      makeLog(2, false),
    ]
    expect(estimateLevel(log)).toBe(1)
  })
})

describe('confidenceFor', () => {
  it('returns "low" when too few answers', () => {
    const log = [makeLog(1, true)]
    expect(confidenceFor(1, 2, 1, log)).toBe('low')
  })

  it('returns "high" when ≥4 answered, no pending, level confirmed', () => {
    const log = [makeLog(1, true), makeLog(1, true), makeLog(1, true), makeLog(1, true)]
    expect(confidenceFor(4, 0, 1, log)).toBe('high')
  })

  it('returns "medium" for moderate coverage', () => {
    const log = [makeLog(1, true), makeLog(1, true), makeLog(1, false)]
    expect(confidenceFor(3, 1, 1, log)).toBe('medium')
  })

  it('returns "low" when too few answers to reach medium threshold', () => {
    const log = [makeLog(1, false)]
    expect(confidenceFor(1, 5, 0, log)).toBe('low')
  })
})

describe('summarizeLogs', () => {
  it('returns one summary per cluster', () => {
    const logs: AdaptiveAnswerLog[] = [
      { itemId: 'i1', clusterId: 'A', level: 1, correct: true, durationMs: 1000 },
      { itemId: 'i2', clusterId: 'B', level: 2, correct: false, durationMs: 1000 },
    ]
    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.clusterId)).toContain('A')
    expect(result.map(r => r.clusterId)).toContain('B')
  })

  it('preserves cluster order by first encounter', () => {
    const logs: AdaptiveAnswerLog[] = [
      { itemId: 'i1', clusterId: 'B', level: 1, correct: true, durationMs: 1000 },
      { itemId: 'i2', clusterId: 'A', level: 1, correct: true, durationMs: 1000 },
    ]
    const result = summarizeLogs(logs)
    expect(result[0].clusterId).toBe('B')
    expect(result[1].clusterId).toBe('A')
  })

  it('computes correct mastery ratio', () => {
    const logs: AdaptiveAnswerLog[] = [
      { itemId: 'i1', clusterId: 'A', level: 1, correct: true, durationMs: 1000 },
      { itemId: 'i2', clusterId: 'A', level: 1, correct: false, durationMs: 1000 },
    ]
    const [summary] = summarizeLogs(logs)
    expect(summary.mastery).toBeCloseTo(0.5)
    expect(summary.correct).toBe(1)
  })

  it('counts pending items', () => {
    const logs: AdaptiveAnswerLog[] = [
      { itemId: 'i1', clusterId: 'A', level: 1, correct: null, durationMs: 1000 },
      { itemId: 'i2', clusterId: 'A', level: 1, correct: true, durationMs: 1000 },
    ]
    const [summary] = summarizeLogs(logs)
    expect(summary.pending).toBe(1)
  })

  it('returns empty array for no logs', () => {
    expect(summarizeLogs([])).toEqual([])
  })
})
