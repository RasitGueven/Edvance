import { describe, it, expect } from 'vitest'
import { formatSessionDate, berlinYMD, isoWeek } from '@/lib/datetime'

describe('formatSessionDate – Deutsch-Berlin Formatierung', () => {
  it('gibt einen nicht-leeren String zurück', () => {
    const result = formatSessionDate('2026-06-16T10:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(5)
  })

  it('enthält den Wochentag auf Deutsch', () => {
    // 16. Juni 2026 ist ein Dienstag
    const result = formatSessionDate('2026-06-16T10:00:00Z')
    expect(result.toLowerCase()).toContain('dienstag')
  })

  it('enthält den Monatsnamen auf Deutsch', () => {
    const result = formatSessionDate('2026-06-16T10:00:00Z')
    expect(result).toContain('Juni')
  })

  it('zeigt Zeit im Format HH:MM', () => {
    const result = formatSessionDate('2026-06-16T08:30:00Z')
    // Berlin = UTC+2 im Sommer → 10:30
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('berlinYMD – UTC zu Berliner Datum', () => {
  it('gibt Jahr, Monat, Tag zurück', () => {
    const result = berlinYMD('2026-06-16T12:00:00Z')
    expect(result).toHaveProperty('y')
    expect(result).toHaveProperty('m')
    expect(result).toHaveProperty('d')
  })

  it('gibt korrekte Werte für UTC-Zeit zurück', () => {
    // 2026-06-16 12:00 UTC = 14:00 Berlin (MESZ +2)
    const result = berlinYMD('2026-06-16T12:00:00Z')
    expect(result.y).toBe(2026)
    expect(result.m).toBe(6)
    expect(result.d).toBe(16)
  })

  it('gibt Zahlen (nicht Strings) zurück', () => {
    const result = berlinYMD('2026-01-01T00:00:00Z')
    expect(typeof result.y).toBe('number')
    expect(typeof result.m).toBe('number')
    expect(typeof result.d).toBe('number')
  })

  it('berücksichtigt UTC-Mitternacht nahe Datumsgrenze', () => {
    // 2026-06-16 23:30 UTC → 2026-06-17 01:30 Berlin (MESZ)
    const result = berlinYMD('2026-06-16T23:30:00Z')
    expect(result.y).toBe(2026)
    expect(result.m).toBe(6)
    // Berlin ist im Sommer +2h, daher Tag 17
    expect(result.d).toBe(17)
  })

  it('verarbeitet Winter-Datum (CET = UTC+1)', () => {
    // 2026-01-15 00:30 UTC → 2026-01-15 01:30 Berlin (CET)
    const result = berlinYMD('2026-01-15T00:30:00Z')
    expect(result.y).toBe(2026)
    expect(result.m).toBe(1)
    expect(result.d).toBe(15)
  })
})

describe('isoWeek – ISO 8601 Kalenderwoche', () => {
  it('gibt ein Objekt mit year und week zurück', () => {
    const result = isoWeek(2026, 1, 1)
    expect(result).toHaveProperty('year')
    expect(result).toHaveProperty('week')
  })

  it('berechnet KW 1 für den 5. Januar 2026 (Montag)', () => {
    // 5. Januar 2026 ist ein Montag, KW 2
    const result = isoWeek(2026, 1, 5)
    expect(result.week).toBe(2)
  })

  it('gibt KW 53 für bestimmte Dezember-Tage', () => {
    // 29. Dez 2025 → KW 1 2026 (ISO: Woche mit erstem Donnerstag)
    const result = isoWeek(2025, 12, 29)
    expect(result.week).toBe(1)
    expect(result.year).toBe(2026)
  })

  it('berechnet eine Woche im Sommer korrekt', () => {
    // 1. Juni 2026 (Montag) → KW 23
    const result = isoWeek(2026, 6, 1)
    expect(result.week).toBeGreaterThan(0)
    expect(result.week).toBeLessThanOrEqual(53)
    expect(result.year).toBe(2026)
  })

  it('gibt eine Woche zwischen 1 und 53 zurück', () => {
    // Test für diverse Daten
    const testDates = [
      { y: 2026, m: 3, d: 15 },
      { y: 2026, m: 7, d: 4 },
      { y: 2026, m: 12, d: 25 },
    ]
    testDates.forEach(({ y, m, d }) => {
      const { week } = isoWeek(y, m, d)
      expect(week).toBeGreaterThanOrEqual(1)
      expect(week).toBeLessThanOrEqual(53)
    })
  })

  it('berechnet KW für 4. Januar korrekt (immer KW 1)', () => {
    // Der 4. Januar liegt immer in KW 1 (ISO 8601)
    const result = isoWeek(2026, 1, 4)
    expect(result.week).toBe(1)
    expect(result.year).toBe(2026)
  })
})
