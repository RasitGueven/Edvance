import { describe, it, expect } from 'vitest'
import { tryAutoGradeOpen, gradeScreeningAnswer } from '../grade'

describe('tryAutoGradeOpen', () => {
  it('returns null for null accepted list', () => {
    expect(tryAutoGradeOpen(null, 'answer')).toBeNull()
  })

  it('returns null for empty accepted list', () => {
    expect(tryAutoGradeOpen([], 'answer')).toBeNull()
  })

  it('returns true for exact match (case-insensitive)', () => {
    expect(tryAutoGradeOpen(['Paris'], 'paris')).toBe(true)
    expect(tryAutoGradeOpen(['Paris'], 'Paris')).toBe(true)
    expect(tryAutoGradeOpen(['Paris'], 'PARIS')).toBe(true)
  })

  it('normalizes whitespace', () => {
    expect(tryAutoGradeOpen(['hello world'], 'hello  world')).toBe(true)
  })

  it('normalizes comma to dot', () => {
    expect(tryAutoGradeOpen(['3.14'], '3,14')).toBe(true)
  })

  it('returns null for non-matching answer (not false!)', () => {
    expect(tryAutoGradeOpen(['Paris'], 'London')).toBeNull()
  })

  it('handles object answers with .text property', () => {
    expect(tryAutoGradeOpen(['Paris'], { text: 'Paris' })).toBe(true)
  })

  it('handles object answers with .value property', () => {
    expect(tryAutoGradeOpen(['Paris'], { value: 'paris' })).toBe(true)
  })

  it('returns null for empty answer', () => {
    expect(tryAutoGradeOpen(['Paris'], '')).toBeNull()
    expect(tryAutoGradeOpen(['Paris'], '   ')).toBeNull()
  })

  it('matches against multiple accepted values', () => {
    expect(tryAutoGradeOpen(['Berlin', 'Hamburg', 'Paris'], 'hamburg')).toBe(true)
  })
})

describe('gradeScreeningAnswer', () => {
  describe('mc_index', () => {
    it('returns true for matching index', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'mc_index',
          canonical: { index: 2 },
          answer: { index: 2 },
        })
      ).toBe(true)
    })

    it('returns false for wrong index', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'mc_index',
          canonical: { index: 2 },
          answer: { index: 3 },
        })
      ).toBe(false)
    })

    it('returns false for missing canonical', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'mc_index',
          canonical: null,
          answer: { index: 1 },
        })
      ).toBe(false)
    })

    it('returns false for missing answer', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'mc_index',
          canonical: { index: 1 },
          answer: null,
        })
      ).toBe(false)
    })
  })

  describe('numeric', () => {
    it('returns true for exact numeric match', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'numeric',
          canonical: { value: 42 },
          answer: { value: 42 },
        })
      ).toBe(true)
    })

    it('returns false when outside tolerance', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'numeric',
          canonical: { value: 42 },
          answer: { value: 43 },
          tolerance: 0,
        })
      ).toBe(false)
    })

    it('returns true when within tolerance', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'numeric',
          canonical: { value: 42 },
          answer: { value: 43 },
          tolerance: 1,
        })
      ).toBe(true)
    })

    it('accepts string numbers', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'numeric',
          canonical: { value: 3.14 },
          answer: '3,14',
          tolerance: 0.001,
        })
      ).toBe(true)
    })

    it('accepts comma-separated decimals', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'numeric',
          canonical: { value: 2.5 },
          answer: { value: '2,5' },
        })
      ).toBe(true)
    })

    it('returns false for non-numeric answer', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'numeric',
          canonical: { value: 42 },
          answer: { value: 'abc' },
        })
      ).toBe(false)
    })

    it('uses absolute value of tolerance', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'numeric',
          canonical: { value: 10 },
          answer: { value: 9 },
          tolerance: -1,
        })
      ).toBe(true)
    })
  })

  describe('matching_set', () => {
    it('returns true for identical pair sets', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'matching_set',
          canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
          answer: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
        })
      ).toBe(true)
    })

    it('returns true regardless of pair order', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'matching_set',
          canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
          answer: { pairs: [{ left: 'B', right: '2' }, { left: 'A', right: '1' }] },
        })
      ).toBe(true)
    })

    it('returns false for wrong pairing', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'matching_set',
          canonical: { pairs: [{ left: 'A', right: '1' }] },
          answer: { pairs: [{ left: 'A', right: '2' }] },
        })
      ).toBe(false)
    })

    it('returns false for different set sizes', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'matching_set',
          canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
          answer: { pairs: [{ left: 'A', right: '1' }] },
        })
      ).toBe(false)
    })

    it('returns false for invalid input', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'matching_set',
          canonical: null,
          answer: null,
        })
      ).toBe(false)
    })
  })

  describe('normalized', () => {
    it('returns true for matching strings after normalization', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'normalized',
          canonical: { value: 'Hello World' },
          answer: { value: 'hello world' },
        })
      ).toBe(true)
    })

    it('normalizes whitespace and case', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'normalized',
          canonical: 'hello   world',
          answer: 'HELLO WORLD',
        })
      ).toBe(true)
    })

    it('returns false for different strings', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'normalized',
          canonical: { value: 'Paris' },
          answer: { value: 'Berlin' },
        })
      ).toBe(false)
    })

    it('handles direct string canonical', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'normalized',
          canonical: 'answer',
          answer: 'Answer',
        })
      ).toBe(true)
    })
  })

  describe('manual', () => {
    it('returns true when answer matches accepted list', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'manual',
          canonical: {},
          answer: 'Paris',
          accepted: ['Paris', 'paris'],
        })
      ).toBe(true)
    })

    it('returns null when no match in accepted list', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'manual',
          canonical: {},
          answer: 'London',
          accepted: ['Paris'],
        })
      ).toBeNull()
    })

    it('falls back to canonical.accepted if accepted arg not provided', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'manual',
          canonical: { accepted: ['Paris'] },
          answer: 'Paris',
        })
      ).toBe(true)
    })

    it('returns null when no accepted list exists anywhere', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'manual',
          canonical: {},
          answer: 'anything',
        })
      ).toBeNull()
    })
  })

  describe('default/unknown check_type', () => {
    it('returns false for unknown check_type', () => {
      expect(
        gradeScreeningAnswer({
          check_type: 'unknown_type' as never,
          canonical: {},
          answer: {},
        })
      ).toBe(false)
    })
  })
})
