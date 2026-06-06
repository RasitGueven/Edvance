import { describe, it, expect } from 'vitest'
import {
  levelToAfb,
  requiredHits,
  correctOnLevel,
  estimateLevel,
  confidenceFor,
  summarizeLogs,
} from '../screening/scoring'
import type { AdaptiveAnswerLog } from '../screening/adaptive'
import type { ScreeningLevel } from '@/types'

// ── Factories ──────────────────────────────────────────────────

function log(
  level: ScreeningLevel,
  correct: boolean | null,
  clusterId = 'cluster-A',
): AdaptiveAnswerLog {
  return {
    itemId: `item-${Math.random()}`,
    clusterId,
    level,
    correct,
    durationMs: 5000,
  }
}

// ── levelToAfb ──────────────────────────────────────────────────

describe('levelToAfb', () => {
  it('maps level 1 → "I"', () => expect(levelToAfb(1)).toBe('I'))
  it('maps level 2 → "II"', () => expect(levelToAfb(2)).toBe('II'))
  it('maps level 3 → "III"', () => expect(levelToAfb(3)).toBe('III'))
  it('maps level 0 → null', () => expect(levelToAfb(0)).toBeNull())
})

// ── requiredHits ────────────────────────────────────────────────

describe('requiredHits', () => {
  it('requires 1 hit for level 1', () => expect(requiredHits(1)).toBe(1))
  it('requires 1 hit for level 2', () => expect(requiredHits(2)).toBe(1))
  it('requires 2 hits for level 3 (lucky-guess protection)', () => {
    expect(requiredHits(3)).toBe(2)
  })
})

// ── correctOnLevel ──────────────────────────────────────────────

describe('correctOnLevel', () => {
  it('returns 0 for empty log', () => {
    expect(correctOnLevel([], 1)).toBe(0)
  })

  it('counts only correct answers on the given level', () => {
    const logs = [
      log(1, true),
      log(1, false),
      log(2, true),
      log(1, true),
    ]
    expect(correctOnLevel(logs, 1)).toBe(2)
    expect(correctOnLevel(logs, 2)).toBe(1)
  })

  it('ignores null (pending) answers', () => {
    const logs = [log(1, null), log(1, true)]
    expect(correctOnLevel(logs, 1)).toBe(1)
  })
})

// ── estimateLevel ───────────────────────────────────────────────

describe('estimateLevel', () => {
  it('returns 0 for empty log', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('returns 1 for one correct answer on L1', () => {
    expect(estimateLevel([log(1, true)])).toBe(1)
  })

  it('returns 2 for correct answers on L1 and L2', () => {
    const logs = [log(1, true), log(2, true)]
    expect(estimateLevel(logs)).toBe(2)
  })

  it('requires 2 correct hits to reach level 3', () => {
    const oneHit = [log(1, true), log(2, true), log(3, true)]
    expect(estimateLevel(oneHit)).toBe(2)
    const twoHits = [log(1, true), log(2, true), log(3, true), log(3, true)]
    expect(estimateLevel(twoHits)).toBe(3)
  })

  it('downgrades if mastery < 50% on estimated level', () => {
    // L2 answered: 1 correct, 2 wrong → mastery = 33% → downgrade to 1
    const logs = [log(1, true), log(2, true), log(2, false), log(2, false)]
    expect(estimateLevel(logs)).toBe(1)
  })

  it('does not downgrade if mastery >= 50%', () => {
    // L2: 2 correct, 1 wrong → mastery = 67% → no downgrade
    const logs = [log(1, true), log(2, true), log(2, true), log(2, false)]
    expect(estimateLevel(logs)).toBe(2)
  })
})

// ── confidenceFor ───────────────────────────────────────────────

describe('confidenceFor', () => {
  it('returns "low" for fresh start', () => {
    expect(confidenceFor(0, 5, 0, [])).toBe('low')
  })

  it('returns "high" when 4+ answered, 0 pending, level>0 and 1+ correct', () => {
    const logs = [log(1, true), log(1, true), log(1, true), log(1, true)]
    expect(confidenceFor(4, 0, 1, logs)).toBe('high')
  })

  it('returns "medium" when 2+ answered and few pending', () => {
    // answered=2, pending=0 → medium (0 <= floor(2/3) = 0)
    expect(confidenceFor(2, 0, 1, [])).toBe('medium')
  })

  it('returns "low" when many items still pending', () => {
    expect(confidenceFor(2, 5, 0, [])).toBe('low')
  })
})

// ── summarizeLogs ───────────────────────────────────────────────

describe('summarizeLogs', () => {
  it('returns empty for empty input', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('groups logs by clusterId', () => {
    const logs = [
      log(1, true, 'A'),
      log(2, true, 'A'),
      log(1, true, 'B'),
    ]
    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.clusterId)).toContain('A')
    expect(result.map(r => r.clusterId)).toContain('B')
  })

  it('preserves cluster order (first contact)', () => {
    const logs = [log(1, true, 'B'), log(1, true, 'A')]
    const result = summarizeLogs(logs)
    expect(result[0].clusterId).toBe('B')
    expect(result[1].clusterId).toBe('A')
  })

  it('computes mastery correctly', () => {
    const logs = [log(1, true, 'A'), log(1, false, 'A'), log(1, false, 'A')]
    const result = summarizeLogs(logs)
    expect(result[0].mastery).toBeCloseTo(1 / 3)
  })

  it('ignores pending (null) items for mastery', () => {
    const logs = [log(1, true, 'A'), log(1, null, 'A')]
    const result = summarizeLogs(logs)
    // decided = 1, correct = 1 → mastery = 1.0
    expect(result[0].mastery).toBe(1)
    expect(result[0].pending).toBe(1)
  })

  it('sets mastery to 0 when all pending', () => {
    const logs = [log(1, null, 'A'), log(2, null, 'A')]
    const result = summarizeLogs(logs)
    expect(result[0].mastery).toBe(0)
  })
})
