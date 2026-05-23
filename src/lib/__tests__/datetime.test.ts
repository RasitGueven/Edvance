import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '../datetime'

describe('formatSessionDate', () => {
  it('formats an ISO string in German locale', () => {
    const result = formatSessionDate('2025-05-09T10:00:00Z')
    expect(result).toContain('Mai')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('includes weekday', () => {
    // 2025-05-05 = Monday
    const result = formatSessionDate('2025-05-05T08:00:00Z')
    expect(result).toContain('Montag')
  })

  it('handles a future date', () => {
    const result = formatSessionDate('2030-12-25T15:30:00Z')
    expect(result).toContain('Dezember')
    // year is intentionally omitted in the format (weekday+day+month+time)
    expect(result).toContain('25')
  })

  it('returns a non-empty string', () => {
    const result = formatSessionDate('2024-01-01T00:00:00Z')
    expect(result.length).toBeGreaterThan(5)
  })
})
