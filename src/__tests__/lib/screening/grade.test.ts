import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from '@/lib/screening/grade'

// ── tryAutoGradeOpen ──────────────────────────────────────────────────────────

describe('tryAutoGradeOpen', () => {
  it('returns null when accepted list is empty', () => {
    expect(tryAutoGradeOpen([], 'answer')).toBeNull()
    expect(tryAutoGradeOpen(null, 'answer')).toBeNull()
  })

  it('returns true on exact match (case-insensitive, trimmed)', () => {
    expect(tryAutoGradeOpen(['Berlin'], '  berlin  ')).toBe(true)
  })

  it('returns true when answer matches one of multiple accepted values', () => {
    expect(tryAutoGradeOpen(['Köln', 'Koeln'], 'Koeln')).toBe(true)
  })

  it('normalises comma to dot for number strings', () => {
    expect(tryAutoGradeOpen(['3.14'], '3,14')).toBe(true)
  })

  it('returns null (not false) when no match found', () => {
    expect(tryAutoGradeOpen(['Berlin'], 'München')).toBeNull()
  })

  it('returns null for empty raw answer', () => {
    expect(tryAutoGradeOpen(['Berlin'], '')).toBeNull()
  })

  it('extracts text from object answer', () => {
    expect(tryAutoGradeOpen(['Berlin'], { text: 'berlin' })).toBe(true)
  })
})

// ── gradeScreeningAnswer ──────────────────────────────────────────────────────

describe('gradeScreeningAnswer – mc_index', () => {
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
        canonical: { index: 2 },
        answer: { index: 3 },
      }),
    ).toBe(false)
  })

  it('returns false for non-object inputs', () => {
    expect(
      gradeScreeningAnswer({ check_type: 'mc_index', canonical: null, answer: null }),
    ).toBe(false)
  })
})

describe('gradeScreeningAnswer – numeric', () => {
  it('returns true for exact match', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 42 },
        answer: { value: 42 },
      }),
    ).toBe(true)
  })

  it('returns true within tolerance', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 10 },
        answer: { value: 10.5 },
        tolerance: 1,
      }),
    ).toBe(true)
  })

  it('returns false outside tolerance', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 10 },
        answer: { value: 12 },
        tolerance: 1,
      }),
    ).toBe(false)
  })

  it('accepts string answer with comma (German decimal)', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 3.14 },
        answer: '3,14',
        tolerance: 0.01,
      }),
    ).toBe(true)
  })

  it('returns false for non-numeric input', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'numeric',
        canonical: { value: 5 },
        answer: 'abc',
      }),
    ).toBe(false)
  })
})

describe('gradeScreeningAnswer – matching_set', () => {
  const canonical = { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }

  it('returns true for exact match', () => {
    const answer = { pairs: [{ left: 'B', right: '2' }, { left: 'A', right: '1' }] }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(true)
  })

  it('returns false when a pair is wrong', () => {
    const answer = { pairs: [{ left: 'A', right: '2' }, { left: 'B', right: '1' }] }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
  })

  it('returns false for mismatched pair count', () => {
    const answer = { pairs: [{ left: 'A', right: '1' }] }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
  })
})

describe('gradeScreeningAnswer – normalized', () => {
  it('returns true for same text ignoring case and extra spaces', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'normalized',
        canonical: { value: 'Dreieck' },
        answer: { value: '  dreieck  ' },
      }),
    ).toBe(true)
  })

  it('returns false for different text', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'normalized',
        canonical: { value: 'Dreieck' },
        answer: { value: 'Viereck' },
      }),
    ).toBe(false)
  })
})

describe('gradeScreeningAnswer – slot_map', () => {
  it('returns true when all slots match', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'slot_map',
        canonical: { slots: { s1: 'chipA', s2: 'chipB' } },
        answer: { slots: { s1: 'chipA', s2: 'chipB' } },
      }),
    ).toBe(true)
  })

  it('returns false when a slot value differs', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'slot_map',
        canonical: { slots: { s1: 'chipA', s2: 'chipB' } },
        answer: { slots: { s1: 'chipA', s2: 'chipC' } },
      }),
    ).toBe(false)
  })

  it('returns false when slot count differs', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'slot_map',
        canonical: { slots: { s1: 'chipA', s2: 'chipB' } },
        answer: { slots: { s1: 'chipA' } },
      }),
    ).toBe(false)
  })
})

describe('gradeScreeningAnswer – manual', () => {
  it('returns true when answer is in accepted list', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'manual',
        canonical: {},
        answer: { text: 'Berlin' },
        accepted: ['Berlin', 'berlin'],
      }),
    ).toBe(true)
  })

  it('returns null when answer is not in accepted list', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'manual',
        canonical: {},
        answer: { text: 'Hamburg' },
        accepted: ['Berlin'],
      }),
    ).toBeNull()
  })
})

describe('gradeScreeningAnswer – unknown type', () => {
  it('returns false for unknown check_type', () => {
    expect(
      gradeScreeningAnswer({
        check_type: 'unknown_type' as any,
        canonical: {},
        answer: {},
      }),
    ).toBe(false)
  })
})
