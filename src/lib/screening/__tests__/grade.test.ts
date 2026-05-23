import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from '../grade'

// ── tryAutoGradeOpen ─────────────────────────────────────────────────────────

describe('tryAutoGradeOpen', () => {
  it('returns true for exact match', () => {
    expect(tryAutoGradeOpen(['42'], { text: '42' })).toBe(true)
  })

  it('returns true after trimming and lowercasing', () => {
    expect(tryAutoGradeOpen(['Berlin'], '  berlin  ')).toBe(true)
  })

  it('returns true when comma is normalized to dot', () => {
    expect(tryAutoGradeOpen(['3.5'], '3,5')).toBe(true)
  })

  it('returns null for no match (not false)', () => {
    expect(tryAutoGradeOpen(['42'], { text: '99' })).toBeNull()
  })

  it('returns null when accepted list is empty', () => {
    expect(tryAutoGradeOpen([], '42')).toBeNull()
  })

  it('returns null when accepted is null', () => {
    expect(tryAutoGradeOpen(null, '42')).toBeNull()
  })

  it('returns null for empty answer', () => {
    expect(tryAutoGradeOpen(['42'], '')).toBeNull()
  })

  it('matches from object with value property', () => {
    expect(tryAutoGradeOpen(['Berlin'], { value: 'Berlin' })).toBe(true)
  })
})

// ── gradeScreeningAnswer: mc_index ───────────────────────────────────────────

describe('gradeScreeningAnswer — mc_index', () => {
  it('returns true when index matches', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'mc_index',
        canonical: { index: 2 },
        answer: { index: 2 },
      }),
    ).toBe(true)
  })

  it('returns false when index differs', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'mc_index',
        canonical: { index: 1 },
        answer: { index: 3 },
      }),
    ).toBe(false)
  })

  it('returns false for non-object inputs', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'mc_index',
        canonical: null,
        answer: { index: 0 },
      }),
    ).toBe(false)
  })
})

// ── gradeScreeningAnswer: numeric ────────────────────────────────────────────

describe('gradeScreeningAnswer — numeric', () => {
  it('returns true for exact numeric match', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 42 },
        answer: { value: 42 },
      }),
    ).toBe(true)
  })

  it('accepts string numbers', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 3.5 },
        answer: { value: '3,5' },
      }),
    ).toBe(true)
  })

  it('returns true within tolerance', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 10 },
        answer: { value: 10.05 },
        tolerance: 0.1,
      }),
    ).toBe(true)
  })

  it('returns false outside tolerance', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 10 },
        answer: { value: 11 },
        tolerance: 0.5,
      }),
    ).toBe(false)
  })

  it('returns false for non-numeric answer', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 5 },
        answer: { value: 'abc' },
      }),
    ).toBe(false)
  })

  it('handles answer as plain number (not wrapped in object)', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 7 },
        answer: 7,
      }),
    ).toBe(true)
  })
})

// ── gradeScreeningAnswer: matching_set ───────────────────────────────────────

describe('gradeScreeningAnswer — matching_set', () => {
  it('returns true for exact pair match', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'matching_set',
        canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
        answer: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
      }),
    ).toBe(true)
  })

  it('returns true regardless of pair order in answer', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'matching_set',
        canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
        answer: { pairs: [{ left: 'B', right: '2' }, { left: 'A', right: '1' }] },
      }),
    ).toBe(true)
  })

  it('returns false when one pair is wrong', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'matching_set',
        canonical: { pairs: [{ left: 'A', right: '1' }] },
        answer: { pairs: [{ left: 'A', right: '2' }] },
      }),
    ).toBe(false)
  })

  it('returns false for different set sizes', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'matching_set',
        canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
        answer: { pairs: [{ left: 'A', right: '1' }] },
      }),
    ).toBe(false)
  })

  it('returns false for null input', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'matching_set',
        canonical: null,
        answer: null,
      }),
    ).toBe(false)
  })
})

// ── gradeScreeningAnswer: normalized ─────────────────────────────────────────

describe('gradeScreeningAnswer — normalized', () => {
  it('returns true for matching strings ignoring case and whitespace', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'normalized',
        canonical: { value: 'Berlin' },
        answer: { value: '  berlin  ' },
      }),
    ).toBe(true)
  })

  it('normalizes comma to dot', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'normalized',
        canonical: { value: '3.5' },
        answer: '3,5',
      }),
    ).toBe(true)
  })

  it('returns false for non-matching strings', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'normalized',
        canonical: { value: 'Berlin' },
        answer: { value: 'Hamburg' },
      }),
    ).toBe(false)
  })
})

// ── gradeScreeningAnswer: manual ─────────────────────────────────────────────

describe('gradeScreeningAnswer — manual', () => {
  it('returns true when answer is in accepted list', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'manual',
        canonical: {},
        answer: 'ja',
        accepted: ['Ja', 'Yes'],
      }),
    ).toBe(true)
  })

  it('returns null when no accepted list and no match', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'manual',
        canonical: {},
        answer: 'something',
        accepted: null,
      }),
    ).toBeNull()
  })

  it('reads accepted from canonical.accepted if not provided', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'manual',
        canonical: { accepted: ['richtig'] },
        answer: 'richtig',
      }),
    ).toBe(true)
  })
})

// ── gradeScreeningAnswer: unknown type ───────────────────────────────────────

describe('gradeScreeningAnswer — unknown type', () => {
  it('returns false for unrecognized check_type via default case', () => {
    expect(
      gradeScreeningAnswer({
        // @ts-expect-error: testing unknown type
        check_type: 'totally_unknown',
        canonical: {},
        answer: {},
      }),
    ).toBe(false)
  })
})
