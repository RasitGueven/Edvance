import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '@/lib/datetime'

describe('formatSessionDate', () => {
  it('returns a non-empty string', () => {
    expect(formatSessionDate('2025-05-27T10:00:00Z')).toBeTruthy()
  })

  it('formats with German locale', () => {
    const result = formatSessionDate('2025-05-27T10:00:00Z')
    const germanMonths = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    expect(germanMonths.some(m => result.includes(m))).toBe(true)
  })

  it('includes a weekday name', () => {
    const result = formatSessionDate('2025-05-27T10:00:00Z')
    const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
    expect(weekdays.some(d => result.includes(d))).toBe(true)
  })

  it('includes the day', () => {
    const result = formatSessionDate('2025-01-15T14:30:00Z')
    expect(result).toContain('15')
  })

  it('includes minutes in the time', () => {
    const result = formatSessionDate('2025-01-15T14:30:00Z')
    expect(result).toContain('30')
  })

  it('applies Europe/Berlin timezone offset', () => {
    // In summer (CEST = UTC+2), 10:00 UTC becomes 12:00 Berlin
    const result = formatSessionDate('2025-07-01T10:00:00Z')
    expect(result).toMatch(/12:00/)
  })

  it('handles midnight UTC', () => {
    const result = formatSessionDate('2025-01-01T00:00:00Z')
    expect(result).toBeTruthy()
  })

  it('handles ISO string with milliseconds', () => {
    const result = formatSessionDate('2025-03-15T09:30:45.123Z')
    expect(result).toBeTruthy()
  })
})
