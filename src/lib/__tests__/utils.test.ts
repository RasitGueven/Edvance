import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '../utils'

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates tailwind conflicting classes', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn(undefined, null, 'active')).toBe('active')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })
})

describe('getInitials', () => {
  it('returns first two initials', () => {
    expect(getInitials('Max Mustermann')).toBe('MM')
  })

  it('returns single initial for one-word name', () => {
    expect(getInitials('Max')).toBe('M')
  })

  it('upper-cases all initials', () => {
    expect(getInitials('anna bauer')).toBe('AB')
  })

  it('returns at most 2 chars for 3+ words', () => {
    expect(getInitials('Karl Friedrich Müller')).toBe('KF')
  })

  it('handles empty string', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatDateLongDe', () => {
  it('formats a known date in German long format', () => {
    const d = new Date('2024-06-06T12:00:00Z')
    const result = formatDateLongDe(d)
    expect(result).toContain('2024')
    expect(result).toContain('Juni')
  })

  it('includes the weekday', () => {
    const d = new Date('2024-06-03T12:00:00Z') // Montag
    const result = formatDateLongDe(d)
    expect(result).toMatch(/Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag/)
  })

  it('uses current date when no argument is passed', () => {
    const result = formatDateLongDe()
    const year = new Date().getFullYear().toString()
    expect(result).toContain(year)
  })
})
