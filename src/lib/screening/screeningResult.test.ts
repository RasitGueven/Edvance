import { describe, it, expect } from 'vitest'
import { parseScreeningResult } from './screeningResult'

function makeCluster(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    clusterId: 'algebra',
    answered: 4,
    correct: 3,
    pending: 0,
    estimatedLevel: 2,
    reachedAfb: 'II',
    mastery: 0.75,
    confidence: 'high',
    ...overrides,
  }
}

describe('parseScreeningResult', () => {
  it('gibt null bei null-Input zurück', () => {
    expect(parseScreeningResult(null)).toBeNull()
  })

  it('gibt null bei falschem kind zurück', () => {
    expect(parseScreeningResult({ kind: 'legacy', clusters: [] })).toBeNull()
  })

  it('gibt null wenn clusters kein Array', () => {
    expect(parseScreeningResult({ kind: 'adaptive', clusters: null })).toBeNull()
  })

  it('parst gültiges Summary korrekt', () => {
    const result = parseScreeningResult({
      kind: 'adaptive',
      answered: 4,
      clusters: [makeCluster()],
    })
    expect(result).not.toBeNull()
    expect(result!.clusters).toHaveLength(1)
    expect(result!.clusters[0].clusterId).toBe('algebra')
    expect(result!.clusters[0].answered).toBe(4)
    expect(result!.clusters[0].correct).toBe(3)
  })

  it('berechnet overallPct korrekt', () => {
    const result = parseScreeningResult({
      kind: 'adaptive',
      clusters: [
        makeCluster({ clusterId: 'a', answered: 4, correct: 2, pending: 0, mastery: 0.5 }),
        makeCluster({ clusterId: 'b', answered: 4, correct: 4, pending: 0, mastery: 1.0 }),
      ],
    })
    // 6 richtig / 8 entschieden = 75%
    expect(result!.overallPct).toBe(75)
  })

  it('überspringt fehlerhafte Cluster-Einträge', () => {
    const result = parseScreeningResult({
      kind: 'adaptive',
      clusters: [
        makeCluster(),
        { clusterId: '', answered: 1 }, // leere clusterId → übersprungen
        null, // null → übersprungen
      ],
    })
    expect(result!.clusters).toHaveLength(1)
  })

  it('berechnet displayLevel innerhalb 1–10', () => {
    const result = parseScreeningResult({
      kind: 'adaptive',
      clusters: [makeCluster({ estimatedLevel: 3, mastery: 1.0 })],
    })
    expect(result!.clusters[0].displayLevel).toBeGreaterThanOrEqual(1)
    expect(result!.clusters[0].displayLevel).toBeLessThanOrEqual(10)
  })

  it('clampst displayLevel auf mindestens 1', () => {
    const result = parseScreeningResult({
      kind: 'adaptive',
      clusters: [makeCluster({ estimatedLevel: 0, mastery: 0 })],
    })
    expect(result!.clusters[0].displayLevel).toBeGreaterThanOrEqual(1)
  })

  it('setzt pending korrekt', () => {
    const result = parseScreeningResult({
      kind: 'adaptive',
      clusters: [makeCluster({ pending: 2, answered: 5, correct: 2 })],
    })
    expect(result!.clusters[0].pending).toBe(2)
    expect(result!.overallPending).toBe(2)
  })

  it('setzt reachedAfb aus estimatedLevel wenn nicht explizit angegeben', () => {
    const result = parseScreeningResult({
      kind: 'adaptive',
      clusters: [makeCluster({ reachedAfb: null, estimatedLevel: 1 })],
    })
    expect(result!.clusters[0].reachedAfb).toBe('I')
  })

  it('gibt "low" confidence bei unbekanntem Wert', () => {
    const result = parseScreeningResult({
      kind: 'adaptive',
      clusters: [makeCluster({ confidence: 'sehr_hoch' })],
    })
    expect(result!.clusters[0].confidence).toBe('low')
  })
})
