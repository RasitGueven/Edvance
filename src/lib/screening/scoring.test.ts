import { describe, it, expect } from 'vitest'
import {
  levelToAfb,
  requiredHits,
  correctOnLevel,
  estimateLevel,
  confidenceFor,
  summarizeLogs,
} from './scoring'
import type { AdaptiveAnswerLog } from './adaptive'
import type { ScreeningLevel } from '@/types'

function makeLog(level: ScreeningLevel, correct: boolean | null, itemId = 'item'): AdaptiveAnswerLog {
  return { itemId, clusterId: 'cluster-1', level, correct, durationMs: 1000 }
}

describe('levelToAfb', () => {
  it('konvertiert Level 1 → AFB I', () => expect(levelToAfb(1)).toBe('I'))
  it('konvertiert Level 2 → AFB II', () => expect(levelToAfb(2)).toBe('II'))
  it('konvertiert Level 3 → AFB III', () => expect(levelToAfb(3)).toBe('III'))
  it('gibt null bei Level 0 zurück', () => expect(levelToAfb(0)).toBeNull())
})

describe('requiredHits', () => {
  it('benötigt 1 Treffer für Level 1', () => expect(requiredHits(1)).toBe(1))
  it('benötigt 1 Treffer für Level 2', () => expect(requiredHits(2)).toBe(1))
  it('benötigt 2 Treffer für Level 3 (Lucky-Guess-Schutz)', () => expect(requiredHits(3)).toBe(2))
})

describe('correctOnLevel', () => {
  it('zählt korrekte Antworten auf einem Level', () => {
    const log = [
      makeLog(1, true, 'i1'),
      makeLog(1, false, 'i2'),
      makeLog(2, true, 'i3'),
      makeLog(1, true, 'i4'),
    ]
    expect(correctOnLevel(log, 1)).toBe(2)
    expect(correctOnLevel(log, 2)).toBe(1)
    expect(correctOnLevel(log, 3)).toBe(0)
  })

  it('zählt pending (null) nicht als korrekt', () => {
    const log = [makeLog(1, null, 'i1'), makeLog(1, true, 'i2')]
    expect(correctOnLevel(log, 1)).toBe(1)
  })
})

describe('estimateLevel', () => {
  it('gibt 0 bei leerem Log zurück', () => {
    expect(estimateLevel([])).toBe(0)
  })

  it('gibt Level 1 bei einem richtigen L1-Item zurück', () => {
    const log = [makeLog(1, true, 'i1')]
    expect(estimateLevel(log)).toBe(1)
  })

  it('gibt Level 2 wenn L1 und L2 bestätigt', () => {
    const log = [
      makeLog(1, true, 'i1'),
      makeLog(2, true, 'i2'),
    ]
    expect(estimateLevel(log)).toBe(2)
  })

  it('setzt Level 3 voraus: mind. 2 richtige L3-Items', () => {
    const log = [
      makeLog(1, true, 'i1'),
      makeLog(2, true, 'i2'),
      makeLog(3, true, 'i3'),  // nur 1 Treffer auf L3 → reicht nicht
    ]
    expect(estimateLevel(log)).toBe(2)
  })

  it('gibt Level 3 bei 2 richtigen L3-Items zurück', () => {
    const log = [
      makeLog(1, true, 'i1'),
      makeLog(2, true, 'i2'),
      makeLog(3, true, 'i3'),
      makeLog(3, true, 'i4'),
    ]
    expect(estimateLevel(log)).toBe(3)
  })

  it('downgradet wenn Mastery auf bestem Level < 50%', () => {
    // 2 richtige auf L3 (erfüllt requiredHits), aber 3 falsche → Mastery 2/5 = 40% < 50%
    const log = [
      makeLog(1, true, 'i1'),
      makeLog(2, true, 'i2'),
      makeLog(3, true, 'i3'),
      makeLog(3, true, 'i4'),
      makeLog(3, false, 'i5'),
      makeLog(3, false, 'i6'),
      makeLog(3, false, 'i7'),
    ]
    expect(estimateLevel(log)).toBe(2)
  })
})

describe('confidenceFor', () => {
  it('gibt "low" bei wenigen Antworten zurück', () => {
    const log = [makeLog(1, true)]
    expect(confidenceFor(1, 2, 1, log)).toBe('low')
  })

  it('gibt "high" bei ≥4 Antworten, pending=0, Level>0, min 1 Treffer', () => {
    const log = [
      makeLog(1, true, 'i1'),
      makeLog(1, true, 'i2'),
      makeLog(1, true, 'i3'),
      makeLog(1, true, 'i4'),
    ]
    expect(confidenceFor(4, 0, 1, log)).toBe('high')
  })

  it('gibt "medium" bei ≥2 Antworten und wenigen pending', () => {
    const log = [makeLog(1, true, 'i1'), makeLog(1, true, 'i2')]
    expect(confidenceFor(2, 0, 1, log)).toBe('medium')
  })
})

describe('summarizeLogs', () => {
  it('gibt leeres Array bei keinen Logs zurück', () => {
    expect(summarizeLogs([])).toEqual([])
  })

  it('fasst Logs nach Cluster zusammen', () => {
    const logs: AdaptiveAnswerLog[] = [
      { itemId: 'i1', clusterId: 'algebra', level: 1, correct: true, durationMs: 1000 },
      { itemId: 'i2', clusterId: 'algebra', level: 2, correct: false, durationMs: 2000 },
      { itemId: 'i3', clusterId: 'geometrie', level: 1, correct: true, durationMs: 1500 },
    ]
    const result = summarizeLogs(logs)
    expect(result).toHaveLength(2)
    const algebra = result.find(r => r.clusterId === 'algebra')!
    expect(algebra.answered).toBe(2)
    expect(algebra.correct).toBe(1)
  })

  it('behält die Reihenfolge des ersten Kontakts', () => {
    const logs: AdaptiveAnswerLog[] = [
      { itemId: 'i1', clusterId: 'B', level: 1, correct: true, durationMs: 1000 },
      { itemId: 'i2', clusterId: 'A', level: 1, correct: true, durationMs: 1000 },
    ]
    const result = summarizeLogs(logs)
    expect(result[0].clusterId).toBe('B')
    expect(result[1].clusterId).toBe('A')
  })

  it('berechnet Mastery korrekt (richtig / entschieden)', () => {
    const logs: AdaptiveAnswerLog[] = [
      { itemId: 'i1', clusterId: 'c1', level: 1, correct: true, durationMs: 1000 },
      { itemId: 'i2', clusterId: 'c1', level: 1, correct: false, durationMs: 1000 },
      { itemId: 'i3', clusterId: 'c1', level: 1, correct: null, durationMs: 1000 }, // pending
    ]
    const result = summarizeLogs(logs)
    const c1 = result[0]
    expect(c1.mastery).toBeCloseTo(0.5) // 1 richtig / 2 entschieden (null ignoriert)
    expect(c1.pending).toBe(1)
  })

  it('setzt reachedAfb korrekt', () => {
    const logs: AdaptiveAnswerLog[] = [
      { itemId: 'i1', clusterId: 'c1', level: 1, correct: true, durationMs: 1000 },
      { itemId: 'i2', clusterId: 'c1', level: 2, correct: true, durationMs: 1000 },
    ]
    const result = summarizeLogs(logs)
    expect(result[0].reachedAfb).toBe('II')
  })
})
