import { describe, it, expect } from 'vitest'
import { formatSessionDate } from '@/lib/datetime'

describe('formatSessionDate()', () => {
  it('returns a formatted German date string with month and day', () => {
    const result = formatSessionDate('2026-05-19T10:00:00Z')
    // formatSessionDate does not include year — verify month and day
    expect(result).toMatch(/Mai/)
    expect(result).toMatch(/19/)
  })

  it('includes time components', () => {
    const result = formatSessionDate('2026-05-19T10:00:00Z')
    // The Berlin offset is +2 in summer — 10:00 UTC = 12:00 CEST
    expect(result).toMatch(/12:00/)
  })

  it('includes weekday in German', () => {
    const result = formatSessionDate('2026-05-18T08:00:00Z')
    expect(result).toMatch(/Montag/)
  })
})
