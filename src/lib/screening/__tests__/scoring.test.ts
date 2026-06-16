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
    clusterId: 'cluster-1',
    itemId: 'item-1',
    level: 1,
    correct: true,
    answeredAt: Date.now(),
    ...overrides,
  }
}

// ── levelToAfb ───────────────────────────────────────────────────────────────

describe('levelToAfb', () => {
  it('mappt Level 1 → "I"', () => expect(levelToAfb(1)).toBe('I'))
  it('mappt Level 2 → "II"', () => expect(levelToAfb(2)).toBe('II'))
  it('mappt Level 3 → "III"', () => expect(levelToAfb(3)).toBe('III'))
  it('gibt null für Level 0 zurück', () => expect(levelToAfb(0)).toBeNull())
})

// ── requiredHits ─────────────────────────────────────────────────────────────

describe('requiredHits', () => {
  it('gibt 1 für Level 1 zurück', () => expect(requiredHits(1)).toBe(1))
  it('gibt 1 für Level 2 zurück', () => expect(requiredHits(2)).toBe(1))
  it('gibt 2 für Level 3 zurück (Lucky-Guess-Schutz)', () => expect(requiredHits(3)).toBe(2))
})

// ── correctOnLevel ───────────────────────────────────────────────────────────

describe('correctOnLevel', () => {
  it('gibt 0 für leeres Log zurück', () => {
    expect(correctOnLevel([], 1)).toBe(0)
  })

  it('zählt korrekte Antworten auf dem Level', () => {
    const logs = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 2, correct: true }),
    ]
    expect(correctOnLevel(logs, 1)).toBe(1)
    expect(correctOnLevel(logs, 2)).toBe(1)
  })

  it('ignoriert null-Antworten', () => {
    const logs = [
      makeLog({ level: 1, correct: null }),
      makeLog({ level: 1, correct: true }),
    ]
    expect(correctOnLevel(logs, 1)).toBe(1)
  })

  it('ignoriert Logs anderer Level', () => {
    const logs = [
      makeLog({ level: 2, correct: true }),
      makeLog({ level: 3, correct: true }),
    ]
    expect(correctOnLevel(logs, 1)).toBe(0)
  })
})

// ── estimateLevel ────────────────────────────────────────────────────────────

describe('estimateLevel', () => {
  it('gibt 0 für leeres Log zurück', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('gibt 0 wenn keine korrekten Antworten', () => {
    const logs = [
      makeLog({ level: 1, correct: false }),
      makeLog({ level: 2, correct: false }),
    ]
    expect(estimateLevel(logs)).toBe(0)
  })

  it('gibt Level 1 bei einer richtigen Antwort auf Level 1', () => {
    const logs = [makeLog({ level: 1, correct: true })]
    expect(estimateLevel(logs)).toBe(1)
  })

  it('gibt Level 2 bei richtiger Antwort auf Level 2', () => {
    const logs = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: true }),
    ]
    expect(estimateLevel(logs)).toBe(2)
  })

  it('erfordert 2 korrekte Antworten für Level 3', () => {
    const logs = [
      makeLog({ level: 3, correct: true }),
      makeLog({ level: 3, correct: false }),
    ]
    // Nur 1 richtige auf Level 3 → nicht genug (requiredHits(3) = 2)
    expect(estimateLevel(logs)).toBe(0)
  })

  it('gibt Level 3 bei 2 richtigen auf Level 3', () => {
    const logs = [
      makeLog({ level: 3, correct: true }),
      makeLog({ level: 3, correct: true }),
    ]
    expect(estimateLevel(logs)).toBe(3)
  })

  it('degradiert bei Mastery < 50% auf dem Level', () => {
    // 1 von 3 auf Level 2 = 33% Mastery → Downgrade auf Level 1
    const logs = [
      makeLog({ level: 1, correct: true }),
      makeLog({ level: 2, correct: true }),
      makeLog({ level: 2, correct: false }),
      makeLog({ level: 2, correct: false }),
    ]
    const result = estimateLevel(logs)
    expect(result).toBe(1)
  })
})

// ── confidenceFor ────────────────────────────────────────────────────────────

describe('confidenceFor', () => {
  it('gibt "low" zurück wenn wenige Antworten', () => {
    const logs = [makeLog({ level: 1, correct: true })]
    expect(confidenceFor(1, 2, 1, logs)).toBe('low')
  })

  it('gibt "high" zurück bei ≥4 Antworten, 0 pending, Level > 0', () => {
    const logs = Array.from({ length: 4 }, () => makeLog({ level: 1, correct: true }))
    expect(confidenceFor(4, 0, 1, logs)).toBe('high')
  })

  it('gibt "medium" zurück bei ausreichend Antworten und wenig pending', () => {
    const logs = Array.from({ length: 3 }, () => makeLog({ level: 1, correct: true }))
    expect(confidenceFor(3, 1, 1, logs)).toBe('medium')
  })

  it('gibt "low" zurück wenn Level 0 auch bei vielen Antworten', () => {
    const logs = Array.from({ length: 5 }, () => makeLog({ level: 1, correct: false }))
    expect(confidenceFor(5, 0, 0, logs)).toBe('medium')
  })
})

// ── summarizeLogs ────────────────────────────────────────────────────────────

describe('summarizeLogs', () => {
  it('gibt leeres Array für leere Logs zurück', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('gruppiert Logs nach Cluster', () => {
    const logs = [
      makeLog({ clusterId: 'c1', correct: true }),
      makeLog({ clusterId: 'c2', correct: false }),
      makeLog({ clusterId: 'c1', correct: true }),
    ]
    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.clusterId)).toContain('c1')
    expect(result.map(r => r.clusterId)).toContain('c2')
  })

  it('berechnet korrekte Treffer pro Cluster', () => {
    const logs = [
      makeLog({ clusterId: 'c1', correct: true }),
      makeLog({ clusterId: 'c1', correct: true }),
      makeLog({ clusterId: 'c1', correct: false }),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].correct).toBe(2)
    expect(result[0].answered).toBe(3)
  })

  it('zählt pending (null) Antworten korrekt', () => {
    const logs = [
      makeLog({ clusterId: 'c1', correct: null }),
      makeLog({ clusterId: 'c1', correct: true }),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].pending).toBe(1)
  })

  it('berechnet Mastery korrekt (ohne pending)', () => {
    const logs = [
      makeLog({ clusterId: 'c1', correct: true }),
      makeLog({ clusterId: 'c1', correct: false }),
      makeLog({ clusterId: 'c1', correct: null }),
    ]
    const result = summarizeLogs(logs)
    // 1 richtig, 1 falsch, 1 pending → mastery = 1/2 = 0.5
    expect(result[0].mastery).toBe(0.5)
  })

  it('behält die Reihenfolge des ersten Kontakts', () => {
    const logs = [
      makeLog({ clusterId: 'c2', correct: true }),
      makeLog({ clusterId: 'c1', correct: true }),
    ]
    const result = summarizeLogs(logs)
    expect(result[0].clusterId).toBe('c2')
    expect(result[1].clusterId).toBe('c1')
  })

  it('gibt reachedAfb null zurück wenn Level 0', () => {
    const logs = [makeLog({ clusterId: 'c1', correct: false })]
    const result = summarizeLogs(logs)
    expect(result[0].reachedAfb).toBeNull()
  })

  it('gibt reachedAfb "I" zurück bei Level 1', () => {
    const logs = [makeLog({ clusterId: 'c1', level: 1, correct: true })]
    const result = summarizeLogs(logs)
    expect(result[0].reachedAfb).toBe('I')
  })
})
