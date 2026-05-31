import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from '@/lib/screening/grade'

describe('tryAutoGradeOpen', () => {
  it('returns null when accepted list is empty', () => {
    expect(tryAutoGradeOpen([], 'Hallo')).toBeNull()
    expect(tryAutoGradeOpen(null, 'Hallo')).toBeNull()
    expect(tryAutoGradeOpen(undefined, 'Hallo')).toBeNull()
  })

  it('returns null for empty/null answer', () => {
    expect(tryAutoGradeOpen(['richtig'], '')).toBeNull()
    expect(tryAutoGradeOpen(['richtig'], null)).toBeNull()
  })

  it('matches case-insensitively and trims whitespace', () => {
    expect(tryAutoGradeOpen(['Richtig'], '  richtig  ')).toBe(true)
    expect(tryAutoGradeOpen(['RICHTIG'], 'richtig')).toBe(true)
  })

  it('normalises comma to period for decimal matching', () => {
    expect(tryAutoGradeOpen(['3.5'], '3,5')).toBe(true)
  })

  it('collapses multiple spaces', () => {
    expect(tryAutoGradeOpen(['zwei drei'], 'zwei  drei')).toBe(true)
  })

  it('returns null when answer does not match any accepted value', () => {
    expect(tryAutoGradeOpen(['richtig'], 'falsch')).toBeNull()
  })

  it('matches object with text property', () => {
    expect(tryAutoGradeOpen(['hallo'], { text: 'Hallo' })).toBe(true)
  })

  it('matches object with value property', () => {
    expect(tryAutoGradeOpen(['12'], { value: '12' })).toBe(true)
  })
})

describe('gradeScreeningAnswer – mc_index', () => {
  it('returns true when indices match', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 2 },
    })).toBe(true)
  })

  it('returns false when indices differ', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 3 },
    })).toBe(false)
  })

  it('returns false for missing or non-object inputs', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: null,
      answer: { index: 0 },
    })).toBe(false)
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 0 },
      answer: 'nope',
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

  it('returns true for string number with comma', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.5 },
      answer: '3,5',
    })).toBe(true)
  })

  it('respects tolerance', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 10.4 },
      tolerance: 0.5,
    })).toBe(true)
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 11 },
      tolerance: 0.5,
    })).toBe(false)
  })

  it('returns false for non-numeric answer', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 5 },
      answer: { value: 'abc' },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – matching_set', () => {
  const canonical = { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }

  it('returns true for correct pair set', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical,
      answer: { pairs: [{ left: 'B', right: '2' }, { left: 'A', right: '1' }] },
    })).toBe(true)
  })

  it('returns false for wrong pair', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical,
      answer: { pairs: [{ left: 'A', right: '2' }, { left: 'B', right: '1' }] },
    })).toBe(false)
  })

  it('returns false for missing pairs', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical,
      answer: { pairs: [{ left: 'A', right: '1' }] },
    })).toBe(false)
  })

  it('returns false for null input', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: null,
      answer: null,
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – normalized', () => {
  it('matches after normalization', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Berlin' },
      answer: { value: '  berlin  ' },
    })).toBe(true)
  })

  it('normalises comma to period', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: '3.5' },
      answer: '3,5',
    })).toBe(true)
  })

  it('returns false for non-matching normalized strings', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Berlin' },
      answer: { value: 'München' },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – slot_map', () => {
  it('returns true for exact slot assignment', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'c1', s2: 'c2' } },
      answer: { slots: { s1: 'c1', s2: 'c2' } },
    })).toBe(true)
  })

  it('returns false for wrong chip assignment', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'c1', s2: 'c2' } },
      answer: { slots: { s1: 'c2', s2: 'c1' } },
    })).toBe(false)
  })

  it('returns false for different number of slots', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'c1', s2: 'c2' } },
      answer: { slots: { s1: 'c1' } },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – manual', () => {
  it('returns true if answer matches accepted list', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: 'Ja',
      accepted: ['ja'],
    })).toBe(true)
  })

  it('returns null if no accepted list provided and no canonical match', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: 'irgendwas',
      accepted: null,
    })).toBeNull()
  })

  it('reads accepted from canonical.accepted if not passed directly', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['richtig'] },
      answer: 'Richtig',
    })).toBe(true)
  })
})

describe('gradeScreeningAnswer – unknown type', () => {
  it('returns false for unknown check_type', () => {
    expect(gradeScreeningAnswer({
      // @ts-expect-error – intentionally invalid type for test
      check_type: 'unknown_type',
      canonical: {},
      answer: {},
    })).toBe(false)
  })
})
