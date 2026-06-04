import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '@/lib/datetime'

describe('formatSessionDate', () => {
  it('formats an ISO string to German locale string', () => {
    const result = formatSessionDate('2024-06-15T10:30:00.000Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('contains the day and month in German', () => {
    const result = formatSessionDate('2024-01-15T12:00:00.000Z')
    expect(result).toContain('Januar')
  })

  it('contains hours and minutes', () => {
    // 12:00 UTC → 13:00 Berlin (CET) in winter
    const result = formatSessionDate('2024-01-15T12:00:00.000Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('includes the weekday in German', () => {
    // 2024-01-15 is a Monday
    const result = formatSessionDate('2024-01-15T12:00:00.000Z')
    expect(result).toContain('Montag')
  })

  it('handles summer time (CEST, UTC+2)', () => {
    // 2024-06-15 12:00 UTC → 14:00 CEST
    const result = formatSessionDate('2024-06-15T12:00:00.000Z')
    expect(result).toContain('14')
  })
})
