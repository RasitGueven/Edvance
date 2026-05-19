import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

describe('cn()', () => {
  it('merges class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, '')).toBe('a')
  })

  it('handles conditional object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })
})

describe('getInitials()', () => {
  it('returns two-letter initials from a full name', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
  })

  it('caps at two initials even for three-word names', () => {
    expect(getInitials('Anna Maria Müller')).toBe('AM')
  })

  it('handles a single-word name', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('returns uppercased initials', () => {
    expect(getInitials('julia schmitt')).toBe('JS')
  })

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatDateLongDe()', () => {
  it('returns a non-empty German date string', () => {
    const result = formatDateLongDe(new Date('2026-05-19'))
    expect(result).toMatch(/Mai/)
    expect(result).toMatch(/2026/)
  })

  it('defaults to today when no argument given', () => {
    const result = formatDateLongDe()
    expect(result.length).toBeGreaterThan(5)
  })

  it('includes the weekday in German', () => {
    const result = formatDateLongDe(new Date('2026-05-18'))
    expect(result).toMatch(/Montag/)
  })
})
