import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('supports conditional objects', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })

  it('returns empty string for no valid inputs', () => {
    expect(cn(false, null, undefined)).toBe('')
  })
})

describe('getInitials', () => {
  it('returns initials for full name', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
  })

  it('returns single letter for single name', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('truncates to 2 characters', () => {
    expect(getInitials('Anna Barbara Clara')).toBe('AB')
  })

  it('uppercases result', () => {
    expect(getInitials('lena fischer')).toBe('LF')
  })

  it('handles empty string', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles name with extra spaces gracefully', () => {
    const result = getInitials('  Max Müller  ')
    expect(result.length).toBeLessThanOrEqual(2)
  })
})

describe('formatDateLongDe', () => {
  it('returns a non-empty German date string', () => {
    const result = formatDateLongDe(new Date('2026-05-26'))
    expect(result).toContain('2026')
    expect(result).toMatch(/Mai/)
  })

  it('includes weekday', () => {
    const result = formatDateLongDe(new Date('2026-05-26'))
    expect(result).toMatch(/Dienstag/)
  })

  it('defaults to today without argument', () => {
    const result = formatDateLongDe()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
