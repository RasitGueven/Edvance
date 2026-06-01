import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '@/lib/datetime'

describe('formatSessionDate', () => {
  it('formats an ISO string into a German locale string', () => {
    const result = formatSessionDate('2024-03-15T10:30:00Z')
    expect(result).toContain('März')
    // year is not included in the format options
    expect(result).toMatch(/\d{2}\.\s*März/)
  })

  it('includes the weekday', () => {
    // 2024-03-15 is a Friday = Freitag
    const result = formatSessionDate('2024-03-15T08:00:00Z')
    expect(result).toMatch(/Freitag|Donnerstag/) // timezone offset may shift day
  })

  it('includes time', () => {
    const result = formatSessionDate('2024-03-15T10:30:00Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('returns a non-empty string for any valid ISO', () => {
    const result = formatSessionDate('2024-01-01T00:00:00Z')
    expect(result.length).toBeGreaterThan(0)
  })
})
