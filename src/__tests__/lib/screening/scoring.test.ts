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

// ── helpers ───────────────────────────────────────────────────────────────────

function log(
  level: 1 | 2 | 3,
  correct: boolean | null,
  clusterId = 'c1',
): AdaptiveAnswerLog {
  return { itemId: crypto.randomUUID(), clusterId, level, correct }
}

// ── levelToAfb ────────────────────────────────────────────────────────────────

describe('levelToAfb', () => {
  it('maps 1→I, 2→II, 3→III', () => {
    expect(levelToAfb(1)).toBe('I')
    expect(levelToAfb(2)).toBe('II')
    expect(levelToAfb(3)).toBe('III')
  })

  it('returns null for level 0', () => {
    expect(levelToAfb(0)).toBeNull()
  })
})

// ── requiredHits ──────────────────────────────────────────────────────────────

describe('requiredHits', () => {
  it('requires 2 hits for level 3 (lucky-guess protection)', () => {
    expect(requiredHits(3)).toBe(2)
  })

  it('requires 1 hit for level 1 and 2', () => {
    expect(requiredHits(1)).toBe(1)
    expect(requiredHits(2)).toBe(1)
  })
})

// ── correctOnLevel ────────────────────────────────────────────────────────────

describe('correctOnLevel', () => {
  it('counts only correct answers at the given level', () => {
    const logs = [log(1, true), log(1, false), log(2, true), log(1, null)]
    expect(correctOnLevel(logs, 1)).toBe(1)
    expect(correctOnLevel(logs, 2)).toBe(1)
    expect(correctOnLevel(logs, 3)).toBe(0)
  })

  it('ignores null (pending) answers', () => {
    const logs = [log(1, null), log(1, null)]
    expect(correctOnLevel(logs, 1)).toBe(0)
  })
})

// ── estimateLevel ─────────────────────────────────────────────────────────────

describe('estimateLevel', () => {
  it('returns 0 with no answers', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('returns 1 with one correct level-1 answer', () => {
    expect(estimateLevel([log(1, true)])).toBe(1)
  })

  it('returns 2 when level 2 is confirmed', () => {
    const logs = [log(1, true), log(2, true)]
    expect(estimateLevel(logs)).toBe(2)
  })

  it('returns 3 only after 2 correct at level 3', () => {
    const logs = [log(1, true), log(2, true), log(3, true), log(3, true)]
    expect(estimateLevel(logs)).toBe(3)
  })

  it('does NOT return 3 after only 1 correct at level 3', () => {
    const logs = [log(1, true), log(2, true), log(3, true)]
    expect(estimateLevel(logs)).toBeLessThan(3)
  })

  it('downgrades when mastery on best level < 50%', () => {
    // Level 2 confirmed (1 hit), but 2 wrong: mastery = 1/3 < 50% → downgrade to 1
    const logs = [log(1, true), log(2, true), log(2, false), log(2, false)]
    const level = estimateLevel(logs)
    expect(level).toBeLessThan(2)
  })
})

// ── confidenceFor ─────────────────────────────────────────────────────────────

describe('confidenceFor', () => {
  it('returns "low" for fewer than 2 answered', () => {
    expect(confidenceFor(1, 0, 1, [log(1, true)])).toBe('low')
  })

  it('returns "high" when 4+ answered, 0 pending, level > 0 with hit', () => {
    const logs = [log(1, true), log(1, true), log(2, true), log(2, true)]
    expect(confidenceFor(4, 0, 2, logs)).toBe('high')
  })

  it('returns "medium" when 2+ answered and few pending', () => {
    const logs = [log(1, true), log(1, true)]
    // 2 answered, 0 pending (pending <= max(1, floor(2/3)=0) → 0 <= 1)
    expect(confidenceFor(2, 0, 1, logs)).toBe('medium')
  })
})

// ── summarizeLogs ─────────────────────────────────────────────────────────────

describe('summarizeLogs', () => {
  it('returns empty array for empty log', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('groups logs by cluster and preserves order', () => {
    const logs = [
      log(1, true, 'c1'),
      log(2, true, 'c2'),
      log(1, false, 'c1'),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].clusterId).toBe('c1')
    expect(result[1].clusterId).toBe('c2')
  })

  it('computes correct mastery ratio', () => {
    const logs = [log(1, true, 'c1'), log(1, false, 'c1'), log(1, false, 'c1')]
    const result = summarizeLogs(logs)
    // 1 correct / 3 total (no pending) ≈ 0.333
    expect(result[0].mastery).toBeCloseTo(1 / 3)
  })

  it('counts pending items', () => {
    const logs = [log(1, null, 'c1'), log(1, true, 'c1')]
    const result = summarizeLogs(logs)
    expect(result[0].pending).toBe(1)
  })

  it('sets reachedAfb correctly for estimated level', () => {
    const logs = [log(1, true, 'c1'), log(2, true, 'c1')]
    const result = summarizeLogs(logs)
    expect(result[0].reachedAfb).toBe('II')
  })
})
