import { describe, it, expect } from 'vitest'
import {
  createAdaptiveSession,
  nextItem,
  submitAnswer,
  summarize,
  isComplete,
  RECOMMENDED_BUDGET_MS,
} from '@/lib/screening/adaptive'
import type { ScreeningItem } from '@/types'

function makeItem(
  id: string,
  clusterId: string,
  level: 1 | 2 | 3,
  topic = 'algebra',
): ScreeningItem {
  return {
    id,
    created_at: '2025-01-01T00:00:00Z',
    cluster_id: clusterId,
    class_level: 8,
    topic,
    skill_code: `SK-${id}`,
    skill_label: `Skill ${id}`,
    level,
    curriculum_seq: null,
    input_type: 'MC',
    prompt: `Question ${id}`,
    payload: { options: ['A', 'B', 'C', 'D'] },
    canonical: { index: 0 },
    check_type: 'mc_index',
    tolerance: null,
    typical_errors: [],
    explanation: null,
    source: 'test',
    active: true,
    afb: level === 1 ? 'I' : level === 2 ? 'II' : 'III',
    phase: 'sprint',
  }
}

const deterministicRng = () => 0

const minimalPool: ScreeningItem[] = [
  makeItem('i1', 'c1', 1),
  makeItem('i2', 'c1', 2),
  makeItem('i3', 'c1', 3),
  makeItem('i4', 'c1', 3),
  makeItem('i5', 'c2', 1),
  makeItem('i6', 'c2', 2),
]

describe('createAdaptiveSession', () => {
  it('creates a session in warmup phase', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    expect(session.phase).toBe('warmup')
  })

  it('discovers all clusters from the pool', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    expect(session.clusterOrder).toContain('c1')
    expect(session.clusterOrder).toContain('c2')
  })

  it('filters out inactive items', () => {
    const pool: ScreeningItem[] = [
      { ...makeItem('inactive', 'c1', 1), active: false },
      makeItem('active', 'c1', 1),
    ]
    const session = createAdaptiveSession(pool, { rng: deterministicRng })
    expect(session.pool).toHaveLength(1)
    expect(session.pool[0].id).toBe('active')
  })

  it('excludes items from excluded topics', () => {
    const pool: ScreeningItem[] = [
      makeItem('excl', 'c1', 1, 'verboten'),
      makeItem('ok', 'c1', 1, 'erlaubt'),
    ]
    const session = createAdaptiveSession(pool, {
      excludedTopics: ['verboten'],
      rng: deterministicRng,
    })
    expect(session.pool.map(i => i.id)).not.toContain('excl')
  })

  it('creates a "done" session when pool is empty after filtering', () => {
    const session = createAdaptiveSession([], { rng: deterministicRng })
    expect(session.phase).toBe('done')
  })

  it('uses RECOMMENDED_BUDGET_MS as default budget', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    expect(session.budgetMs).toBe(RECOMMENDED_BUDGET_MS)
  })

  it('places weighted clusters first in focusOrder', () => {
    const pool: ScreeningItem[] = [
      makeItem('a', 'c1', 1, 'normal'),
      makeItem('b', 'c2', 1, 'focus'),
    ]
    const session = createAdaptiveSession(pool, {
      weightedTopics: ['focus'],
      rng: deterministicRng,
    })
    expect(session.focusOrder[0]).toBe('c2')
  })
})

describe('nextItem & submitAnswer', () => {
  it('returns an item in warmup phase', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    const item = nextItem(session)
    expect(item).not.toBeNull()
    expect(item?.level).toBe(1)
  })

  it('is idempotent — returns the same item without an answer', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    const first = nextItem(session)
    const second = nextItem(session)
    expect(first?.id).toBe(second?.id)
  })

  it('clears current after submitAnswer', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    nextItem(session)
    submitAnswer(session, { index: 0 })
    expect(session.current).toBeNull()
  })

  it('returns an answer log entry after submitAnswer', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    nextItem(session)
    const log = submitAnswer(session, { index: 0 })
    expect(log).not.toBeNull()
    expect(log?.correct).toBe(true)
    expect(log?.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('returns null from submitAnswer when no current item', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    expect(submitAnswer(session, { index: 0 })).toBeNull()
  })

  it('transitions from warmup to focus after exhausting warmup clusters', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    for (let i = 0; i < 2; i++) {
      nextItem(session)
      submitAnswer(session, { index: 0 }, 1000)
    }
    nextItem(session)
    expect(['focus', 'done']).toContain(session.phase)
  })

  it('respects the time budget and finishes when spent', () => {
    const pool: ScreeningItem[] = [makeItem('i1', 'c1', 1)]
    const session = createAdaptiveSession(pool, {
      budgetMs: 500,
      rng: deterministicRng,
    })
    nextItem(session)
    submitAnswer(session, { index: 0 }, 1000)
    expect(isComplete(session)).toBe(true)
  })

  it('marks session done when all items exhausted', () => {
    const pool: ScreeningItem[] = [makeItem('only', 'c1', 1)]
    const session = createAdaptiveSession(pool, { rng: deterministicRng })
    nextItem(session)
    submitAnswer(session, { index: 99 }, 1000)
    const next = nextItem(session)
    expect(next).toBeNull()
  })

  it('focus staircase goes up on correct answer', () => {
    const pool: ScreeningItem[] = [
      makeItem('w1', 'c1', 1),
      makeItem('f1', 'c1', 1),
      makeItem('f2', 'c1', 2),
      makeItem('f3', 'c1', 3),
      makeItem('f4', 'c1', 3),
    ]
    const session = createAdaptiveSession(pool, { rng: deterministicRng })
    nextItem(session)
    submitAnswer(session, { index: 0 }, 500)
    const item2 = nextItem(session)
    if (item2) {
      submitAnswer(session, { index: 0 }, 500)
    }
    const cs = session.clusters.get('c1')
    expect(cs?.level).toBeGreaterThanOrEqual(2)
  })
})

describe('summarize', () => {
  it('returns a summary per cluster in clusterOrder', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    const summaries = summarize(session)
    expect(summaries).toHaveLength(session.clusterOrder.length)
  })

  it('returns 0 answered and 0 correct initially', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    const summaries = summarize(session)
    for (const s of summaries) {
      expect(s.answered).toBe(0)
      expect(s.correct).toBe(0)
    }
  })

  it('reflects answers after a full run', () => {
    const pool: ScreeningItem[] = [
      makeItem('a', 'c1', 1),
      makeItem('b', 'c1', 2),
    ]
    const session = createAdaptiveSession(pool, { rng: deterministicRng })
    while (!isComplete(session)) {
      const item = nextItem(session)
      if (!item) break
      submitAnswer(session, { index: 0 }, 500)
    }
    const [summary] = summarize(session)
    expect(summary.answered).toBeGreaterThan(0)
  })
})

describe('isComplete', () => {
  it('returns false on a fresh session', () => {
    const session = createAdaptiveSession(minimalPool, { rng: deterministicRng })
    expect(isComplete(session)).toBe(false)
  })

  it('returns true when phase is done', () => {
    const session = createAdaptiveSession([], { rng: deterministicRng })
    expect(isComplete(session)).toBe(true)
  })
})
