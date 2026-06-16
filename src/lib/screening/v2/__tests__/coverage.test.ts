import { describe, it, expect } from 'vitest'
import {
  buildCoverage,
  getCell,
  cellStatus,
  AFB_VALUES,
  PHASE_VALUES,
} from '@/lib/screening/v2/coverage'
import type { ScreeningItem } from '@/types'

function makeItem(overrides: Partial<ScreeningItem> = {}): ScreeningItem {
  return {
    id: 'item-1',
    cluster_id: 'cluster-1',
    phase: 'sprint',
    afb: 'I',
    active: true,
    title: 'Test Item',
    question: 'Was ist 2 + 2?',
    check_type: 'mc_index',
    canonical_answer: { index: 0 },
    options: null,
    accepted_answers: null,
    tolerance: null,
    input_type: 'MC',
    estimated_seconds: 30,
    sort_order: 1,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// ── Konstanten ───────────────────────────────────────────────────────────────

describe('Konstanten', () => {
  it('AFB_VALUES enthält alle 3 AFB-Stufen', () => {
    expect(AFB_VALUES).toEqual(['I', 'II', 'III'])
  })

  it('PHASE_VALUES enthält sprint und tiefe', () => {
    expect(PHASE_VALUES).toContain('sprint')
    expect(PHASE_VALUES).toContain('tiefe')
  })
})

// ── buildCoverage ────────────────────────────────────────────────────────────

describe('buildCoverage', () => {
  it('gibt leere Map für leere Item-Liste zurück', () => {
    expect(buildCoverage([])).toEqual(new Map())
  })

  it('ignoriert Items ohne afb oder phase', () => {
    const items = [
      makeItem({ afb: null }),
      makeItem({ phase: null }),
    ]
    expect(buildCoverage(items).size).toBe(0)
  })

  it('zählt aktive Items in die richtige Zelle', () => {
    const items = [
      makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'I', active: true }),
      makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'I', active: true }),
    ]
    const matrix = buildCoverage(items)
    const cell = matrix.get('c1|sprint|I')
    expect(cell?.activeCount).toBe(2)
    expect(cell?.draftCount).toBe(0)
  })

  it('zählt Draft-Items separat', () => {
    const items = [
      makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'I', active: true }),
      makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'I', active: false }),
    ]
    const matrix = buildCoverage(items)
    const cell = matrix.get('c1|sprint|I')
    expect(cell?.activeCount).toBe(1)
    expect(cell?.draftCount).toBe(1)
  })

  it('trennt verschiedene Cluster korrekt', () => {
    const items = [
      makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'I', active: true }),
      makeItem({ cluster_id: 'c2', phase: 'sprint', afb: 'I', active: true }),
    ]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(2)
    expect(matrix.has('c1|sprint|I')).toBe(true)
    expect(matrix.has('c2|sprint|I')).toBe(true)
  })

  it('trennt verschiedene Phasen korrekt', () => {
    const items = [
      makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'I', active: true }),
      makeItem({ cluster_id: 'c1', phase: 'tiefe', afb: 'I', active: true }),
    ]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(2)
  })

  it('trennt verschiedene AFB-Stufen korrekt', () => {
    const items = [
      makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'I', active: true }),
      makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'II', active: true }),
      makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'III', active: true }),
    ]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(3)
  })
})

// ── getCell ──────────────────────────────────────────────────────────────────

describe('getCell', () => {
  it('gibt existierende Zelle zurück', () => {
    const items = [makeItem({ cluster_id: 'c1', phase: 'sprint', afb: 'I', active: true })]
    const matrix = buildCoverage(items)
    const cell = getCell(matrix, 'c1', 'sprint', 'I')
    expect(cell.activeCount).toBe(1)
  })

  it('gibt leere Default-Zelle zurück wenn nicht vorhanden', () => {
    const matrix = buildCoverage([])
    const cell = getCell(matrix, 'nonexistent', 'sprint', 'I')
    expect(cell.activeCount).toBe(0)
    expect(cell.draftCount).toBe(0)
    expect(cell.clusterId).toBe('nonexistent')
    expect(cell.phase).toBe('sprint')
    expect(cell.afb).toBe('I')
  })
})

// ── cellStatus ───────────────────────────────────────────────────────────────

describe('cellStatus', () => {
  it('gibt "missing" zurück wenn activeCount = 0', () => {
    const cell = { clusterId: 'c1', phase: 'sprint' as const, afb: 'I' as const, activeCount: 0, draftCount: 0 }
    expect(cellStatus(cell)).toBe('missing')
  })

  it('gibt "thin" zurück wenn activeCount = 1', () => {
    const cell = { clusterId: 'c1', phase: 'sprint' as const, afb: 'I' as const, activeCount: 1, draftCount: 0 }
    expect(cellStatus(cell)).toBe('thin')
  })

  it('gibt "ok" zurück wenn activeCount >= 2', () => {
    const cell2 = { clusterId: 'c1', phase: 'sprint' as const, afb: 'I' as const, activeCount: 2, draftCount: 0 }
    const cell5 = { clusterId: 'c1', phase: 'sprint' as const, afb: 'I' as const, activeCount: 5, draftCount: 0 }
    expect(cellStatus(cell2)).toBe('ok')
    expect(cellStatus(cell5)).toBe('ok')
  })
})
