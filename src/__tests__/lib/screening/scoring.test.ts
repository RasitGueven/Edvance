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

type LogEntry = { itemId: string; clusterId: string; level: 1|2|3; correct: boolean|null; durationMs: number }

function makeLog(entries: LogEntry[]): AdaptiveAnswerLog[] {
  return entries as AdaptiveAnswerLog[]
}

describe('levelToAfb', () => {
  it('0 → null', () => expect(levelToAfb(0)).toBeNull())
  it('1 → I', () => expect(levelToAfb(1)).toBe('I'))
  it('2 → II', () => expect(levelToAfb(2)).toBe('II'))
  it('3 → III', () => expect(levelToAfb(3)).toBe('III'))
})

describe('requiredHits', () => {
  it('level 1 → 1', () => expect(requiredHits(1)).toBe(1))
  it('level 2 → 1', () => expect(requiredHits(2)).toBe(1))
  it('level 3 → 2', () => expect(requiredHits(3)).toBe(2))
})

describe('correctOnLevel', () => {
  const log = makeLog([
    { itemId: 'a', clusterId: 'c1', level: 1, correct: true, durationMs: 1000 },
    { itemId: 'b', clusterId: 'c1', level: 1, correct: false, durationMs: 1000 },
    { itemId: 'c', clusterId: 'c1', level: 2, correct: true, durationMs: 1000 },
    { itemId: 'd', clusterId: 'c1', level: 2, correct: null, durationMs: 1000 },
    { itemId: 'e', clusterId: 'c1', level: 3, correct: true, durationMs: 1000 },
  ])

  it('counts only correct=true for given level', () => {
    expect(correctOnLevel(log, 1)).toBe(1)
    expect(correctOnLevel(log, 2)).toBe(1)
    expect(correctOnLevel(log, 3)).toBe(1)
  })

  it('ignores null and false for counting', () => {
    expect(correctOnLevel(makeLog([
      { itemId: 'x', clusterId: 'c', level: 1, correct: null, durationMs: 0 },
      { itemId: 'y', clusterId: 'c', level: 1, correct: false, durationMs: 0 },
    ]), 1)).toBe(0)
  })
})

describe('estimateLevel', () => {
  it('empty log → 0', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('all wrong → 0', () => {
    const log = makeLog([
      { itemId: 'a', clusterId: 'c', level: 1, correct: false, durationMs: 0 },
      { itemId: 'b', clusterId: 'c', level: 2, correct: false, durationMs: 0 },
    ])
    expect(estimateLevel(log)).toBe(0)
  })

  it('1 correct at L1 → 1', () => {
    const log = makeLog([
      { itemId: 'a', clusterId: 'c', level: 1, correct: true, durationMs: 0 },
    ])
    expect(estimateLevel(log)).toBe(1)
  })

  it('2 correct at L3 → 3', () => {
    const log = makeLog([
      { itemId: 'a', clusterId: 'c', level: 3, correct: true, durationMs: 0 },
      { itemId: 'b', clusterId: 'c', level: 3, correct: true, durationMs: 0 },
    ])
    expect(estimateLevel(log)).toBe(3)
  })

  it('mastery < 50% on best level triggers downgrade', () => {
    // 1 correct + 2 false at L2 → mastery = 1/3 < 0.5 → downgrade to L1
    // Also need 1 correct at L1 so best=2 first
    const log = makeLog([
      { itemId: 'a', clusterId: 'c', level: 1, correct: true, durationMs: 0 },
      { itemId: 'b', clusterId: 'c', level: 2, correct: true, durationMs: 0 },
      { itemId: 'c', clusterId: 'c', level: 2, correct: false, durationMs: 0 },
      { itemId: 'd', clusterId: 'c', level: 2, correct: false, durationMs: 0 },
    ])
    // best=2 (has 1 correct at L2 which >= requiredHits(2)=1)
    // mastery at L2 = 1/3 < 0.5 → downgrade to 1
    expect(estimateLevel(log)).toBe(1)
  })
})

describe('confidenceFor', () => {
  it('returns high when answered≥4, pending=0, estimatedLevel>0, correct≥1 on level', () => {
    const log = makeLog([
      { itemId: 'a', clusterId: 'c', level: 2, correct: true, durationMs: 0 },
      { itemId: 'b', clusterId: 'c', level: 2, correct: true, durationMs: 0 },
      { itemId: 'c', clusterId: 'c', level: 2, correct: true, durationMs: 0 },
      { itemId: 'd', clusterId: 'c', level: 2, correct: true, durationMs: 0 },
    ])
    expect(confidenceFor(4, 0, 2, log)).toBe('high')
  })

  it('returns medium when answered≥2 and pending within floor(answered/3)', () => {
    const log = makeLog([
      { itemId: 'a', clusterId: 'c', level: 1, correct: true, durationMs: 0 },
      { itemId: 'b', clusterId: 'c', level: 1, correct: true, durationMs: 0 },
    ])
    expect(confidenceFor(2, 0, 1, log)).toBe('medium')
  })

  it('returns low for insufficient data', () => {
    expect(confidenceFor(1, 5, 0, [])).toBe('low')
  })

  it('returns low when answered<4 and pending>threshold', () => {
    const log = makeLog([
      { itemId: 'a', clusterId: 'c', level: 1, correct: true, durationMs: 0 },
    ])
    expect(confidenceFor(1, 3, 1, log)).toBe('low')
  })

  it('high requires estimatedLevel>0', () => {
    const log = makeLog([
      { itemId: 'a', clusterId: 'c', level: 1, correct: true, durationMs: 0 },
      { itemId: 'b', clusterId: 'c', level: 1, correct: true, durationMs: 0 },
      { itemId: 'c', clusterId: 'c', level: 1, correct: true, durationMs: 0 },
      { itemId: 'd', clusterId: 'c', level: 1, correct: true, durationMs: 0 },
    ])
    expect(confidenceFor(4, 0, 0, log)).toBe('medium')
  })
})

describe('summarizeLogs', () => {
  it('groups by cluster, computes mastery, reachedAfb, confidence correctly', () => {
    const logs = makeLog([
      { itemId: 'a', clusterId: 'c1', level: 1, correct: true, durationMs: 0 },
      { itemId: 'b', clusterId: 'c1', level: 1, correct: false, durationMs: 0 },
      { itemId: 'c', clusterId: 'c2', level: 2, correct: true, durationMs: 0 },
      { itemId: 'd', clusterId: 'c2', level: 2, correct: null, durationMs: 0 },
    ])

    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)

    const c1 = result.find(r => r.clusterId === 'c1')!
    expect(c1.answered).toBe(2)
    expect(c1.correct).toBe(1)
    expect(c1.pending).toBe(0)
    // decided=2, mastery = 1/2 = 0.5
    expect(c1.mastery).toBe(0.5)
    // estimateLevel: 1 correct at L1 >= 1, mastery=0.5 >= 0.5 → level 1
    expect(c1.estimatedLevel).toBe(1)
    expect(c1.reachedAfb).toBe('I')

    const c2 = result.find(r => r.clusterId === 'c2')!
    expect(c2.pending).toBe(1)
    // decided = 2 - 1 = 1, mastery = 1/1 = 1.0
    expect(c2.mastery).toBe(1)
    expect(c2.estimatedLevel).toBe(2)
    expect(c2.reachedAfb).toBe('II')
  })

  it('returns empty array for empty log', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('cluster order matches first contact order', () => {
    const logs = makeLog([
      { itemId: 'x', clusterId: 'second', level: 1, correct: true, durationMs: 0 },
      { itemId: 'y', clusterId: 'first', level: 1, correct: true, durationMs: 0 },
    ])
    const result = summarizeLogs(logs)
    expect(result[0].clusterId).toBe('second')
    expect(result[1].clusterId).toBe('first')
  })

  it('mastery is 0 when all entries are pending', () => {
    const logs = makeLog([
      { itemId: 'a', clusterId: 'c', level: 1, correct: null, durationMs: 0 },
    ])
    const result = summarizeLogs(logs)
    expect(result[0].mastery).toBe(0)
  })
})
