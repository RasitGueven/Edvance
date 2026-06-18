import { describe, it, expect } from 'vitest'
import { gradeScreeningAnswer, tryAutoGradeOpen } from './grade'

describe('tryAutoGradeOpen', () => {
  it('gibt null zurück wenn keine accepted-Liste vorhanden', () => {
    expect(tryAutoGradeOpen(null, 'Antwort')).toBeNull()
    expect(tryAutoGradeOpen([], 'Antwort')).toBeNull()
    expect(tryAutoGradeOpen(undefined, 'Antwort')).toBeNull()
  })

  it('gibt null zurück bei leerer Antwort', () => {
    expect(tryAutoGradeOpen(['richtig'], '')).toBeNull()
    expect(tryAutoGradeOpen(['richtig'], null)).toBeNull()
  })

  it('matched normalisiert (case-insensitiv, trim, Komma→Punkt)', () => {
    expect(tryAutoGradeOpen(['3.5'], '3,5')).toBe(true)
    expect(tryAutoGradeOpen(['hallo'], '  HALLO  ')).toBe(true)
    expect(tryAutoGradeOpen(['zwei drittel'], 'Zwei  Drittel')).toBe(true)
  })

  it('gibt null zurück wenn keine Übereinstimmung (nicht false!)', () => {
    expect(tryAutoGradeOpen(['richtig'], 'falsch')).toBeNull()
  })

  it('matched Antwort als Objekt mit text-Property', () => {
    expect(tryAutoGradeOpen(['hallo'], { text: 'Hallo' })).toBe(true)
  })

  it('matched Antwort als Objekt mit value-Property', () => {
    expect(tryAutoGradeOpen(['42'], { value: '42' })).toBe(true)
  })
})

describe('gradeScreeningAnswer – mc_index', () => {
  it('true bei korrektem Index', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 2 },
    })).toBe(true)
  })

  it('false bei falschem Index', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 0 },
    })).toBe(false)
  })

  it('false bei fehlendem canonical oder answer', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: null,
      answer: { index: 0 },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – numeric', () => {
  it('true bei exaktem numerischen Treffer', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: { value: 42 },
    })).toBe(true)
  })

  it('true bei Antwort als String mit Komma', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.5 },
      answer: { value: '3,5' },
    })).toBe(true)
  })

  it('true innerhalb der Toleranz', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 10.05 },
      tolerance: 0.1,
    })).toBe(true)
  })

  it('false außerhalb der Toleranz', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 10.2 },
      tolerance: 0.1,
    })).toBe(false)
  })

  it('false bei nicht-numerischer Antwort', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 5 },
      answer: { value: 'nicht_numerisch' },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – matching_set', () => {
  it('true bei exakt übereinstimmenden Paaren', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
      answer: { pairs: [{ left: 'B', right: '2' }, { left: 'A', right: '1' }] },
    })).toBe(true)
  })

  it('false bei falschen Paaren', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: { pairs: [{ left: 'A', right: '1' }] },
      answer: { pairs: [{ left: 'A', right: '2' }] },
    })).toBe(false)
  })

  it('false bei unterschiedlicher Anzahl von Paaren', () => {
    expect(gradeScreeningAnswer({
      check_type: 'matching_set',
      canonical: { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] },
      answer: { pairs: [{ left: 'A', right: '1' }] },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – normalized', () => {
  it('true bei gleicher normalisierter Antwort', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'drei viertel' },
      answer: { value: 'Drei Viertel' },
    })).toBe(true)
  })

  it('normalisiert Komma zu Punkt', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: 'zwei komma fünf',
      answer: 'Zwei Komma Fünf',
    })).toBe(true)
  })

  it('false bei anderer Antwort', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'vier' },
      answer: { value: 'fünf' },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – slot_map', () => {
  it('true bei exakt übereinstimmenden Slots', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip_a', s2: 'chip_b' } },
      answer: { slots: { s1: 'chip_a', s2: 'chip_b' } },
    })).toBe(true)
  })

  it('false bei falsch belegtem Slot', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip_a' } },
      answer: { slots: { s1: 'chip_b' } },
    })).toBe(false)
  })

  it('false bei fehlendem Slot in Antwort', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip_a', s2: 'chip_b' } },
      answer: { slots: { s1: 'chip_a' } },
    })).toBe(false)
  })
})

describe('gradeScreeningAnswer – manual', () => {
  it('true bei Treffer in accepted-Liste', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: { text: '42' },
      accepted: ['42'],
    })).toBe(true)
  })

  it('null bei keinem Treffer (Coach muss entscheiden)', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: { text: 'andere Antwort' },
      accepted: ['42'],
    })).toBeNull()
  })

  it('liest accepted aus canonical.accepted wenn accepted nicht direkt gesetzt', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['hallo'] },
      answer: 'Hallo',
    })).toBe(true)
  })
})

describe('gradeScreeningAnswer – unbekannter check_type', () => {
  it('gibt false für unbekannte check_type zurück', () => {
    expect(gradeScreeningAnswer({
      check_type: 'unbekannt' as never,
      canonical: {},
      answer: {},
    })).toBe(false)
  })
})
