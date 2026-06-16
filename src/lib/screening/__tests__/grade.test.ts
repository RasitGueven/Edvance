import { describe, it, expect } from 'vitest'
import {
  gradeScreeningAnswer,
  tryAutoGradeOpen,
} from '@/lib/screening/grade'

// ── tryAutoGradeOpen ─────────────────────────────────────────────────────────

describe('tryAutoGradeOpen', () => {
  it('gibt null zurück wenn accepted null ist', () => {
    expect(tryAutoGradeOpen(null, 'Antwort')).toBeNull()
  })

  it('gibt null zurück wenn accepted undefined ist', () => {
    expect(tryAutoGradeOpen(undefined, 'Antwort')).toBeNull()
  })

  it('gibt null zurück bei leerer accepted-Liste', () => {
    expect(tryAutoGradeOpen([], 'Antwort')).toBeNull()
  })

  it('gibt true zurück bei exakter Übereinstimmung', () => {
    expect(tryAutoGradeOpen(['42'], '42')).toBe(true)
  })

  it('ist case-insensitiv', () => {
    expect(tryAutoGradeOpen(['Hallo'], 'HALLO')).toBe(true)
    expect(tryAutoGradeOpen(['ABC'], 'abc')).toBe(true)
  })

  it('ignoriert führende/abschließende Leerzeichen', () => {
    expect(tryAutoGradeOpen(['hallo'], '  hallo  ')).toBe(true)
  })

  it('normalisiert Komma zu Punkt', () => {
    expect(tryAutoGradeOpen(['3.14'], '3,14')).toBe(true)
  })

  it('gibt null zurück wenn kein Match gefunden', () => {
    expect(tryAutoGradeOpen(['42'], '43')).toBeNull()
    expect(tryAutoGradeOpen(['ja', 'nein'], 'vielleicht')).toBeNull()
  })

  it('matcht über mehrere Kandidaten', () => {
    expect(tryAutoGradeOpen(['ja', 'Ja', 'JA'], 'ja')).toBe(true)
  })

  it('akzeptiert Antwort als Objekt mit .text', () => {
    expect(tryAutoGradeOpen(['42'], { text: '42' })).toBe(true)
  })

  it('akzeptiert Antwort als Objekt mit .value', () => {
    expect(tryAutoGradeOpen(['42'], { value: '42' })).toBe(true)
  })
})

// ── gradeScreeningAnswer – mc_index ─────────────────────────────────────────

describe('gradeScreeningAnswer: mc_index', () => {
  it('gibt true zurück bei korrektem Index', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 2 },
    })).toBe(true)
  })

  it('gibt false zurück bei falschem Index', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 2 },
      answer: { index: 1 },
    })).toBe(false)
  })

  it('gibt false zurück wenn canonical kein Objekt ist', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: null,
      answer: { index: 0 },
    })).toBe(false)
  })

  it('gibt false zurück wenn answer kein Objekt ist', () => {
    expect(gradeScreeningAnswer({
      check_type: 'mc_index',
      canonical: { index: 0 },
      answer: null,
    })).toBe(false)
  })
})

// ── gradeScreeningAnswer – numeric ───────────────────────────────────────────

describe('gradeScreeningAnswer: numeric', () => {
  it('gibt true zurück bei exakter Übereinstimmung', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: { value: 42 },
    })).toBe(true)
  })

  it('gibt false zurück bei falschem Wert', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 42 },
      answer: { value: 43 },
    })).toBe(false)
  })

  it('akzeptiert Toleranz', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 10.1 },
      tolerance: 0.5,
    })).toBe(true)
  })

  it('rejected Wert außerhalb Toleranz', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 10 },
      answer: { value: 11 },
      tolerance: 0.5,
    })).toBe(false)
  })

  it('parst String-Zahlen korrekt', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.14 },
      answer: '3.14',
    })).toBe(true)
  })

  it('normalisiert Komma zu Punkt', () => {
    expect(gradeScreeningAnswer({
      check_type: 'numeric',
      canonical: { value: 3.14 },
      answer: '3,14',
    })).toBe(true)
  })
})

// ── gradeScreeningAnswer – normalized ───────────────────────────────────────

describe('gradeScreeningAnswer: normalized', () => {
  it('gibt true bei gleichen normalisierten Strings', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Hallo Welt' },
      answer: { value: 'hallo welt' },
    })).toBe(true)
  })

  it('gibt false bei unterschiedlichen Strings', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: { value: 'Hallo' },
      answer: { value: 'Welt' },
    })).toBe(false)
  })

  it('trimmt und normalisiert Whitespace', () => {
    expect(gradeScreeningAnswer({
      check_type: 'normalized',
      canonical: 'richtig',
      answer: '  Richtig  ',
    })).toBe(true)
  })
})

// ── gradeScreeningAnswer – matching_set ─────────────────────────────────────

describe('gradeScreeningAnswer: matching_set', () => {
  it('gibt true zurück bei exaktem Paar-Match', () => {
    const canonical = { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }
    const answer = { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(true)
  })

  it('gibt false zurück bei falscher Zuordnung', () => {
    const canonical = { pairs: [{ left: 'A', right: '1' }] }
    const answer = { pairs: [{ left: 'A', right: '2' }] }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
  })

  it('gibt false zurück bei unterschiedlicher Anzahl Paare', () => {
    const canonical = { pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }
    const answer = { pairs: [{ left: 'A', right: '1' }] }
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical, answer })).toBe(false)
  })

  it('gibt false zurück bei null canonical', () => {
    expect(gradeScreeningAnswer({ check_type: 'matching_set', canonical: null, answer: { pairs: [] } })).toBe(false)
  })
})

// ── gradeScreeningAnswer – slot_map ─────────────────────────────────────────

describe('gradeScreeningAnswer: slot_map', () => {
  it('gibt true zurück bei exakter Slot-Übereinstimmung', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-a', s2: 'chip-b' } },
      answer: { slots: { s1: 'chip-a', s2: 'chip-b' } },
    })).toBe(true)
  })

  it('gibt false zurück bei falschem Chip', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-a' } },
      answer: { slots: { s1: 'chip-b' } },
    })).toBe(false)
  })

  it('gibt false zurück bei unterschiedlicher Slot-Anzahl', () => {
    expect(gradeScreeningAnswer({
      check_type: 'slot_map',
      canonical: { slots: { s1: 'chip-a', s2: 'chip-b' } },
      answer: { slots: { s1: 'chip-a' } },
    })).toBe(false)
  })
})

// ── gradeScreeningAnswer – manual ────────────────────────────────────────────

describe('gradeScreeningAnswer: manual', () => {
  it('gibt true zurück bei Match in accepted-Liste', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: 'richtig',
      accepted: ['richtig', 'korrekt'],
    })).toBe(true)
  })

  it('gibt null zurück wenn kein Match gefunden', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: {},
      answer: 'falsch',
      accepted: ['richtig'],
    })).toBeNull()
  })

  it('liest accepted aus canonical wenn nicht explizit angegeben', () => {
    expect(gradeScreeningAnswer({
      check_type: 'manual',
      canonical: { accepted: ['42'] },
      answer: '42',
    })).toBe(true)
  })
})

// ── gradeScreeningAnswer – Fallback ─────────────────────────────────────────

describe('gradeScreeningAnswer: unbekannter check_type', () => {
  it('gibt false zurück für unbekannten Typ', () => {
    expect(gradeScreeningAnswer({
      check_type: 'unknown_type' as never,
      canonical: {},
      answer: {},
    })).toBe(false)
  })
})
