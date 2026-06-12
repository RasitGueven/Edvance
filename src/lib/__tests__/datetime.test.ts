import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '../datetime'

describe('formatSessionDate', () => {
  it('formats an ISO date string to German locale in Berlin timezone', () => {
    // The function omits year — only weekday, day, month, time are shown
    const result = formatSessionDate('2024-03-18T10:00:00Z')
    expect(result).toContain('März')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('includes weekday in German', () => {
    // 2024-03-18 is a Monday
    const result = formatSessionDate('2024-03-18T10:00:00Z')
    expect(result).toMatch(/montag/i)
  })

  it('converts UTC to Europe/Berlin timezone', () => {
    // UTC 22:00 → Europe/Berlin (CET=UTC+1) = 23:00
    const result = formatSessionDate('2024-01-15T22:00:00Z')
    expect(result).toContain('23:00')
  })

  it('handles summer time (CEST=UTC+2)', () => {
    // UTC 20:00 in summer → Europe/Berlin = 22:00
    const result = formatSessionDate('2024-07-15T20:00:00Z')
    expect(result).toContain('22:00')
  })

  it('includes day and time components', () => {
    const result = formatSessionDate('2024-06-12T08:30:00Z')
    expect(result).toContain('12')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})
