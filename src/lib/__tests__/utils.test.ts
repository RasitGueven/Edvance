import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting tailwind classes', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar')
  })

  it('handles conditional objects', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })

  it('returns empty string for no classes', () => {
    expect(cn()).toBe('')
  })
})

describe('getInitials', () => {
  it('returns initials from a full name', () => {
    expect(getInitials('Max Mustermann')).toBe('MM')
  })

  it('caps at 2 characters', () => {
    expect(getInitials('Anna Berta Clara')).toBe('AB')
  })

  it('handles single name', () => {
    expect(getInitials('Anna')).toBe('A')
  })

  it('returns uppercase', () => {
    expect(getInitials('hans müller')).toBe('HM')
  })

  it('handles empty string gracefully', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatDateLongDe', () => {
  it('returns a German formatted date string', () => {
    const result = formatDateLongDe(new Date('2024-01-15'))
    expect(result).toContain('2024')
    expect(result).toMatch(/Januar/)
  })

  it('uses current date when no arg is given', () => {
    const result = formatDateLongDe()
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})
