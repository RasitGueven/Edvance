import { describe, it, expect } from 'vitest'
import {
  buildCoverage,
  getCell,
  cellStatus,
} from '@/lib/screening/v2/coverage'
import type { ScreeningItem } from '@/types'

// Minimal ScreeningItem stub for coverage tests
function makeItem(
  id: string,
  clusterId: string,
  active: boolean,
  afb: 'I' | 'II' | 'III' | null,
  phase: 'sprint' | 'tiefe' | null,
  topic = 'math',
  level: 1 | 2 | 3 = 1,
): ScreeningItem {
  return {
    id,
    created_at: '2024-01-01',
    cluster_id: clusterId,
    class_level: 8,
    topic,
    skill_code: 'SK1',
    skill_label: 'Test',
    level,
    curriculum_seq: null,
    input_type: 'MC',
    prompt: `Item ${id}`,
    payload: {},
    canonical: { index: 0 },
    check_type: 'mc_index',
    tolerance: null,
    typical_errors: [],
    explanation: null,
    source: 'test',
    active,
    afb,
    phase,
  }
}

describe('buildCoverage', () => {
  it('items without afb are ignored', () => {
    const items = [makeItem('noafb', 'c1', true, null, 'sprint')]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(0)
  })

  it('items without phase are ignored', () => {
    const items = [makeItem('nophase', 'c1', true, 'I', null)]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(0)
  })

  it('items with both afb and phase are counted', () => {
    const items = [makeItem('ok', 'c1', true, 'I', 'sprint')]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(1)
  })

  it('active item increments activeCount', () => {
    const items = [makeItem('a1', 'c1', true, 'I', 'sprint')]
    const matrix = buildCoverage(items)
    const cell = getCell(matrix, 'c1', 'sprint', 'I')
    expect(cell.activeCount).toBe(1)
    expect(cell.draftCount).toBe(0)
  })

  it('inactive item increments draftCount', () => {
    const items = [makeItem('d1', 'c1', false, 'II', 'tiefe')]
    const matrix = buildCoverage(items)
    const cell = getCell(matrix, 'c1', 'tiefe', 'II')
    expect(cell.activeCount).toBe(0)
    expect(cell.draftCount).toBe(1)
  })

  it('multiple items in same cell accumulate counts', () => {
    const items = [
      makeItem('a1', 'c1', true, 'III', 'sprint'),
      makeItem('a2', 'c1', true, 'III', 'sprint'),
      makeItem('d1', 'c1', false, 'III', 'sprint'),
    ]
    const matrix = buildCoverage(items)
    const cell = getCell(matrix, 'c1', 'sprint', 'III')
    expect(cell.activeCount).toBe(2)
    expect(cell.draftCount).toBe(1)
  })

  it('different clusters are separate cells', () => {
    const items = [
      makeItem('a', 'c1', true, 'I', 'sprint'),
      makeItem('b', 'c2', true, 'I', 'sprint'),
    ]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(2)
  })

  it('different afb values create separate cells for same cluster+phase', () => {
    const items = [
      makeItem('a', 'c1', true, 'I', 'sprint'),
      makeItem('b', 'c1', true, 'II', 'sprint'),
      makeItem('c', 'c1', true, 'III', 'sprint'),
    ]
    const matrix = buildCoverage(items)
    expect(matrix.size).toBe(3)
  })

  it('empty items array produces empty matrix', () => {
    expect(buildCoverage([])).toEqual(new Map())
  })
})

describe('getCell', () => {
  it('returns zero-cell when key is missing from matrix', () => {
    const matrix = buildCoverage([])
    const cell = getCell(matrix, 'nonexistent', 'sprint', 'I')
    expect(cell.activeCount).toBe(0)
    expect(cell.draftCount).toBe(0)
    expect(cell.clusterId).toBe('nonexistent')
    expect(cell.phase).toBe('sprint')
    expect(cell.afb).toBe('I')
  })

  it('returns the correct cell when present', () => {
    const items = [makeItem('x', 'c1', true, 'II', 'tiefe')]
    const matrix = buildCoverage(items)
    const cell = getCell(matrix, 'c1', 'tiefe', 'II')
    expect(cell.activeCount).toBe(1)
    expect(cell.clusterId).toBe('c1')
  })
})

describe('cellStatus', () => {
  it('0 active → missing', () => {
    expect(cellStatus({ clusterId: 'c1', phase: 'sprint', afb: 'I', activeCount: 0, draftCount: 0 })).toBe('missing')
  })

  it('1 active → thin', () => {
    expect(cellStatus({ clusterId: 'c1', phase: 'sprint', afb: 'I', activeCount: 1, draftCount: 0 })).toBe('thin')
  })

  it('2 active → ok', () => {
    expect(cellStatus({ clusterId: 'c1', phase: 'sprint', afb: 'I', activeCount: 2, draftCount: 0 })).toBe('ok')
  })

  it('3 active → ok', () => {
    expect(cellStatus({ clusterId: 'c1', phase: 'sprint', afb: 'I', activeCount: 3, draftCount: 5 })).toBe('ok')
  })

  it('0 active with drafts → still missing', () => {
    expect(cellStatus({ clusterId: 'c1', phase: 'tiefe', afb: 'III', activeCount: 0, draftCount: 5 })).toBe('missing')
  })
})
