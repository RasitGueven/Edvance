import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '@/lib/datetime'

describe('formatSessionDate', () => {
  it('returns a non-empty German locale string', () => {
    const result = formatSessionDate('2026-06-13T10:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the month in German', () => {
    const result = formatSessionDate('2026-01-15T08:30:00Z')
    expect(result).toMatch(/Januar/)
  })

  it('does not include the year (format excludes it)', () => {
    const result = formatSessionDate('2026-06-13T10:00:00Z')
    // The format uses weekday, day, month, hour, minute — no year
    expect(result).not.toMatch(/2026/)
  })

  it('formats a UTC midnight time to Berlin timezone (offset +1 or +2)', () => {
    // 2026-06-13T00:00:00Z → Berlin CEST = 02:00
    const result = formatSessionDate('2026-06-13T00:00:00Z')
    expect(result).toMatch(/02:00/)
  })
})
