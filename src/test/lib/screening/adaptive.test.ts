import { describe, it, expect } from 'vitest'
import {
  createAdaptiveSession,
  nextItem,
  submitAnswer,
  summarize,
  summarizeLogs,
  isComplete,
} from '@/lib/screening/adaptive'
import type { ScreeningItem } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<ScreeningItem> & { id: string; cluster_id: string; level: 1 | 2 | 3 }): ScreeningItem {
  return {
    created_at: '2026-01-01',
    class_level: 8,
    topic: overrides.cluster_id,
    skill_code: 'M8.ZR.01',
    skill_label: 'Test Skill',
    curriculum_seq: null,
    input_type: 'MC',
    prompt: 'Was ist 2+2?',
    payload: { options: ['3', '4', '5'] },
    canonical: { index: 1 },
    check_type: 'mc_index',
    tolerance: null,
    typical_errors: [],
    explanation: null,
    source: 'test',
    active: true,
    ...overrides,
  }
}

// A minimal pool with two clusters, levels 1-3 each
function makePool(): ScreeningItem[] {
  const items: ScreeningItem[] = []
  for (const cluster of ['algebra', 'geometrie']) {
    for (const level of [1, 2, 3] as const) {
      for (let i = 0; i < 2; i++) {
        items.push(makeItem({ id: `${cluster}-l${level}-${i}`, cluster_id: cluster, level }))
      }
    }
  }
  return items
}

// Deterministic RNG for reproducibility
const deterministicRng = () => 0

// ── createAdaptiveSession ─────────────────────────────────────────────────────

describe('createAdaptiveSession()', () => {
  it('creates a session with warmup phase', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    expect(session.phase).toBe('warmup')
  })

  it('creates a done session for empty pool', () => {
    const session = createAdaptiveSession([], { rng: deterministicRng })
    expect(session.phase).toBe('done')
  })

  it('filters out inactive items', () => {
    const pool = [makeItem({ id: 'inactive', cluster_id: 'test', level: 1, active: false })]
    const session = createAdaptiveSession(pool, { rng: deterministicRng })
    expect(session.phase).toBe('done')
  })

  it('filters out excluded topics', () => {
    const pool = makePool()
    // Exclude topic 'algebra' (equals cluster_id in our fixture)
    const session = createAdaptiveSession(pool, { excludedTopics: ['algebra'], rng: deterministicRng })
    expect([...session.clusters.keys()]).not.toContain('algebra')
  })

  it('marks weighted clusters when topic matches', () => {
    const pool = makePool()
    const session = createAdaptiveSession(pool, { weightedTopics: ['algebra'], rng: deterministicRng })
    expect(session.clusters.get('algebra')?.weighted).toBe(true)
    expect(session.clusters.get('geometrie')?.weighted).toBe(false)
  })

  it('puts weighted clusters first in focusOrder', () => {
    const pool = makePool()
    const session = createAdaptiveSession(pool, { weightedTopics: ['geometrie'], rng: deterministicRng })
    expect(session.focusOrder[0]).toBe('geometrie')
  })
})

// ── nextItem + submitAnswer full-flow ─────────────────────────────────────────

describe('nextItem() / submitAnswer()', () => {
  it('returns an item in warmup phase', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    const item = nextItem(session)
    expect(item).not.toBeNull()
    expect(item?.id).toBeTruthy()
  })

  it('is idempotent — returns same item before answer', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    const first = nextItem(session)
    const second = nextItem(session)
    expect(first?.id).toBe(second?.id)
  })

  it('returns null when phase is done', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    session.phase = 'done'
    expect(nextItem(session)).toBeNull()
  })

  it('submitAnswer returns null when no current item', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    expect(submitAnswer(session, { index: 0 })).toBeNull()
  })

  it('submitAnswer clears current item after answer', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    nextItem(session) // populates current
    submitAnswer(session, { index: 0 }, 1000)
    expect(session.current).toBeNull()
  })

  it('accumulates spentMs', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    nextItem(session)
    submitAnswer(session, { index: 0 }, 5000)
    expect(session.spentMs).toBe(5000)
  })

  it('transitions from warmup to focus after all clusters warmed up', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    // Answer all warmup items
    let item = nextItem(session)
    while (item && session.phase === 'warmup') {
      submitAnswer(session, { index: 1 }, 1000) // correct answer (index 1)
      item = nextItem(session)
    }
    // After last warmup, either focus or done
    expect(['focus', 'done']).toContain(session.phase)
  })

  it('completes after budget is exceeded', () => {
    const session = createAdaptiveSession(makePool(), { budgetMs: 100, rng: deterministicRng })
    nextItem(session)
    submitAnswer(session, { index: 0 }, 200) // exceeds 100ms budget
    expect(isComplete(session)).toBe(true)
  })

  it('full run terminates (no infinite loop)', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    let count = 0
    let item = nextItem(session)
    while (item && count < 100) {
      submitAnswer(session, { index: 1 }, 500)
      item = nextItem(session)
      count++
    }
    expect(isComplete(session)).toBe(true)
    expect(count).toBeLessThan(100)
  })
})

// ── summarize ─────────────────────────────────────────────────────────────────

describe('summarize()', () => {
  it('returns one entry per cluster', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    const result = summarize(session)
    expect(result.length).toBe(session.clusterOrder.length)
  })

  it('returns mastery 0 for unanswered clusters', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    const result = summarize(session)
    result.forEach(r => expect(r.mastery).toBe(0))
  })

  it('reflects correct answers in mastery', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    // Answer all items correctly
    let item = nextItem(session)
    while (item) {
      submitAnswer(session, { index: 1 }, 500) // canonical.index === 1
      item = nextItem(session)
    }
    const result = summarize(session)
    result.forEach(r => {
      if (r.answered > 0) expect(r.mastery).toBeGreaterThan(0)
    })
  })
})

// ── summarizeLogs ─────────────────────────────────────────────────────────────

describe('summarizeLogs()', () => {
  it('returns empty for empty logs', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('aggregates logs per cluster', () => {
    const logs = [
      { itemId: 'i1', clusterId: 'algebra', level: 1 as const, correct: true, durationMs: 1000 },
      { itemId: 'i2', clusterId: 'algebra', level: 2 as const, correct: false, durationMs: 2000 },
      { itemId: 'i3', clusterId: 'geometrie', level: 1 as const, correct: true, durationMs: 500 },
    ]
    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)

    const alg = result.find(r => r.clusterId === 'algebra')!
    expect(alg.answered).toBe(2)
    expect(alg.correct).toBe(1)
    expect(alg.mastery).toBe(0.5)

    const geo = result.find(r => r.clusterId === 'geometrie')!
    expect(geo.answered).toBe(1)
    expect(geo.correct).toBe(1)
    expect(geo.mastery).toBe(1)
  })

  it('sets estimatedLevel to 0 when all wrong', () => {
    const logs = [
      { itemId: 'i1', clusterId: 'test', level: 3 as const, correct: false, durationMs: 0 },
    ]
    expect(summarizeLogs(logs)[0].estimatedLevel).toBe(0)
  })

  it('picks highest correct level as estimatedLevel', () => {
    const logs = [
      { itemId: 'i1', clusterId: 'test', level: 1 as const, correct: true, durationMs: 0 },
      { itemId: 'i2', clusterId: 'test', level: 3 as const, correct: true, durationMs: 0 },
      { itemId: 'i3', clusterId: 'test', level: 2 as const, correct: false, durationMs: 0 },
    ]
    expect(summarizeLogs(logs)[0].estimatedLevel).toBe(3)
  })
})

// ── isComplete ────────────────────────────────────────────────────────────────

describe('isComplete()', () => {
  it('returns false for fresh session', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    expect(isComplete(session)).toBe(false)
  })

  it('returns true when phase is done', () => {
    const session = createAdaptiveSession(makePool(), { rng: deterministicRng })
    session.phase = 'done'
    expect(isComplete(session)).toBe(true)
  })
})
