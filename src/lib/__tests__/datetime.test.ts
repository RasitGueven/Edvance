import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '@/lib/datetime'

describe('formatSessionDate', () => {
  it('formats a UTC ISO string in German long form', () => {
    // 2024-05-09 12:00 UTC = 14:00 in Europe/Berlin (CEST, +2)
    const result = formatSessionDate('2024-05-09T12:00:00Z')
    expect(result).toMatch(/Donnerstag/)
    expect(result).toMatch(/09\./)
    expect(result).toMatch(/Mai/)
    expect(result).toMatch(/14:00/)
  })

  it('handles winter time correctly (UTC+1)', () => {
    // 2024-01-15 09:00 UTC = 10:00 in Europe/Berlin (CET, +1)
    const result = formatSessionDate('2024-01-15T09:00:00Z')
    expect(result).toMatch(/10:00/)
  })

  it('handles summer time correctly (UTC+2)', () => {
    // 2024-07-20 10:00 UTC = 12:00 in Europe/Berlin (CEST, +2)
    const result = formatSessionDate('2024-07-20T10:00:00Z')
    expect(result).toMatch(/12:00/)
  })

  it('returns a non-empty string', () => {
    expect(formatSessionDate('2024-01-01T00:00:00Z').length).toBeGreaterThan(0)
  })
})
