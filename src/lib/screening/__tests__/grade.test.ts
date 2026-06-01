import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from '@/lib/screening/grade'

describe('tryAutoGradeOpen', () => {
  it('returns null for empty accepted list', () => {
    expect(tryAutoGradeOpen([], 'answer')).toBeNull()
  })

  it('returns null for null accepted', () => {
    expect(tryAutoGradeOpen(null, 'answer')).toBeNull()
  })

  it('returns null for undefined accepted', () => {
    expect(tryAutoGradeOpen(undefined, 'answer')).toBeNull()
  })

  it('returns true on exact normalized match', () => {
    expect(tryAutoGradeOpen(['zwölf'], 'zwölf')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(tryAutoGradeOpen(['Paris'], 'paris')).toBe(true)
  })

  it('matches with extra whitespace', () => {
    expect(tryAutoGradeOpen(['paris'], '  paris  ')).toBe(true)
  })

  it('returns null when no match (not false)', () => {
    expect(tryAutoGradeOpen(['paris'], 'berlin')).toBeNull()
  })

  it('handles comma→dot normalization in strings', () => {
    expect(tryAutoGradeOpen(['3.14'], '3,14')).toBe(true)
  })

  it('extracts .text from object answers', () => {
    expect(tryAutoGradeOpen(['richtig'], { text: 'richtig' })).toBe(true)
  })
})

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
      answer: { index: 3 },
    })).toBe(false)
  })

  it('returns false for non-object inputs', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: 2,
      answer: 2,
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – numeric', () => {
  it('returns true for exact match', () => {
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

  it('handles string number input', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 5 },
      answer: '5',
      tolerance: 0,
    })).toBe(true)
  })

  it('handles comma-decimal string', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.14 },
      answer: '3,14',
      tolerance: 0,
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

describe('gradeScreeningAnswer – normalized', () => {
  it('returns true for matching normalized strings', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Berlin' },
      answer: { value: 'berlin' },
    })).toBe(true)
  })

  it('returns true collapsing whitespace', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'hallo welt' },
      answer: { value: 'hallo  welt' },
    })).toBe(true)
  })

  it('returns false for different strings', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Berlin' },
      answer: { value: 'Hamburg' },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – matching_set', () => {
  it('returns true for correct pair set', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
      answer: { pairs: [{ left: 'B', right: '2' }, { left: 'A', right: '1' }] },
    })).toBe(true)
  })

  it('returns false for wrong pairs', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: { pairs: [{ left: 'A', right: '1' }] },
      answer: { pairs: [{ left: 'A', right: '2' }] },
    })).toBe(false)
  })

  it('returns false for different sizes', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: { pairs: [{ left: 'A', right: '1' }] },
      answer: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – slot_map', () => {
  it('returns true for matching slot assignments', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'c1', s2: 'c2' } },
      answer: { slots: { s1: 'c1', s2: 'c2' } },
    })).toBe(true)
  })

  it('returns false for wrong assignment', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'c1' } },
      answer: { slots: { s1: 'c2' } },
    })).toBe(false)
  })

  it('returns false for extra slots', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'c1' } },
      answer: { slots: { s1: 'c1', s2: 'c2' } },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – manual', () => {
  it('returns true if answer matches accepted list', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: 'richtig',
      accepted: ['richtig', 'korrekt'],
    })).toBe(true)
  })

  it('returns null if no match (needs coach)', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: 'irgendwas',
      accepted: ['richtig'],
    })).toBeNull()
  })

  it('reads accepted from canonical.accepted', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['gut'] },
      answer: 'gut',
    })).toBe(true)
  })
})

describe('gradeScreeningAnswer – unknown check_type', () => {
  it('returns false for unknown check_type', () => {
    expect(gradeScreeningAnswer({
      check_type: 'unknown_type' as never,
      canonical: {},
      answer: {},
    })).toBe(false)
  })
})
