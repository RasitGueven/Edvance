import { describe, it, expect } from 'vitest'
import {
  levelToAfb,
  requiredHits,
  correctOnLevel,
  estimateLevel,
  confidenceFor,
  summarizeLogs,
} from '../../screening/scoring'
import type { AdaptiveAnswerLog } from '../../screening/adaptive'
import type { ScreeningLevel } from '@/types'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeLog(
  level: ScreeningLevel,
  correct: boolean | null = true,
  clusterId = 'Algebra',
): AdaptiveAnswerLog {
  return {
    itemId: `item-${Math.random()}`,
    clusterId,
    level,
    correct,
    answer: correct ? { text: 'richtig' } : { text: 'falsch' },
  }
}

// ── levelToAfb ───────────────────────────────────────────────────────────────

describe('levelToAfb', () => {
  it('maps 0 to null', () => {
    expect(levelToAfb(0)).toBeNull()
  })

  it('maps 1 to "I"', () => {
    expect(levelToAfb(1)).toBe('I')
  })

  it('maps 2 to "II"', () => {
    expect(levelToAfb(2)).toBe('II')
  })

  it('maps 3 to "III"', () => {
    expect(levelToAfb(3)).toBe('III')
  })
})

// ── requiredHits ─────────────────────────────────────────────────────────────

describe('requiredHits', () => {
  it('returns 2 for level 3 (lucky-guess protection)', () => {
    expect(requiredHits(3)).toBe(2)
  })

  it('returns 1 for level 1', () => {
    expect(requiredHits(1)).toBe(1)
  })

  it('returns 1 for level 2', () => {
    expect(requiredHits(2)).toBe(1)
  })
})

// ── correctOnLevel ────────────────────────────────────────────────────────────

describe('correctOnLevel', () => {
  it('counts only correct answers on the given level', () => {
    const logs = [
      makeLog(1, true),
      makeLog(1, false),
      makeLog(2, true),
      makeLog(1, true),
    ]
    expect(correctOnLevel(logs, 1)).toBe(2)
    expect(correctOnLevel(logs, 2)).toBe(1)
  })

  it('returns 0 when no answers on given level', () => {
    const logs = [makeLog(1, true)]
    expect(correctOnLevel(logs, 3)).toBe(0)
  })

  it('ignores null answers (pending)', () => {
    const logs = [makeLog(1, null), makeLog(1, true)]
    expect(correctOnLevel(logs, 1)).toBe(1)
  })
})

// ── estimateLevel ─────────────────────────────────────────────────────────────

describe('estimateLevel', () => {
  it('returns 0 for empty log', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('returns 1 when only level 1 confirmed', () => {
    const logs = [makeLog(1, true)]
    expect(estimateLevel(logs)).toBe(1)
  })

  it('returns 2 when level 2 confirmed (1 hit)', () => {
    const logs = [makeLog(1, true), makeLog(2, true)]
    expect(estimateLevel(logs)).toBe(2)
  })

  it('requires 2 correct hits for level 3 (lucky-guess protection)', () => {
    const logs = [makeLog(1, true), makeLog(2, true), makeLog(3, true)]
    // Only 1 correct hit on level 3 — requiredHits(3)=2, so level 3 NOT confirmed
    // Best is level 2 (1 hit ≥ requiredHits(2)=1, mastery 100%)
    expect(estimateLevel(logs)).toBe(2)
  })

  it('confirms level 3 when 2+ correct hits present', () => {
    const logs = [makeLog(3, true), makeLog(3, true)]
    expect(estimateLevel(logs)).toBe(3)
  })

  it('requires 2 correct hits on level 3 when multiple attempts exist', () => {
    const logs = [
      makeLog(3, true),
      makeLog(3, false),
      makeLog(3, false),
    ]
    // 1 hit out of 3 = 33% mastery < 50% → downgrade
    expect(estimateLevel(logs)).toBe(0)
  })

  it('downgrades if mastery on estimated level < 50%', () => {
    const logs = [
      makeLog(1, false),
      makeLog(1, false),
      makeLog(2, true),
    ]
    // Level 2 confirmed (1 hit ≥ 1), mastery on 2 = 100% → stays at 2
    // Level 1 mastery = 0% but level 2 is the estimated level
    expect(estimateLevel(logs)).toBe(2)
  })
})

// ── confidenceFor ─────────────────────────────────────────────────────────────

describe('confidenceFor', () => {
  it('returns "low" with few answers', () => {
    const logs = [makeLog(1, true)]
    expect(confidenceFor(1, 2, 1, logs)).toBe('low')
  })

  it('returns "high" when 4+ answered, 0 pending, level > 0, at least 1 correct on level', () => {
    const logs = [makeLog(1, true), makeLog(1, true), makeLog(2, true), makeLog(2, true)]
    expect(confidenceFor(4, 0, 2, logs)).toBe('high')
  })

  it('returns "low" when many pending items remain', () => {
    // answered=4, pending=2 → 2 > max(1, floor(4/3))=1 → "medium" condition fails → "low"
    const logs = [makeLog(1, false), makeLog(1, false), makeLog(1, false), makeLog(1, false)]
    expect(confidenceFor(4, 2, 0, logs)).toBe('low')
  })

  it('returns "medium" for intermediate answered/pending ratio', () => {
    const logs = [makeLog(1, true), makeLog(1, true)]
    // 2 answered, 1 pending → medium threshold is pending ≤ max(1, floor(2/3))=1
    expect(confidenceFor(2, 1, 1, logs)).toBe('medium')
  })
})

// ── summarizeLogs ─────────────────────────────────────────────────────────────

describe('summarizeLogs', () => {
  it('returns empty array for empty logs', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('groups logs by clusterId', () => {
    const logs = [
      makeLog(1, true, 'Algebra'),
      makeLog(2, true, 'Geometrie'),
      makeLog(1, false, 'Algebra'),
    ]
    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)
    const alg = result.find((r) => r.clusterId === 'Algebra')
    expect(alg?.answered).toBe(2)
    expect(alg?.correct).toBe(1)
  })

  it('preserves cluster order by first encounter', () => {
    const logs = [
      makeLog(1, true, 'B'),
      makeLog(1, true, 'A'),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].clusterId).toBe('B')
    expect(result[1].clusterId).toBe('A')
  })

  it('computes mastery correctly', () => {
    const logs = [
      makeLog(1, true, 'Test'),
      makeLog(1, true, 'Test'),
      makeLog(1, false, 'Test'),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].mastery).toBeCloseTo(2 / 3)
  })

  it('counts pending items (correct=null)', () => {
    const logs = [
      makeLog(1, true, 'Test'),
      makeLog(1, null, 'Test'),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].pending).toBe(1)
  })

  it('sets reachedAfb based on estimated level', () => {
    const logs = [makeLog(2, true, 'Cluster')]
    const result = summarizeLogs(logs)
    expect(result[0].reachedAfb).toBe('II')
  })
})
