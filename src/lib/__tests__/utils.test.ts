import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '../utils'

describe('cn', () => {
  it('joins simple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates via tailwind-merge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'ignored', 'added')).toBe('base added')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn(undefined, null, 'valid')).toBe('valid')
  })

  it('returns empty string when no args', () => {
    expect(cn()).toBe('')
  })
})

describe('getInitials', () => {
  it('extracts two initials from full name', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
  })

  it('handles single word', () => {
    expect(getInitials('Max')).toBe('M')
  })

  it('caps at 2 initials even for 3+ word names', () => {
    expect(getInitials('Anna Maria Müller')).toBe('AM')
  })

  it('uppercases result', () => {
    expect(getInitials('anna becker')).toBe('AB')
  })

  it('handles empty string gracefully', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatDateLongDe', () => {
  it('formats a known date in German long form', () => {
    // Friday 9 May 2025
    const date = new Date('2025-05-09T10:00:00')
    const result = formatDateLongDe(date)
    expect(result).toContain('Mai')
    expect(result).toContain('2025')
    expect(result).toMatch(/\d+\./)
  })

  it('includes weekday name in German', () => {
    // Monday
    const date = new Date('2025-05-05T00:00:00')
    const result = formatDateLongDe(date)
    expect(result).toContain('Montag')
  })

  it('uses today when no date provided', () => {
    const result = formatDateLongDe()
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})
