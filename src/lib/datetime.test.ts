import { describe, it, expect } from 'vitest'
import { berlinYMD, isoWeek, formatSessionDate } from './datetime'

describe('berlinYMD', () => {
  it('zerlegt ISO-Timestamp korrekt in Berlin-Zeitzone', () => {
    // 2024-03-15 12:00 UTC = 2024-03-15 13:00 MEZ (UTC+1)
    const result = berlinYMD('2024-03-15T12:00:00.000Z')
    expect(result.y).toBe(2024)
    expect(result.m).toBe(3)
    expect(result.d).toBe(15)
  })

  it('berücksichtigt Sommerzeitumstellung (UTC+2)', () => {
    // 2024-07-01 23:30 UTC = 2024-07-02 01:30 MESZ (UTC+2) → nächster Tag in Berlin
    const result = berlinYMD('2024-07-01T23:30:00.000Z')
    expect(result.y).toBe(2024)
    expect(result.m).toBe(7)
    expect(result.d).toBe(2)
  })

  it('liefert korrekte Werte für Jahresanfang', () => {
    const result = berlinYMD('2024-01-01T00:00:00.000Z')
    expect(result.y).toBe(2024)
    expect(result.m).toBe(1)
    expect(result.d).toBe(1)
  })
})

describe('isoWeek', () => {
  it('berechnet ISO-Woche für bekanntes Datum', () => {
    // 2024-01-01 ist KW 1 2024
    const result = isoWeek(2024, 1, 1)
    expect(result.year).toBe(2024)
    expect(result.week).toBe(1)
  })

  it('KW 53 am Jahresende', () => {
    // 2020-12-28 ist KW 53 2020
    const result = isoWeek(2020, 12, 28)
    expect(result.year).toBe(2020)
    expect(result.week).toBe(53)
  })

  it('erste KW des Jahres richtig zugeordnet', () => {
    // 2024-06-17 ist eine Montag-Woche 25
    const result = isoWeek(2024, 6, 17)
    expect(result.week).toBe(25)
  })

  it('Wochennummer ist zwischen 1 und 53', () => {
    const result = isoWeek(2024, 8, 21)
    expect(result.week).toBeGreaterThanOrEqual(1)
    expect(result.week).toBeLessThanOrEqual(53)
  })
})

describe('formatSessionDate', () => {
  it('gibt lesbare deutsche Datumsformatierung zurück', () => {
    const result = formatSessionDate('2024-03-15T14:30:00.000Z')
    expect(result).toMatch(/März/)
    expect(result).toMatch(/15/)
  })

  it('enthält Wochentag', () => {
    // 2024-03-15 ist ein Freitag
    const result = formatSessionDate('2024-03-15T12:00:00.000Z')
    expect(result).toMatch(/Freitag/)
  })

  it('enthält Uhrzeit', () => {
    const result = formatSessionDate('2024-03-15T12:00:00.000Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})
