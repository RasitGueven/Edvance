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

function makeLog(
  overrides: Partial<AdaptiveAnswerLog> = {},
): AdaptiveAnswerLog {
  return {
    itemId: 'item-1',
    clusterId: 'cluster-1',
    level: 1,
    correct: true,
    durationMs: 5000,
    ...overrides,
  }
}

describe('levelToAfb', () => {
  it('maps level 1 to AFB I', () => {
    expect(levelToAfb(1)).toBe('I')
  })

  it('maps level 2 to AFB II', () => {
    expect(levelToAfb(2)).toBe('II')
  })

  it('maps level 3 to AFB III', () => {
    expect(levelToAfb(3)).toBe('III')
  })

  it('maps level 0 to null', () => {
    expect(levelToAfb(0)).toBeNull()
  })
})

describe('requiredHits', () => {
  it('requires 1 hit for level 1', () => {
    expect(requiredHits(1)).toBe(1)
  })

  it('requires 1 hit for level 2', () => {
    expect(requiredHits(2)).toBe(1)
  })

  it('requires 2 hits for level 3 (lucky-guess protection)', () => {
    expect(requiredHits(3)).toBe(2)
  })
})

describe('correctOnLevel', () => {
  it('counts correct answers on the given level', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 2, correct: true }),
      makeLog({ level: 1, correct: true }),
    ]
    expect(correctOnLevel(log, 1)).toBe(2)
    expect(correctOnLevel(log, 2)).toBe(1)
    expect(correctOnLevel(log, 3)).toBe(0)
  })

  it('ignores pending (null) answers', () => {
    const log = [
      makeLog({ level: 1, correct: null }),
      makeLog({ level: 1, correct: true }),
    ]
    expect(correctOnLevel(log, 1)).toBe(1)
  })

  it('returns 0 for empty log', () => {
    expect(correctOnLevel([], 1)).toBe(0)
  })
})

describe('estimateLevel', () => {
  it('returns 0 for empty log', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('returns 0 when no correct answers exist', () => {
    const log = [
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 2, correct: false }),
    ]
    expect(estimateLevel(log)).toBe(0)
  })

  it('returns level 1 for 1 correct on level 1', () => {
    const log = [makeLog({ level: 1, correct: true })]
    expect(estimateLevel(log)).toBe(1)
  })

  it('returns level 2 for 1 correct on level 2 (and level 1 satisfied)', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: true }),
    ]
    expect(estimateLevel(log)).toBe(2)
  })

  it('requires 2 correct on level 3 for AFB III lucky-guess protection', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: true }),
      makeLog({ level: 3, correct: true }), // only 1 correct on level 3
    ]
    // Only 1 correct on level 3, requiredHits(3)=2 → not confirmed → stays at level 2
    expect(estimateLevel(log)).toBe(2)
  })

  it('returns level 3 when 2 correct on level 3', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: true }),
      makeLog({ level: 3, correct: true }),
      makeLog({ level: 3, correct: true }),
    ]
    expect(estimateLevel(log)).toBe(3)
  })

  it('downgrades when mastery < 50% at estimated level', () => {
    // Level 1: 1 correct, 2 wrong → mastery = 1/3 ≈ 33% < 50% → downgrade to 0
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 1, correct: false }),
    ]
    expect(estimateLevel(log)).toBe(0)
  })

  it('does not downgrade when mastery >= 50%', () => {
    // Level 1: 2 correct, 1 wrong → mastery = 2/3 ≈ 66% >= 50% → stays at 1
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: false }),
    ]
    expect(estimateLevel(log)).toBe(1)
  })
})

describe('confidenceFor', () => {
  it('returns high when >= 4 answered, 0 pending, level > 0, >=1 correct', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 1, correct: false }),
    ]
    expect(confidenceFor(4, 0, 1, log)).toBe('high')
  })

  it('returns low for empty log', () => {
    expect(confidenceFor(0, 0, 0, [])).toBe('low')
  })

  it('returns medium for 2+ answered with few pending', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
    ]
    expect(confidenceFor(2, 0, 1, log)).toBe('medium')
  })

  it('returns low when too many pending relative to answered', () => {
    const log = [makeLog()]
    expect(confidenceFor(2, 5, 1, log)).toBe('low')
  })

  it('returns medium when enough answered with few pending (regardless of estimatedLevel)', () => {
    // The medium condition: answered>=2 && pending<=max(1, floor(4/3)=1) → true
    // estimatedLevel=0 only affects the "high" threshold, not "medium"
    const log = [
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 1, correct: false }),
    ]
    expect(confidenceFor(4, 0, 0, log)).toBe('medium')
  })
})

describe('summarizeLogs', () => {
  it('returns empty array for empty log', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('groups by clusterId preserving encounter order', () => {
    const log = [
      makeLog({ clusterId: 'cluster-A', level: 1, correct: true }),
      makeLog({ clusterId: 'cluster-B', level: 1, correct: false }),
      makeLog({ clusterId: 'cluster-A', level: 2, correct: true }),
    ]
    const summaries = summarizeLogs(log)
    expect(summaries).toHaveLength(2)
    expect(summaries[0].clusterId).toBe('cluster-A')
    expect(summaries[1].clusterId).toBe('cluster-B')
  })

  it('counts correct and pending correctly', () => {
    const log = [
      makeLog({ clusterId: 'c1', level: 1, correct: true }),
      makeLog({ clusterId: 'c1', level: 1, correct: false }),
      makeLog({ clusterId: 'c1', level: 2, correct: null }),
    ]
    const [summary] = summarizeLogs(log)
    expect(summary.correct).toBe(1)
    expect(summary.pending).toBe(1)
    expect(summary.answered).toBe(3)
  })

  it('computes mastery excluding pending', () => {
    const log = [
      makeLog({ clusterId: 'c1', level: 1, correct: true }),
      makeLog({ clusterId: 'c1', level: 1, correct: true }),
      makeLog({ clusterId: 'c1', level: 1, correct: null }),
    ]
    const [summary] = summarizeLogs(log)
    // decided = 2, correct = 2 → mastery = 1.0
    expect(summary.mastery).toBe(1)
  })

  it('sets mastery to 0 when no decided items', () => {
    const log = [
      makeLog({ clusterId: 'c1', level: 1, correct: null }),
    ]
    const [summary] = summarizeLogs(log)
    expect(summary.mastery).toBe(0)
  })

  it('correctly derives reachedAfb from estimatedLevel', () => {
    const log = [
      makeLog({ clusterId: 'c1', level: 1, correct: true }),
      makeLog({ clusterId: 'c1', level: 1, correct: true }),
      makeLog({ clusterId: 'c1', level: 2, correct: true }),
    ]
    const [summary] = summarizeLogs(log)
    expect(summary.estimatedLevel).toBe(2)
    expect(summary.reachedAfb).toBe('II')
  })
})
