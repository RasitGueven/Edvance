import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '../utils'

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'active')).toBe('base active')
    expect(cn('base', true && 'active')).toBe('base active')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})

describe('getInitials', () => {
  it('returns up to 2 uppercase initials', () => {
    expect(getInitials('Max Mustermann')).toBe('MM')
    expect(getInitials('Anna')).toBe('A')
    expect(getInitials('Maria Antonia Bauer')).toBe('MA')
  })

  it('handles single-word names', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('uppercases initials', () => {
    expect(getInitials('anna bauer')).toBe('AB')
  })

  it('handles empty string without crashing', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatDateLongDe', () => {
  it('formats a known date correctly in German', () => {
    const date = new Date('2024-01-15T12:00:00Z')
    const result = formatDateLongDe(date)
    expect(result).toContain('2024')
    expect(result).toContain('Januar')
  })

  it('uses the provided date not the current date', () => {
    const date1 = new Date('2023-06-01T00:00:00Z')
    const date2 = new Date('2024-12-31T00:00:00Z')
    const result1 = formatDateLongDe(date1)
    const result2 = formatDateLongDe(date2)
    expect(result1).not.toBe(result2)
  })

  it('includes weekday, day, month, year', () => {
    const date = new Date('2024-03-18T12:00:00Z')
    const result = formatDateLongDe(date)
    expect(result).toMatch(/montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag/i)
    expect(result).toContain('März')
    expect(result).toContain('2024')
  })
})
