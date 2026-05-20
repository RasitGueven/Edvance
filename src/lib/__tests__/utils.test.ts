import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '../utils'

describe('cn()', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes (falsy values ignored)', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c')
  })

  it('resolves tailwind conflicts (last wins)', () => {
    // twMerge ensures the last conflicting class wins
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('returns empty string when no valid classes given', () => {
    expect(cn()).toBe('')
  })

  it('handles array syntax', () => {
    expect(cn(['a', 'b'])).toBe('a b')
  })

  it('handles object syntax for conditional classes', () => {
    expect(cn({ 'bg-red': true, 'bg-blue': false })).toBe('bg-red')
  })
})

describe('getInitials()', () => {
  it('produces initials from a full name', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
  })

  it('capitalises the result', () => {
    expect(getInitials('anna bauer')).toBe('AB')
  })

  it('slices to maximum two characters', () => {
    expect(getInitials('Max Moritz Mueller')).toBe('MM')
  })

  it('works for a single-word name', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('returns empty string for an empty input', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles extra whitespace between words', () => {
    // split(' ') on '  ' produces ['', ''] → first chars are empty strings
    const result = getInitials('  ')
    expect(result).toBe('')
  })
})

describe('formatDateLongDe()', () => {
  it('formats a known date in German long form', () => {
    const date = new Date(2026, 4, 20) // 20. Mai 2026, Mittwoch
    const result = formatDateLongDe(date)
    expect(result).toContain('Mai')
    expect(result).toContain('2026')
    expect(result).toContain('20')
  })

  it('includes the weekday', () => {
    const date = new Date(2026, 4, 20) // Wednesday in German = Mittwoch
    const result = formatDateLongDe(date)
    expect(result).toMatch(/Mittwoch/i)
  })

  it('uses the current date when no argument is given', () => {
    const result = formatDateLongDe()
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})
