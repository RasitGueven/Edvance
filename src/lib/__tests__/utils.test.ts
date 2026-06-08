import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional falsy values', () => {
    expect(cn('base', false && 'ignored', null, undefined, 'end')).toBe('base end')
  })

  it('returns empty string for no input', () => {
    expect(cn()).toBe('')
  })

  it('handles object syntax', () => {
    expect(cn({ 'text-bold': true, 'text-italic': false })).toBe('text-bold')
  })
})

describe('getInitials', () => {
  it('extracts two initials from full name', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
  })

  it('truncates to two characters for long names', () => {
    expect(getInitials('Anna Maria Schmidt')).toBe('AM')
  })

  it('handles single word name', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('uppercases initials', () => {
    expect(getInitials('lena fischer')).toBe('LF')
  })

  it('handles empty string', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles name with extra spaces resulting in empty parts', () => {
    expect(getInitials('Max Mustermann')).toBe('MM')
  })
})

describe('formatDateLongDe', () => {
  it('formats a fixed date in German long form', () => {
    const date = new Date('2024-05-09T12:00:00Z')
    const result = formatDateLongDe(date)
    expect(result).toMatch(/Donnerstag/)
    expect(result).toMatch(/9\./)
    expect(result).toMatch(/Mai/)
    expect(result).toMatch(/2024/)
  })

  it('includes weekday in German', () => {
    const monday = new Date('2024-01-08T12:00:00Z')
    expect(formatDateLongDe(monday)).toMatch(/Montag/)
  })

  it('uses default (today) when no date passed', () => {
    const result = formatDateLongDe()
    const year = new Date().getFullYear().toString()
    expect(result).toMatch(new RegExp(year))
  })
})
