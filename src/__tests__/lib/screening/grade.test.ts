import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from '@/lib/screening/grade'
import type { ScreeningCheckType } from '@/types'

// slot_map exists in grade.ts switch but is not in the ScreeningCheckType union —
// cast via unknown to exercise the runtime branch without a TS compile error.
type ExtendedCheckType = ScreeningCheckType | 'slot_map'

describe('gradeScreeningAnswer', () => {
  describe('mc_index', () => {
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
        answer: { index: 1 },
      })).toBe(false)
    })

    it('returns false when canonical is missing', () => {
      expect(gradeScreeningAnswer({
        check_type: 'mc_index',
        canonical: null,
        answer: { index: 0 },
      })).toBe(false)
    })

    it('returns false when answer is missing', () => {
      expect(gradeScreeningAnswer({
        check_type: 'mc_index',
        canonical: { index: 0 },
        answer: null,
      })).toBe(false)
    })
  })

  describe('numeric', () => {
    it('exact match returns true', () => {
      expect(gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 42 },
        answer: { value: 42 },
      })).toBe(true)
    })

    it('within tolerance returns true', () => {
      expect(gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 10 },
        answer: { value: 10.5 },
        tolerance: 1,
      })).toBe(true)
    })

    it('outside tolerance returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 10 },
        answer: { value: 12 },
        tolerance: 1,
      })).toBe(false)
    })

    it('comma as decimal separator is handled', () => {
      expect(gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 3.14 },
        answer: '3,14',
      })).toBe(true)
    })

    it('non-finite canonical returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: NaN },
        answer: { value: 5 },
      })).toBe(false)
    })

    it('non-finite answer returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 5 },
        answer: 'abc',
      })).toBe(false)
    })
  })

  describe('matching_set', () => {
    const canonical = { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }

    it('exact pair match returns true', () => {
      expect(gradeScreeningAnswer({
        check_type: 'matching_set',
        canonical,
        answer: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
      })).toBe(true)
    })

    it('wrong pair value returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: 'matching_set',
        canonical,
        answer: { pairs: [{ left: 'A', right: '2' }, { left: 'B', right: '1' }] },
      })).toBe(false)
    })

    it('missing pairs returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: 'matching_set',
        canonical,
        answer: { pairs: [{ left: 'A', right: '1' }] },
      })).toBe(false)
    })

    it('extra pairs returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: 'matching_set',
        canonical,
        answer: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }, { left: 'C', right: '3' }] },
      })).toBe(false)
    })
  })

  describe('normalized', () => {
    it('exact normalized match returns true', () => {
      expect(gradeScreeningAnswer({
        check_type: 'normalized',
        canonical: { value: 'hello' },
        answer: { value: 'hello' },
      })).toBe(true)
    })

    it('case insensitive match returns true', () => {
      expect(gradeScreeningAnswer({
        check_type: 'normalized',
        canonical: 'Hello',
        answer: 'HELLO',
      })).toBe(true)
    })

    it('trimmed whitespace matches', () => {
      expect(gradeScreeningAnswer({
        check_type: 'normalized',
        canonical: 'test',
        answer: '  test  ',
      })).toBe(true)
    })

    it('comma→dot normalization', () => {
      expect(gradeScreeningAnswer({
        check_type: 'normalized',
        canonical: '3.5',
        answer: '3,5',
      })).toBe(true)
    })
  })

  describe('slot_map', () => {
    const checkType = 'slot_map' as unknown as ScreeningCheckType

    it('exact slot match returns true', () => {
      expect(gradeScreeningAnswer({
        check_type: checkType,
        canonical: { slots: { s1: 'chip1', s2: 'chip2' } },
        answer: { slots: { s1: 'chip1', s2: 'chip2' } },
      })).toBe(true)
    })

    it('wrong slot value returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: checkType,
        canonical: { slots: { s1: 'chip1' } },
        answer: { slots: { s1: 'chip2' } },
      })).toBe(false)
    })

    it('missing slot returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: checkType,
        canonical: { slots: { s1: 'chip1', s2: 'chip2' } },
        answer: { slots: { s1: 'chip1' } },
      })).toBe(false)
    })

    it('extra slot in answer returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: checkType,
        canonical: { slots: { s1: 'chip1' } },
        answer: { slots: { s1: 'chip1', s2: 'chip2' } },
      })).toBe(false)
    })
  })

  describe('manual', () => {
    it('returns true when answer matches accepted list', () => {
      expect(gradeScreeningAnswer({
        check_type: 'manual',
        canonical: {},
        answer: 'Paris',
        accepted: ['Paris', 'paris'],
      })).toBe(true)
    })

    it('returns null when answer not in accepted list', () => {
      expect(gradeScreeningAnswer({
        check_type: 'manual',
        canonical: {},
        answer: 'London',
        accepted: ['Paris'],
      })).toBeNull()
    })

    it('returns null when accepted list is empty', () => {
      expect(gradeScreeningAnswer({
        check_type: 'manual',
        canonical: {},
        answer: 'Paris',
        accepted: [],
      })).toBeNull()
    })
  })
})

describe('tryAutoGradeOpen', () => {
  it('returns null when accepted list is null', () => {
    expect(tryAutoGradeOpen(null, 'answer')).toBeNull()
  })

  it('returns null when accepted list is empty', () => {
    expect(tryAutoGradeOpen([], 'answer')).toBeNull()
  })

  it('returns true on normalized match', () => {
    expect(tryAutoGradeOpen(['Paris'], 'PARIS')).toBe(true)
  })

  it('returns null on mismatch', () => {
    expect(tryAutoGradeOpen(['Paris'], 'Berlin')).toBeNull()
  })

  it('returns true for object with text property', () => {
    expect(tryAutoGradeOpen(['paris'], { text: 'Paris' })).toBe(true)
  })

  it('returns true for object with value property', () => {
    expect(tryAutoGradeOpen(['42'], { value: '42' })).toBe(true)
  })
})
