import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer } from '@/lib/screening/grade'

describe('gradeScreeningAnswer()', () => {
  // ── mc_index ────────────────────────────────────────────────────────────────
  describe('check_type: mc_index', () => {
    it('returns true when indexes match', () => {
      expect(gradeScreeningAnswer({ check_type: 'mc_index', canonical: { index: 2 }, answer: { index: 2 } })).toBe(true)
    })

    it('returns false when indexes differ', () => {
      expect(gradeScreeningAnswer({ check_type: 'mc_index', canonical: { index: 2 }, answer: { index: 1 } })).toBe(false)
    })

    it('returns false for non-object answer', () => {
      expect(gradeScreeningAnswer({ check_type: 'mc_index', canonical: { index: 2 }, answer: 2 })).toBe(false)
    })

    it('returns false for non-object canonical', () => {
      expect(gradeScreeningAnswer({ check_type: 'mc_index', canonical: null, answer: { index: 2 } })).toBe(false)
    })
  })

  // ── numeric ─────────────────────────────────────────────────────────────────
  describe('check_type: numeric', () => {
    it('returns true for exact match', () => {
      expect(gradeScreeningAnswer({ check_type: 'numeric', canonical: { value: 42 }, answer: { value: 42 } })).toBe(true)
    })

    it('returns true within tolerance', () => {
      expect(gradeScreeningAnswer({ check_type: 'numeric', canonical: { value: 10 }, answer: { value: 10.05 }, tolerance: 0.1 })).toBe(true)
    })

    it('returns false outside tolerance', () => {
      expect(gradeScreeningAnswer({ check_type: 'numeric', canonical: { value: 10 }, answer: { value: 10.5 }, tolerance: 0.1 })).toBe(false)
    })

    it('parses string answer with comma decimal', () => {
      expect(gradeScreeningAnswer({ check_type: 'numeric', canonical: { value: 3.14 }, answer: { value: '3,14' }, tolerance: 0 })).toBe(true)
    })

    it('returns false for non-numeric string', () => {
      expect(gradeScreeningAnswer({ check_type: 'numeric', canonical: { value: 5 }, answer: { value: 'abc' } })).toBe(false)
    })

    it('defaults tolerance to 0 when null', () => {
      expect(gradeScreeningAnswer({ check_type: 'numeric', canonical: { value: 7 }, answer: { value: 7.1 }, tolerance: null })).toBe(false)
    })

    it('parses flat number answer (not nested in object)', () => {
      expect(gradeScreeningAnswer({ check_type: 'numeric', canonical: { value: 5 }, answer: 5 })).toBe(true)
    })
  })

  // ── matching_set ────────────────────────────────────────────────────────────
  describe('check_type: matching_set', () => {
    const canonical = { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }

    it('returns true for correct matching set', () => {
      const answer = { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }
      expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(true)
    })

    it('returns true regardless of pair order', () => {
      const answer = { pairs: [{ left: 'B', right: '2' }, { left: 'A', right: '1' }] }
      expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(true)
    })

    it('returns false for wrong mapping', () => {
      const answer = { pairs: [{ left: 'A', right: '2' }, { left: 'B', right: '1' }] }
      expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
    })

    it('returns false for missing pairs', () => {
      const answer = { pairs: [{ left: 'A', right: '1' }] }
      expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
    })

    it('returns false for null answer', () => {
      expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer: null })).toBe(false)
    })
  })

  // ── normalized ──────────────────────────────────────────────────────────────
  describe('check_type: normalized', () => {
    it('returns true for case-insensitive match', () => {
      expect(gradeScreeningAnswer({ check_type: 'normalized', canonical: { value: 'Hallo' }, answer: { value: 'hallo' } })).toBe(true)
    })

    it('returns true ignoring leading/trailing whitespace', () => {
      expect(gradeScreeningAnswer({ check_type: 'normalized', canonical: { value: 'test' }, answer: { value: '  test  ' } })).toBe(true)
    })

    it('returns true replacing comma with dot', () => {
      expect(gradeScreeningAnswer({ check_type: 'normalized', canonical: { value: '3.14' }, answer: { value: '3,14' } })).toBe(true)
    })

    it('returns false for wrong value', () => {
      expect(gradeScreeningAnswer({ check_type: 'normalized', canonical: { value: 'Hallo' }, answer: { value: 'Welt' } })).toBe(false)
    })

    it('handles flat string canonical', () => {
      expect(gradeScreeningAnswer({ check_type: 'normalized', canonical: 'hello', answer: 'HELLO' })).toBe(true)
    })
  })

  // ── unknown check_type ───────────────────────────────────────────────────────
  describe('unknown check_type', () => {
    it('returns false', () => {
      expect(gradeScreeningAnswer({
        check_type: 'unknown_type' as never,
        canonical: { value: 1 },
        answer: { value: 1 },
      })).toBe(false)
    })
  })
})
