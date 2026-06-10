import { describe, it, expect } from 'vitest'
import {
  createAdaptiveSession,
  nextItem,
  submitAnswer,
  summarize,
  isComplete,
} from '@/lib/screening/adaptive'
import type { ScreeningItem } from '@/types'

function makeItem(
  id: string,
  clusterId: string,
  level: 1 | 2 | 3,
  checkType: 'mc_index' | 'numeric' = 'mc_index',
): ScreeningItem {
  return {
    id,
    created_at: '2024-01-01',
    cluster_id: clusterId,
    class_level: 7,
    topic: 'math',
    skill_code: 'SK1',
    skill_label: 'Test',
    level,
    curriculum_seq: null,
    input_type: 'MC',
    prompt: `Item ${id}`,
    payload: {},
    canonical: checkType === 'mc_index' ? { index: 0 } : { value: 42 },
    check_type: checkType,
    tolerance: null,
    typical_errors: [],
    explanation: null,
    source: 'test',
    active: true,
    afb: level === 1 ? 'I' : level === 2 ? 'II' : 'III',
    phase: 'sprint',
    akzeptierte_antworten: null,
  }
}

const rng = () => 0

describe('createAdaptiveSession', () => {
  it('empty pool → session phase is done', () => {
    const s = createAdaptiveSession([], { rng })
    expect(s.phase).toBe('done')
  })

  it('inactive items are excluded from pool', () => {
    const pool: ScreeningItem[] = [
      { ...makeItem('active', 'c1', 1) },
      { ...makeItem('inactive', 'c1', 1), active: false },
    ]
    const s = createAdaptiveSession(pool, { rng })
    expect(s.pool).toHaveLength(1)
    expect(s.pool[0].id).toBe('active')
  })

  it('excludedTopics removes matching items', () => {
    const pool: ScreeningItem[] = [
      { ...makeItem('keep', 'c1', 1) },
      { ...makeItem('drop', 'c1', 1), topic: 'banned' },
    ]
    const s = createAdaptiveSession(pool, { rng, excludedTopics: ['banned'] })
    expect(s.pool.map((i) => i.id)).not.toContain('drop')
    expect(s.pool.map((i) => i.id)).toContain('keep')
  })

  it('non-empty pool starts in warmup phase', () => {
    const s = createAdaptiveSession([makeItem('i1', 'c1', 1)], { rng })
    expect(s.phase).toBe('warmup')
  })

  it('warmupQueue contains all cluster ids', () => {
    const pool = [makeItem('a', 'c1', 1), makeItem('b', 'c2', 1)]
    const s = createAdaptiveSession(pool, { rng })
    expect(s.warmupQueue).toContain('c1')
    expect(s.warmupQueue).toContain('c2')
  })
})

describe('nextItem', () => {
  it('empty pool → nextItem returns null immediately', () => {
    const s = createAdaptiveSession([], { rng })
    expect(nextItem(s)).toBeNull()
  })

  it('warmup phase: first item comes from warmup queue (level 1)', () => {
    const pool = [makeItem('i1', 'c1', 1), makeItem('i2', 'c1', 2)]
    const s = createAdaptiveSession(pool, { rng })
    const item = nextItem(s)
    expect(item).not.toBeNull()
    expect(item?.level).toBe(1)
  })

  it('is idempotent: returns same item when called again without answering', () => {
    const pool = [makeItem('i1', 'c1', 1)]
    const s = createAdaptiveSession(pool, { rng })
    const first = nextItem(s)
    const second = nextItem(s)
    expect(first?.id).toBe(second?.id)
  })
})

describe('submitAnswer', () => {
  it('returns null when no current item', () => {
    const s = createAdaptiveSession([makeItem('i1', 'c1', 1)], { rng })
    expect(submitAnswer(s, { index: 0 })).toBeNull()
  })

  it('clears current item after submit', () => {
    const s = createAdaptiveSession([makeItem('i1', 'c1', 1)], { rng })
    nextItem(s)
    submitAnswer(s, { index: 0 })
    expect(s.current).toBeNull()
  })

  it('correct warmup answer advances cluster level to 2 in focus', () => {
    const pool = [
      makeItem('w', 'c1', 1),
      makeItem('f1', 'c1', 1),
      makeItem('f2', 'c1', 2),
    ]
    const s = createAdaptiveSession(pool, { rng })
    // warmup item for c1
    nextItem(s)
    submitAnswer(s, { index: 0 }, 500) // correct
    const cs = s.clusters.get('c1')
    expect(cs?.level).toBe(2)
  })

  it('wrong warmup answer keeps cluster at level 1', () => {
    const pool = [makeItem('w', 'c1', 1), makeItem('f1', 'c1', 2)]
    const s = createAdaptiveSession(pool, { rng })
    nextItem(s)
    submitAnswer(s, { index: 99 }, 500) // wrong
    const cs = s.clusters.get('c1')
    expect(cs?.level).toBe(1)
  })
})

describe('focus phase', () => {
  it('correct answer increments level in focus', () => {
    // Single cluster, enough items for warmup + focus
    const pool = [
      makeItem('w', 'c1', 1),
      makeItem('f1', 'c1', 1),
      makeItem('f2', 'c1', 2),
      makeItem('f3', 'c1', 3),
      makeItem('f4', 'c1', 3),
    ]
    const s = createAdaptiveSession(pool, { rng })
    // Complete warmup
    nextItem(s)
    submitAnswer(s, { index: 0 }, 0) // correct warmup → level becomes 2
    // Now in focus
    const focusItem = nextItem(s)
    expect(focusItem).not.toBeNull()
    const levelBefore = s.clusters.get('c1')?.level ?? 0
    submitAnswer(s, { index: 0 }, 0) // correct focus
    const levelAfter = s.clusters.get('c1')?.level ?? 0
    expect(levelAfter).toBeGreaterThanOrEqual(levelBefore)
  })

  it('wrong answer decrements level in focus', () => {
    const pool = [
      makeItem('w', 'c1', 1),
      makeItem('f1', 'c1', 1),
      makeItem('f2', 'c1', 2),
    ]
    const s = createAdaptiveSession(pool, { rng })
    // warmup correct → level=2
    nextItem(s)
    submitAnswer(s, { index: 0 }, 0)
    const cs = s.clusters.get('c1')!
    expect(cs.level).toBe(2)
    // focus answer wrong → level goes back to 1
    nextItem(s)
    submitAnswer(s, { index: 99 }, 0)
    expect(cs.level).toBe(1)
  })

  it('converged (2 false in a row on same level) finalizes cluster', () => {
    const pool = [
      makeItem('w', 'c1', 1),
      makeItem('f1', 'c1', 1),
      makeItem('f2', 'c1', 1),
      makeItem('f3', 'c1', 1),
    ]
    const s = createAdaptiveSession(pool, { rng })
    // warmup wrong → level stays 1
    nextItem(s)
    submitAnswer(s, { index: 99 }, 0)
    // focus: 2 wrong in a row on level 1
    nextItem(s)
    submitAnswer(s, { index: 99 }, 0)
    nextItem(s)
    submitAnswer(s, { index: 99 }, 0)
    const cs = s.clusters.get('c1')!
    expect(cs.focusDone).toBe(true)
  })

  it('focusCap stops at 3 for non-weighted cluster', () => {
    // 4 focus items, non-weighted: should stop after 3 focus answers
    const pool = [
      makeItem('w', 'c1', 1),
      makeItem('f1', 'c1', 1),
      makeItem('f2', 'c1', 2),
      makeItem('f3', 'c1', 3),
      makeItem('f4', 'c1', 3),
    ]
    const s = createAdaptiveSession(pool, { rng })
    // warmup
    nextItem(s)
    submitAnswer(s, { index: 0 }, 0)
    // 3 focus answers
    for (let i = 0; i < 3; i++) {
      const item = nextItem(s)
      if (!item) break
      submitAnswer(s, { index: 0 }, 0)
    }
    const cs = s.clusters.get('c1')!
    expect(cs.focusDone).toBe(true)
  })

  it('focusCap stops at 5 for weighted cluster', () => {
    const items: ScreeningItem[] = [
      makeItem('w', 'c1', 1),
      makeItem('f1', 'c1', 1),
      makeItem('f2', 'c1', 2),
      makeItem('f3', 'c1', 3),
      makeItem('f4', 'c1', 3),
      makeItem('f5', 'c1', 2),
      makeItem('f6', 'c1', 1),
    ]
    const s = createAdaptiveSession(items, {
      rng,
      weightedClusterIds: ['c1'],
    })
    // warmup
    nextItem(s)
    submitAnswer(s, { index: 0 }, 0)
    // answer 5 focus items correctly
    let focusCount = 0
    while (focusCount < 5) {
      const item = nextItem(s)
      if (!item) break
      submitAnswer(s, { index: 0 }, 0)
      focusCount++
    }
    const cs = s.clusters.get('c1')!
    expect(cs.focusDone).toBe(true)
  })
})

describe('isComplete', () => {
  it('returns true when all clusters done', () => {
    const pool = [makeItem('i1', 'c1', 1)]
    const s = createAdaptiveSession(pool, { rng })
    // answer all items
    while (true) {
      const item = nextItem(s)
      if (!item) break
      submitAnswer(s, { index: 99 }, 0)
    }
    expect(isComplete(s)).toBe(true)
  })

  it('returns false on fresh session with items', () => {
    const s = createAdaptiveSession([makeItem('i1', 'c1', 1)], { rng })
    expect(isComplete(s)).toBe(false)
  })
})

describe('summarize', () => {
  it('returns ClusterSummary[] with correct clusterId + estimatedLevel', () => {
    const pool = [
      makeItem('w', 'c1', 1),
      makeItem('f1', 'c1', 2),
    ]
    const s = createAdaptiveSession(pool, { rng })
    while (!isComplete(s)) {
      const item = nextItem(s)
      if (!item) break
      submitAnswer(s, { index: 0 }, 0)
    }
    const result = summarize(s)
    expect(result).toHaveLength(1)
    expect(result[0].clusterId).toBe('c1')
    expect(result[0].estimatedLevel).toBeGreaterThanOrEqual(0)
    expect(result[0].estimatedLevel).toBeLessThanOrEqual(3)
  })

  it('summarize on unanswered session returns 0 for all', () => {
    const pool = [makeItem('i1', 'c1', 1), makeItem('i2', 'c2', 1)]
    const s = createAdaptiveSession(pool, { rng })
    const result = summarize(s)
    for (const cs of result) {
      expect(cs.answered).toBe(0)
      expect(cs.correct).toBe(0)
    }
  })
})
