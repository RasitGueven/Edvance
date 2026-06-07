import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from '../../screening/grade'

// ── tryAutoGradeOpen ──────────────────────────────────────────────────────────

describe('tryAutoGradeOpen', () => {
  it('returns null when accepted is null', () => {
    expect(tryAutoGradeOpen(null, { text: '42' })).toBeNull()
  })

  it('returns null when accepted is empty array', () => {
    expect(tryAutoGradeOpen([], { text: '42' })).toBeNull()
  })

  it('returns null when answer is empty string', () => {
    expect(tryAutoGradeOpen(['42'], { text: '' })).toBeNull()
  })

  it('returns true for exact match (normalized)', () => {
    expect(tryAutoGradeOpen(['42'], { text: '42' })).toBe(true)
  })

  it('normalizes case and whitespace', () => {
    expect(tryAutoGradeOpen(['hallo welt'], { text: '  HALLO   WELT  ' })).toBe(true)
  })

  it('normalizes comma to dot', () => {
    expect(tryAutoGradeOpen(['3.14'], { text: '3,14' })).toBe(true)
  })

  it('returns null when no match found (not false)', () => {
    expect(tryAutoGradeOpen(['42'], { text: '43' })).toBeNull()
  })

  it('matches any accepted value', () => {
    expect(tryAutoGradeOpen(['vier', '4', 'IV'], { text: '4' })).toBe(true)
  })

  it('handles plain string answer', () => {
    expect(tryAutoGradeOpen(['paris'], 'Paris')).toBe(true)
  })
})

// ── gradeScreeningAnswer ──────────────────────────────────────────────────────

describe('gradeScreeningAnswer – mc_index', () => {
  it('returns true when index matches', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 2 },
    })).toBe(true)
  })

  it('returns false when index differs', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 3 },
    })).toBe(false)
  })

  it('returns false for non-object answer', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 1 },
      answer: 'abc',
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – numeric', () => {
  it('returns true for exact numeric match', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: { value: 42 },
    })).toBe(true)
  })

  it('returns false when out of tolerance', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: { value: 44 },
      tolerance: 1,
    })).toBe(false)
  })

  it('returns true within tolerance', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: { value: 43 },
      tolerance: 1,
    })).toBe(true)
  })

  it('converts comma to dot in string answer', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.14 },
      answer: '3,14',
    })).toBe(true)
  })

  it('returns false for non-numeric answer', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: 'keine Ahnung',
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – matching_set', () => {
  const canonical = {
    pairs: [
      { left: 'A', right: '1' },
      { left: 'B', right: '2' },
    ],
  }

  it('returns true for correct matching set', () => {
    const answer = {
      pairs: [
        { left: 'B', right: '2' },
        { left: 'A', right: '1' },
      ],
    }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(true)
  })

  it('returns false for wrong matching set', () => {
    const answer = {
      pairs: [
        { left: 'A', right: '2' },
        { left: 'B', right: '1' },
      ],
    }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
  })

  it('returns false for incomplete matching set', () => {
    const answer = { pairs: [{ left: 'A', right: '1' }] }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
  })
})

describe('gradeScreeningAnswer – normalized', () => {
  it('returns true for normalized string match', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'paris' },
      answer: { value: 'PARIS' },
    })).toBe(true)
  })

  it('returns false for different normalized strings', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'paris' },
      answer: { value: 'berlin' },
    })).toBe(false)
  })

  it('handles plain string canonical', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: 'Hallo Welt',
      answer: '  hallo   welt  ',
    })).toBe(true)
  })
})

describe('gradeScreeningAnswer – slot_map', () => {
  it('returns true for exact slot assignments', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'c1', s2: 'c2' } },
      answer: { slots: { s1: 'c1', s2: 'c2' } },
    })).toBe(true)
  })

  it('returns false when slot count differs', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'c1', s2: 'c2' } },
      answer: { slots: { s1: 'c1' } },
    })).toBe(false)
  })

  it('returns false when chip assignment differs', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'c1', s2: 'c2' } },
      answer: { slots: { s1: 'c2', s2: 'c1' } },
    })).toBe(false)
  })

  it('returns false for non-object input', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: null,
      answer: null,
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – manual', () => {
  it('returns true when answer matches accepted list', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['vier', '4'] },
      answer: { text: '4' },
    })).toBe(true)
  })

  it('returns null when no accepted list and no match', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: { text: 'irgendwas' },
    })).toBeNull()
  })

  it('uses args.accepted over canonical.accepted', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['falsch'] },
      answer: { text: 'richtig' },
      accepted: ['richtig'],
    })).toBe(true)
  })
})

describe('gradeScreeningAnswer – unknown check_type', () => {
  it('returns false for unknown check_type', () => {
    expect(gradeScreeningAnswer({
      // @ts-expect-error testing unknown type
      check_type: 'unknown_type',
      canonical: {},
      answer: {},
    })).toBe(false)
  })
})
