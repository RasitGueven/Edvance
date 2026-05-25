import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '../datetime'

describe('formatSessionDate()', () => {
  it('returns a non-empty string for a valid ISO string', () => {
    const result = formatSessionDate('2026-05-20T10:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes "Mai" for a May date', () => {
    const result = formatSessionDate('2026-05-20T10:00:00Z')
    expect(result).toContain('Mai')
  })

  it('includes the month name "Mai" for a May date', () => {
    const result = formatSessionDate('2026-05-20T10:00:00Z')
    expect(result).toContain('Mai')
  })

  it('includes the weekday in German', () => {
    // 2026-05-20 is a Wednesday (Mittwoch)
    const result = formatSessionDate('2026-05-20T10:00:00Z')
    expect(result).toMatch(/Mittwoch/i)
  })

  it('formats time with hours and minutes', () => {
    // UTC 09:30 → CET/CEST Berlin (UTC+2 in May) → 11:30
    const result = formatSessionDate('2026-05-20T09:30:00Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('handles a January date (winter, UTC+1)', () => {
    const result = formatSessionDate('2026-01-05T08:00:00Z')
    expect(result).toContain('Januar')
  })

  it('includes Montag for a Monday', () => {
    const result = formatSessionDate('2026-01-05T10:00:00Z')
    expect(result).toContain('Montag')
  })

  it('handles midnight UTC correctly', () => {
    const result = formatSessionDate('2026-05-20T00:00:00Z')
    expect(typeof result).toBe('string')
  })
})
