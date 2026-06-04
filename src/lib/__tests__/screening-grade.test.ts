import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from '@/lib/screening/grade'

describe('tryAutoGradeOpen', () => {
  it('returns null when accepted list is empty', () => {
    expect(tryAutoGradeOpen([], 'test')).toBeNull()
  })

  it('returns null when accepted is null/undefined', () => {
    expect(tryAutoGradeOpen(null, 'test')).toBeNull()
    expect(tryAutoGradeOpen(undefined, 'test')).toBeNull()
  })

  it('returns true for exact case-insensitive match', () => {
    expect(tryAutoGradeOpen(['Hallo'], 'HALLO')).toBe(true)
  })

  it('normalizes whitespace and commas', () => {
    expect(tryAutoGradeOpen(['3.14'], '3,14')).toBe(true)
    expect(tryAutoGradeOpen(['Hallo Welt'], 'hallo  welt')).toBe(true)
  })

  it('returns null for non-matching answer', () => {
    expect(tryAutoGradeOpen(['richtig'], 'falsch')).toBeNull()
  })

  it('handles answer as object with .text property', () => {
    expect(tryAutoGradeOpen(['hallo'], { text: 'Hallo' })).toBe(true)
  })

  it('handles answer as object with .value property', () => {
    expect(tryAutoGradeOpen(['welt'], { value: 'Welt' })).toBe(true)
  })
})

describe('gradeScreeningAnswer – mc_index', () => {
  it('returns true for matching index', () => {
    const result = gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 2 },
    })
    expect(result).toBe(true)
  })

  it('returns false for wrong index', () => {
    const result = gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 3 },
    })
    expect(result).toBe(false)
  })

  it('returns false for missing objects', () => {
    expect(gradeScreeningAnswer({ check_type: 'mc_index', canonical: null, answer: null })).toBe(false)
  })
})

describe('gradeScreeningAnswer – numeric', () => {
  it('returns true for exact numeric match', () => {
    const result = gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: { value: 42 },
    })
    expect(result).toBe(true)
  })

  it('returns true within tolerance', () => {
    const result = gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 10.5 },
      tolerance: 1,
    })
    expect(result).toBe(true)
  })

  it('returns false outside tolerance', () => {
    const result = gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 12 },
      tolerance: 1,
    })
    expect(result).toBe(false)
  })

  it('parses comma-decimal string answers', () => {
    const result = gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.14 },
      answer: '3,14',
      tolerance: 0.01,
    })
    expect(result).toBe(true)
  })

  it('returns false for non-numeric answer', () => {
    const result = gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 5 },
      answer: 'abc',
    })
    expect(result).toBe(false)
  })
})

describe('gradeScreeningAnswer – normalized', () => {
  it('matches after normalization', () => {
    const result = gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Hallo Welt' },
      answer: { value: 'hallo  welt' },
    })
    expect(result).toBe(true)
  })

  it('returns false for different text', () => {
    const result = gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'richtig' },
      answer: { value: 'falsch' },
    })
    expect(result).toBe(false)
  })
})

describe('gradeScreeningAnswer – matching_set', () => {
  it('returns true for matching pair sets', () => {
    const result = gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
      answer: { pairs: [{ left: 'B', right: '2' }, { left: 'A', right: '1' }] },
    })
    expect(result).toBe(true)
  })

  it('returns false for wrong pairing', () => {
    const result = gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: { pairs: [{ left: 'A', right: '1' }] },
      answer: { pairs: [{ left: 'A', right: '2' }] },
    })
    expect(result).toBe(false)
  })

  it('returns false for different set sizes', () => {
    const result = gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: { pairs: [{ left: 'A', right: '1' }] },
      answer: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
    })
    expect(result).toBe(false)
  })
})

describe('gradeScreeningAnswer – slot_map', () => {
  it('returns true for identical slot maps', () => {
    const result = gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { slot1: 'chip-A', slot2: 'chip-B' } },
      answer: { slots: { slot1: 'chip-A', slot2: 'chip-B' } },
    })
    expect(result).toBe(true)
  })

  it('returns false for wrong chip assignment', () => {
    const result = gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { slot1: 'chip-A' } },
      answer: { slots: { slot1: 'chip-B' } },
    })
    expect(result).toBe(false)
  })

  it('returns false when slot counts differ', () => {
    const result = gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { slot1: 'chip-A', slot2: 'chip-B' } },
      answer: { slots: { slot1: 'chip-A' } },
    })
    expect(result).toBe(false)
  })
})

describe('gradeScreeningAnswer – manual', () => {
  it('returns true for matching accepted answer', () => {
    const result = gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['korrekt', 'richtig'] },
      answer: { text: 'Richtig' },
    })
    expect(result).toBe(true)
  })

  it('returns null when no match (coach must decide)', () => {
    const result = gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: 'unbekannte Antwort',
    })
    expect(result).toBeNull()
  })

  it('falls back to accepted param over canonical', () => {
    const result = gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: 'ja',
      accepted: ['ja'],
    })
    expect(result).toBe(true)
  })
})

describe('gradeScreeningAnswer – default/unknown type', () => {
  it('returns false for unknown check_type', () => {
    const result = gradeScreeningAnswer({
      check_type: 'unknown_type' as never,
      canonical: {},
      answer: {},
    })
    expect(result).toBe(false)
  })
})
