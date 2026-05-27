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

function makeLog(overrides: Partial<AdaptiveAnswerLog> = {}): AdaptiveAnswerLog {
  return {
    itemId: 'item-1',
    clusterId: 'cluster-1',
    level: 1,
    correct: true,
    durationMs: 5000,
    ...overrides,
  }
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
  it('returns 2 for level 3 (AFB III lucky-guess protection)', () => {
    expect(requiredHits(3)).toBe(2)
  })

  it('returns 1 for level 1', () => {
    expect(requiredHits(1)).toBe(1)
  })

  it('returns 1 for level 2', () => {
    expect(requiredHits(2)).toBe(1)
  })
})

// ── correctOnLevel ───────────────────────────────────────────────────────────

describe('correctOnLevel', () => {
  it('returns 0 for empty log', () => {
    expect(correctOnLevel([], 1)).toBe(0)
  })

  it('counts only correct answers on the given level', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 2, correct: true }),
      makeLog({ level: 1, correct: true }),
    ]
    expect(correctOnLevel(log, 1)).toBe(2)
  })

  it('ignores null (pending) answers', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: null }),
    ]
    expect(correctOnLevel(log, 1)).toBe(1)
  })

  it('returns 0 when no answers on that level', () => {
    const log = [makeLog({ level: 2, correct: true })]
    expect(correctOnLevel(log, 1)).toBe(0)
  })
})

// ── estimateLevel ────────────────────────────────────────────────────────────

describe('estimateLevel', () => {
  it('returns 0 for empty log', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('returns 1 when only level 1 correct', () => {
    const log = [makeLog({ level: 1, correct: true })]
    expect(estimateLevel(log)).toBe(1)
  })

  it('returns 2 when level 2 has enough correct answers', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: true }),
    ]
    expect(estimateLevel(log)).toBe(2)
  })

  it('requires 2 correct for level 3', () => {
    const oneCorrect = [makeLog({ level: 3, correct: true })]
    const twoCorrect = [
      makeLog({ level: 3, correct: true }),
      makeLog({ level: 3, correct: true }),
    ]
    expect(estimateLevel(oneCorrect)).toBe(0)
    expect(estimateLevel(twoCorrect)).toBe(3)
  })

  it('downgrades when mastery < 50%', () => {
    // Level 2: 1 correct, 3 wrong → mastery = 25% < 50% → downgrade to 1
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: true }),
      makeLog({ level: 2, correct: false }),
      makeLog({ level: 2, correct: false }),
      makeLog({ level: 2, correct: false }),
    ]
    expect(estimateLevel(log)).toBe(1)
  })

  it('returns 0 for all wrong answers', () => {
    const log = [
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 2, correct: false }),
    ]
    expect(estimateLevel(log)).toBe(0)
  })
})

// ── confidenceFor ────────────────────────────────────────────────────────────

describe('confidenceFor', () => {
  it('returns "high" for 4+ answered, 0 pending, level > 0, correct on level', () => {
    const log = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: true }),
    ]
    expect(confidenceFor(4, 0, 1, log)).toBe('high')
  })

  it('returns "medium" for 2+ answered with few pending', () => {
    const log = [makeLog({ level: 1, correct: true }), makeLog({ level: 1, correct: true })]
    // 2 answered, 0 pending (pending ≤ max(1, floor(2/3)) = max(1,0) = 1)
    expect(confidenceFor(2, 0, 1, log)).toBe('medium')
  })

  it('returns "low" for 0 answered', () => {
    expect(confidenceFor(0, 5, 0, [])).toBe('low')
  })

  it('returns "medium" or "low" (never "high") when level is 0', () => {
    // level=0 prevents "high" from being returned
    const log = [makeLog({ level: 1, correct: false }), makeLog({ level: 1, correct: false }),
      makeLog({ level: 1, correct: false }), makeLog({ level: 1, correct: false })]
    const result = confidenceFor(4, 0, 0, log)
    expect(result).not.toBe('high')
  })
})

// ── summarizeLogs ────────────────────────────────────────────────────────────

describe('summarizeLogs', () => {
  it('returns empty array for empty log', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('groups by clusterId', () => {
    const logs = [
      makeLog({ clusterId: 'A', level: 1, correct: true }),
      makeLog({ clusterId: 'B', level: 2, correct: false }),
      makeLog({ clusterId: 'A', level: 1, correct: true }),
    ]
    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)
    expect(result.map(s => s.clusterId)).toContain('A')
    expect(result.map(s => s.clusterId)).toContain('B')
  })

  it('preserves first-contact order', () => {
    const logs = [
      makeLog({ clusterId: 'B', level: 1, correct: true }),
      makeLog({ clusterId: 'A', level: 1, correct: true }),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].clusterId).toBe('B')
    expect(result[1].clusterId).toBe('A')
  })

  it('counts correct answers per cluster', () => {
    const logs = [
      makeLog({ clusterId: 'A', level: 1, correct: true }),
      makeLog({ clusterId: 'A', level: 1, correct: false }),
      makeLog({ clusterId: 'A', level: 1, correct: true }),
    ]
    const [summary] = summarizeLogs(logs)
    expect(summary.correct).toBe(2)
    expect(summary.answered).toBe(3)
  })

  it('counts pending (null) answers', () => {
    const logs = [
      makeLog({ clusterId: 'A', level: 1, correct: true }),
      makeLog({ clusterId: 'A', level: 1, correct: null }),
    ]
    const [summary] = summarizeLogs(logs)
    expect(summary.pending).toBe(1)
  })

  it('has reachedAfb and estimatedLevel in output', () => {
    const logs = [makeLog({ clusterId: 'A', level: 1, correct: true })]
    const [summary] = summarizeLogs(logs)
    expect(summary).toHaveProperty('reachedAfb')
    expect(summary).toHaveProperty('estimatedLevel')
    expect(summary).toHaveProperty('confidence')
  })
})
