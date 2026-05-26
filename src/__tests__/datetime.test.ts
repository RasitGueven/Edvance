import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '@/lib/datetime'

describe('formatSessionDate', () => {
  it('formats a UTC ISO string as German long date with time', () => {
    // 2026-03-15T10:00:00Z = 11:00 in Europe/Berlin (CET+1)
    // Note: formatSessionDate does not include the year in its format options
    const result = formatSessionDate('2026-03-15T10:00:00Z')
    expect(result).toContain('März')
    expect(result).toMatch(/Sonntag/)
  })

  it('includes hour and minute', () => {
    const result = formatSessionDate('2026-03-15T10:00:00Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('includes a weekday', () => {
    // 2026-03-15 is a Sunday
    const result = formatSessionDate('2026-03-15T10:00:00Z')
    expect(result).toMatch(/Sonntag/)
  })

  it('returns a non-empty string for any valid ISO', () => {
    const result = formatSessionDate('2025-01-01T00:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
