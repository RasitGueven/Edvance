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

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeLog(
  level: 1 | 2 | 3,
  correct: boolean | null,
  clusterId = 'cluster-1',
  itemId = 'item-1',
): AdaptiveAnswerLog {
  return { clusterId, itemId, level, correct, durationMs: 5000 }
}

// ── levelToAfb ────────────────────────────────────────────────────────────────

describe('levelToAfb', () => {
  it('maps 1 → I', () => expect(levelToAfb(1)).toBe('I'))
  it('maps 2 → II', () => expect(levelToAfb(2)).toBe('II'))
  it('maps 3 → III', () => expect(levelToAfb(3)).toBe('III'))
  it('maps 0 → null', () => expect(levelToAfb(0)).toBeNull())
})

// ── requiredHits ──────────────────────────────────────────────────────────────

describe('requiredHits', () => {
  it('requires 1 hit for level 1', () => expect(requiredHits(1)).toBe(1))
  it('requires 1 hit for level 2', () => expect(requiredHits(2)).toBe(1))
  it('requires 2 hits for level 3 (lucky-guess protection)', () => expect(requiredHits(3)).toBe(2))
})

// ── correctOnLevel ────────────────────────────────────────────────────────────

describe('correctOnLevel', () => {
  it('counts correct answers on specified level', () => {
    const log = [
      makeLog(1, true),
      makeLog(1, false),
      makeLog(2, true),
      makeLog(1, true),
    ]
    expect(correctOnLevel(log, 1)).toBe(2)
    expect(correctOnLevel(log, 2)).toBe(1)
    expect(correctOnLevel(log, 3)).toBe(0)
  })

  it('excludes pending (null) answers', () => {
    const log = [makeLog(1, null), makeLog(1, true)]
    expect(correctOnLevel(log, 1)).toBe(1)
  })
})

// ── estimateLevel ────────────────────────────────────────────────────────────

describe('estimateLevel', () => {
  it('returns 0 for empty log', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('returns 0 when no level has enough hits', () => {
    const log = [makeLog(1, false)]
    expect(estimateLevel(log)).toBe(0)
  })

  it('returns 1 for one correct answer at level 1', () => {
    const log = [makeLog(1, true)]
    expect(estimateLevel(log)).toBe(1)
  })

  it('returns 2 for correct at level 2', () => {
    const log = [makeLog(1, true), makeLog(2, true)]
    expect(estimateLevel(log)).toBe(2)
  })

  it('requires 2 correct answers for level 3', () => {
    const log = [makeLog(3, true)]
    expect(estimateLevel(log)).not.toBe(3)
  })

  it('returns 3 for two correct answers at level 3', () => {
    const log = [makeLog(3, true), makeLog(3, true)]
    expect(estimateLevel(log)).toBe(3)
  })

  it('downgrades when mastery on best level < 50%', () => {
    // 1 correct, 3 wrong at level 2 → mastery = 25% → downgrade to 1
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

// ── confidenceFor ────────────────────────────────────────────────────────────

describe('confidenceFor', () => {
  it('returns "low" for fresh empty session', () => {
    expect(confidenceFor(0, 0, 0, [])).toBe('low')
  })

  it('returns "high" for ≥4 answered, 0 pending, estimatedLevel > 0, and correct hit', () => {
    const log = [
      makeLog(2, true),
      makeLog(2, true),
      makeLog(2, true),
      makeLog(2, true),
    ]
    expect(confidenceFor(4, 0, 2, log)).toBe('high')
  })

  it('returns "medium" for ≥2 answered with few pending', () => {
    const log = [makeLog(1, true), makeLog(1, true), makeLog(1, true)]
    expect(confidenceFor(3, 1, 1, log)).toBe('medium')
  })

  it('returns "low" when too many items still pending', () => {
    const log = [makeLog(1, true), makeLog(1, true)]
    expect(confidenceFor(2, 10, 1, log)).toBe('low')
  })
})

// ── summarizeLogs ─────────────────────────────────────────────────────────────

describe('summarizeLogs', () => {
  it('returns empty array for empty logs', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('groups by clusterId', () => {
    const logs = [
      makeLog(1, true, 'cluster-A'),
      makeLog(2, false, 'cluster-B'),
      makeLog(1, true, 'cluster-A'),
    ]
    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)
    const a = result.find((r) => r.clusterId === 'cluster-A')
    expect(a?.answered).toBe(2)
    expect(a?.correct).toBe(2)
  })

  it('preserves cluster encounter order', () => {
    const logs = [
      makeLog(1, true, 'C'),
      makeLog(1, true, 'A'),
      makeLog(1, true, 'B'),
    ]
    const result = summarizeLogs(logs)
    expect(result.map((r) => r.clusterId)).toEqual(['C', 'A', 'B'])
  })

  it('counts pending (null) items correctly', () => {
    const logs = [
      makeLog(1, null, 'cluster-1'),
      makeLog(1, true, 'cluster-1'),
    ]
    const result = summarizeLogs(logs)
    expect(result[0]?.pending).toBe(1)
  })

  it('computes mastery as correct / decided', () => {
    const logs = [
      makeLog(1, true, 'cluster-1'),
      makeLog(1, false, 'cluster-1'),
      makeLog(1, null, 'cluster-1'),
    ]
    const result = summarizeLogs(logs)
    // 1 correct / 2 decided (excluding 1 pending)
    expect(result[0]?.mastery).toBeCloseTo(0.5)
  })

  it('sets mastery to 0 when all items are pending', () => {
    const logs = [makeLog(1, null, 'cluster-1')]
    const result = summarizeLogs(logs)
    expect(result[0]?.mastery).toBe(0)
  })

  it('maps reachedAfb from estimatedLevel', () => {
    const logs = [makeLog(2, true, 'cluster-1')]
    const result = summarizeLogs(logs)
    expect(result[0]?.reachedAfb).toBe('II')
  })
})
