import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '../datetime'

describe('formatSessionDate', () => {
  it('returns a non-empty string', () => {
    expect(formatSessionDate('2024-06-06T10:00:00Z')).toBeTruthy()
  })

  it('includes the month in German', () => {
    const result = formatSessionDate('2024-06-06T10:00:00Z')
    expect(result).toContain('Juni')
  })

  it('includes the hour in Europe/Berlin timezone', () => {
    // 2024-06-06T10:00:00Z = 12:00 Berlin (CEST = UTC+2)
    const result = formatSessionDate('2024-06-06T10:00:00Z')
    expect(result).toContain('12')
  })

  it('includes a weekday name', () => {
    const result = formatSessionDate('2024-06-06T10:00:00Z')
    const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
    const hasWeekday = weekdays.some(d => result.includes(d))
    expect(hasWeekday).toBe(true)
  })

  it('handles winter time (UTC+1)', () => {
    // 2024-01-15T11:00:00Z = 12:00 Berlin (CET = UTC+1)
    const result = formatSessionDate('2024-01-15T11:00:00Z')
    expect(result).toContain('Januar')
    expect(result).toContain('12')
  })
})
