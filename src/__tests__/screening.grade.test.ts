import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from '@/lib/screening/grade'

// ── tryAutoGradeOpen ──────────────────────────────────────────────────────────

describe('tryAutoGradeOpen', () => {
  it('returns true for exact match in accepted list', () => {
    expect(tryAutoGradeOpen(['vier', '4'], '4')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(tryAutoGradeOpen(['Vier'], 'VIER')).toBe(true)
  })

  it('trims whitespace before comparison', () => {
    expect(tryAutoGradeOpen(['vier'], '  vier  ')).toBe(true)
  })

  it('normalizes comma to dot', () => {
    expect(tryAutoGradeOpen(['3.14'], '3,14')).toBe(true)
  })

  it('returns null when no match', () => {
    expect(tryAutoGradeOpen(['vier'], 'fünf')).toBeNull()
  })

  it('returns null for empty accepted list', () => {
    expect(tryAutoGradeOpen([], '4')).toBeNull()
  })

  it('returns null for null accepted', () => {
    expect(tryAutoGradeOpen(null, '4')).toBeNull()
  })

  it('returns null for empty answer string', () => {
    expect(tryAutoGradeOpen(['vier'], '')).toBeNull()
  })

  it('accepts answer as object with text property', () => {
    expect(tryAutoGradeOpen(['vier'], { text: 'vier' })).toBe(true)
  })

  it('accepts answer as object with value property', () => {
    expect(tryAutoGradeOpen(['4'], { value: '4' })).toBe(true)
  })
})

// ── gradeScreeningAnswer – mc_index ──────────────────────────────────────────

describe('gradeScreeningAnswer – mc_index', () => {
  it('returns true for matching index', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 2 },
    })).toBe(true)
  })

  it('returns false for wrong index', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 0 },
    })).toBe(false)
  })

  it('returns false for non-object canonical', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: null,
      answer: { index: 0 },
    })).toBe(false)
  })
})

// ── gradeScreeningAnswer – numeric ───────────────────────────────────────────

describe('gradeScreeningAnswer – numeric', () => {
  it('returns true for exact numeric match', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: { value: 42 },
      tolerance: 0,
    })).toBe(true)
  })

  it('returns true within tolerance', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 10.5 },
      tolerance: 1,
    })).toBe(true)
  })

  it('returns false outside tolerance', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 12 },
      tolerance: 1,
    })).toBe(false)
  })

  it('parses string answers', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.14 },
      answer: '3,14',
      tolerance: 0.01,
    })).toBe(true)
  })

  it('returns false for non-numeric answer', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 5 },
      answer: 'abc',
    })).toBe(false)
  })
})

// ── gradeScreeningAnswer – matching_set ──────────────────────────────────────

describe('gradeScreeningAnswer – matching_set', () => {
  const canonical = { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }

  it('returns true for correct matching set', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical,
      answer: { pairs: [{ left: 'B', right: '2' }, { left: 'A', right: '1' }] },
    })).toBe(true)
  })

  it('returns false for wrong matching', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical,
      answer: { pairs: [{ left: 'A', right: '2' }, { left: 'B', right: '1' }] },
    })).toBe(false)
  })

  it('returns false for different size', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical,
      answer: { pairs: [{ left: 'A', right: '1' }] },
    })).toBe(false)
  })
})

// ── gradeScreeningAnswer – normalized ────────────────────────────────────────

describe('gradeScreeningAnswer – normalized', () => {
  it('returns true for case-insensitive match', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Paris' },
      answer: { value: 'paris' },
    })).toBe(true)
  })

  it('returns true for whitespace-normalized match', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'hallo welt' },
      answer: { value: '  Hallo   Welt  ' },
    })).toBe(true)
  })

  it('returns false for different values', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Berlin' },
      answer: { value: 'München' },
    })).toBe(false)
  })
})

// ── gradeScreeningAnswer – slot_map ──────────────────────────────────────────

describe('gradeScreeningAnswer – slot_map', () => {
  it('returns true for matching slot assignments', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-A', s2: 'chip-B' } },
      answer: { slots: { s1: 'chip-A', s2: 'chip-B' } },
    })).toBe(true)
  })

  it('returns false for wrong chip assignment', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-A', s2: 'chip-B' } },
      answer: { slots: { s1: 'chip-B', s2: 'chip-A' } },
    })).toBe(false)
  })

  it('returns false when slot count differs', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-A', s2: 'chip-B' } },
      answer: { slots: { s1: 'chip-A' } },
    })).toBe(false)
  })
})

// ── gradeScreeningAnswer – manual ────────────────────────────────────────────

describe('gradeScreeningAnswer – manual', () => {
  it('returns true when answer matches accepted list', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['vier', '4'] },
      answer: '4',
    })).toBe(true)
  })

  it('returns null when no match (needs coach)', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['vier'] },
      answer: 'fünf',
    })).toBeNull()
  })

  it('uses accepted param over canonical.accepted', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['falsch'] },
      answer: 'richtig',
      accepted: ['richtig'],
    })).toBe(true)
  })
})

// ── gradeScreeningAnswer – default/unknown ────────────────────────────────────

describe('gradeScreeningAnswer – unknown check_type', () => {
  it('returns false for unknown check_type', () => {
    expect(gradeScreeningAnswer({
      check_type: 'unknown_type' as unknown as 'mc_index',
      canonical: {},
      answer: {},
    })).toBe(false)
  })
})
