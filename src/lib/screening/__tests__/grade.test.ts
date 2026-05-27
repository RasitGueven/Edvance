import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from '@/lib/screening/grade'

// ── tryAutoGradeOpen ─────────────────────────────────────────────────────────

describe('tryAutoGradeOpen', () => {
  it('returns null for null accepted list', () => {
    expect(tryAutoGradeOpen(null, 'anything')).toBeNull()
  })

  it('returns null for empty accepted list', () => {
    expect(tryAutoGradeOpen([], 'anything')).toBeNull()
  })

  it('returns true for exact normalized match', () => {
    expect(tryAutoGradeOpen(['42'], '42')).toBe(true)
  })

  it('normalizes case insensitively', () => {
    expect(tryAutoGradeOpen(['Hallo'], 'hallo')).toBe(true)
  })

  it('normalizes leading/trailing whitespace', () => {
    expect(tryAutoGradeOpen(['42'], '  42  ')).toBe(true)
  })

  it('normalizes comma to dot', () => {
    expect(tryAutoGradeOpen(['3.14'], '3,14')).toBe(true)
  })

  it('returns null for non-matching answer', () => {
    expect(tryAutoGradeOpen(['42'], '43')).toBeNull()
  })

  it('returns null for empty string answer', () => {
    expect(tryAutoGradeOpen(['42'], '')).toBeNull()
  })

  it('returns true when matching one of multiple accepted answers', () => {
    expect(tryAutoGradeOpen(['4', '2x+1', 'zwei'], 'zwei')).toBe(true)
  })

  it('reads answer from object.text', () => {
    expect(tryAutoGradeOpen(['42'], { text: '42' })).toBe(true)
  })

  it('reads answer from object.value', () => {
    expect(tryAutoGradeOpen(['42'], { value: '42' })).toBe(true)
  })
})

// ── gradeScreeningAnswer ─────────────────────────────────────────────────────

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

  it('returns false when canonical is missing index', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: {},
      answer: { index: 2 },
    })).toBe(false)
  })

  it('returns false for non-object canonical', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: null,
      answer: { index: 2 },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – numeric', () => {
  it('returns true for exact match', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: { value: 42 },
    })).toBe(true)
  })

  it('returns true within tolerance', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.14 },
      answer: { value: 3.15 },
      tolerance: 0.05,
    })).toBe(true)
  })

  it('returns false outside tolerance', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.14 },
      answer: { value: 3.20 },
      tolerance: 0.05,
    })).toBe(false)
  })

  it('parses string answer', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: '42',
    })).toBe(true)
  })

  it('normalizes comma decimal separator', () => {
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
      answer: 'abc',
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

  it('returns true for exact pair match', () => {
    const answer = {
      pairs: [
        { left: 'A', right: '1' },
        { left: 'B', right: '2' },
      ],
    }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(true)
  })

  it('returns true regardless of pair order', () => {
    const answer = {
      pairs: [
        { left: 'B', right: '2' },
        { left: 'A', right: '1' },
      ],
    }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(true)
  })

  it('returns false for wrong pairing', () => {
    const answer = {
      pairs: [
        { left: 'A', right: '2' },
        { left: 'B', right: '1' },
      ],
    }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
  })

  it('returns false for different number of pairs', () => {
    const answer = { pairs: [{ left: 'A', right: '1' }] }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
  })

  it('returns false for missing pairs key', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical,
      answer: null,
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – normalized', () => {
  it('returns true for matching strings (case insensitive)', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Hallo' },
      answer: { value: 'hallo' },
    })).toBe(true)
  })

  it('returns true after trimming', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: 'test',
      answer: '  test  ',
    })).toBe(true)
  })

  it('returns false for different strings', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: 'foo',
      answer: 'bar',
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – manual', () => {
  it('returns true when answer matches accepted list', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: '42',
      accepted: ['42'],
    })).toBe(true)
  })

  it('returns null when no accepted list (needs coach)', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: 'anything',
    })).toBeNull()
  })

  it('reads accepted from canonical.accepted', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['correct answer'] },
      answer: 'correct answer',
    })).toBe(true)
  })
})

describe('gradeScreeningAnswer – slot_map', () => {
  it('returns true for matching slot maps', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-A', s2: 'chip-B' } },
      answer: { slots: { s1: 'chip-A', s2: 'chip-B' } },
    })).toBe(true)
  })

  it('returns false for wrong slot value', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-A' } },
      answer: { slots: { s1: 'chip-B' } },
    })).toBe(false)
  })

  it('returns false for missing slots key', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-A' } },
      answer: null,
    })).toBe(false)
  })

  it('returns false for different number of slots', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-A', s2: 'chip-B' } },
      answer: { slots: { s1: 'chip-A' } },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – unknown check_type', () => {
  it('returns false for unknown check_type', () => {
    expect(gradeScreeningAnswer({
      check_type: 'unknown_type' as never,
      canonical: { value: 42 },
      answer: { value: 42 },
    })).toBe(false)
  })
})
