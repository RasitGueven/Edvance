import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '../datetime'

describe('formatSessionDate', () => {
  it('returns a non-empty string', () => {
    const result = formatSessionDate('2024-06-03T14:00:00Z')
    expect(result.length).toBeGreaterThan(5)
  })

  it('includes the hour in the output', () => {
    // 2024-06-03 14:00 UTC = 16:00 Europe/Berlin (CEST +2)
    const result = formatSessionDate('2024-06-03T14:00:00Z')
    expect(result).toMatch(/16/)
  })

  it('includes a German weekday', () => {
    // 2024-06-03 is a Monday
    const result = formatSessionDate('2024-06-03T10:00:00Z')
    expect(result).toMatch(/Montag/)
  })

  it('includes the German month name', () => {
    const result = formatSessionDate('2024-01-15T10:00:00Z')
    expect(result).toMatch(/Januar/)
  })

  it('handles DST transition correctly (CET +1 in January)', () => {
    // 2024-01-15 12:00 UTC = 13:00 CET
    const result = formatSessionDate('2024-01-15T12:00:00Z')
    expect(result).toMatch(/13/)
  })

  it('formats December date correctly', () => {
    const result = formatSessionDate('2024-12-25T09:00:00Z')
    expect(result).toMatch(/Dezember/)
  })
})
