import { describe, it, expect } from 'vitest'
import {
  buildCoverage,
  getCell,
  cellStatus,
  AFB_VALUES,
  PHASE_VALUES,
} from '../coverage'
import type { ScreeningItem } from '@/types'

function makeItem(overrides: Partial<ScreeningItem> = {}): ScreeningItem {
  return {
    id: 'item-1',
    created_at: '2024-01-01T00:00:00Z',
    cluster_id: 'cluster-1',
    class_level: 8,
    topic: 'Algebra',
    skill_code: 'ALG-01',
    skill_label: 'Gleichungen',
    level: 1,
    curriculum_seq: null,
    input_type: 'MC',
    prompt: 'Was ist 2+2?',
    payload: {},
    canonical: { index: 0 },
    check_type: 'mc_index',
    tolerance: null,
    typical_errors: [],
    explanation: null,
    source: 'manual',
    active: true,
    afb: 'I',
    phase: 'sprint',
    ...overrides,
  }
}

describe('AFB_VALUES and PHASE_VALUES', () => {
  it('AFB_VALUES contains I, II, III', () => {
    expect(AFB_VALUES).toEqual(['I', 'II', 'III'])
  })

  it('PHASE_VALUES contains sprint and tiefe', () => {
    expect(PHASE_VALUES).toEqual(['sprint', 'tiefe'])
  })
})

describe('buildCoverage', () => {
  it('returns empty map for empty items', () => {
    expect(buildCoverage([])).toEqual(new Map())
  })

  it('skips items without afb or phase', () => {
    const item = makeItem({ afb: null, phase: null })
    const matrix = buildCoverage([item])
    expect(matrix.size).toBe(0)
  })

  it('skips items with missing afb but present phase', () => {
    const item = makeItem({ afb: null, phase: 'sprint' })
    const matrix = buildCoverage([item])
    expect(matrix.size).toBe(0)
  })

  it('creates a cell for a valid active item', () => {
    const item = makeItem({ active: true, afb: 'I', phase: 'sprint', cluster_id: 'c1' })
    const matrix = buildCoverage([item])
    expect(matrix.size).toBe(1)
    const cell = matrix.get('c1|sprint|I')
    expect(cell?.activeCount).toBe(1)
    expect(cell?.draftCount).toBe(0)
  })

  it('creates a cell for a draft item', () => {
    const item = makeItem({ active: false, afb: 'II', phase: 'tiefe', cluster_id: 'c1' })
    const matrix = buildCoverage([item])
    const cell = matrix.get('c1|tiefe|II')
    expect(cell?.activeCount).toBe(0)
    expect(cell?.draftCount).toBe(1)
  })

  it('accumulates counts for same cluster/phase/afb', () => {
    const items = [
      makeItem({ active: true, afb: 'I', phase: 'sprint', cluster_id: 'c1', id: 'i1' }),
      makeItem({ active: true, afb: 'I', phase: 'sprint', cluster_id: 'c1', id: 'i2' }),
      makeItem({ active: false, afb: 'I', phase: 'sprint', cluster_id: 'c1', id: 'i3' }),
    ]
    const matrix = buildCoverage(items)
    const cell = matrix.get('c1|sprint|I')
    expect(cell?.activeCount).toBe(2)
    expect(cell?.draftCount).toBe(1)
  })

  it('creates separate cells for different clusters', () => {
    const items = [
      makeItem({ cluster_id: 'c1', afb: 'I', phase: 'sprint', id: 'i1' }),
      makeItem({ cluster_id: 'c2', afb: 'I', phase: 'sprint', id: 'i2' }),
    ]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(2)
  })

  it('handles all afb/phase combinations', () => {
    const items = [
      makeItem({ cluster_id: 'c1', afb: 'I', phase: 'sprint', id: 'i1' }),
      makeItem({ cluster_id: 'c1', afb: 'II', phase: 'sprint', id: 'i2' }),
      makeItem({ cluster_id: 'c1', afb: 'III', phase: 'sprint', id: 'i3' }),
      makeItem({ cluster_id: 'c1', afb: 'I', phase: 'tiefe', id: 'i4' }),
      makeItem({ cluster_id: 'c1', afb: 'II', phase: 'tiefe', id: 'i5' }),
      makeItem({ cluster_id: 'c1', afb: 'III', phase: 'tiefe', id: 'i6' }),
    ]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(6)
  })
})

describe('getCell', () => {
  it('returns the cell from matrix when it exists', () => {
    const item = makeItem({ active: true, afb: 'II', phase: 'tiefe', cluster_id: 'c1' })
    const matrix = buildCoverage([item])
    const cell = getCell(matrix, 'c1', 'tiefe', 'II')
    expect(cell.activeCount).toBe(1)
    expect(cell.draftCount).toBe(0)
  })

  it('returns default empty cell when not found', () => {
    const matrix = buildCoverage([])
    const cell = getCell(matrix, 'missing', 'sprint', 'I')
    expect(cell.activeCount).toBe(0)
    expect(cell.draftCount).toBe(0)
    expect(cell.clusterId).toBe('missing')
    expect(cell.phase).toBe('sprint')
    expect(cell.afb).toBe('I')
  })
})

describe('cellStatus', () => {
  it('returns missing when activeCount is 0', () => {
    expect(cellStatus({ clusterId: 'c', phase: 'sprint', afb: 'I', activeCount: 0, draftCount: 2 }))
      .toBe('missing')
  })

  it('returns thin when activeCount is exactly 1', () => {
    expect(cellStatus({ clusterId: 'c', phase: 'sprint', afb: 'I', activeCount: 1, draftCount: 0 }))
      .toBe('thin')
  })

  it('returns ok when activeCount >= 2', () => {
    expect(cellStatus({ clusterId: 'c', phase: 'sprint', afb: 'I', activeCount: 2, draftCount: 0 }))
      .toBe('ok')
    expect(cellStatus({ clusterId: 'c', phase: 'sprint', afb: 'I', activeCount: 10, draftCount: 0 }))
      .toBe('ok')
  })
})
