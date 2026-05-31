import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('handles conditional falsy values', () => {
    expect(cn('base', false && 'nope', undefined, null, 'end')).toBe('base end')
  })

  it('handles object syntax', () => {
    expect(cn({ active: true, hidden: false })).toBe('active')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})

describe('getInitials', () => {
  it('returns first letter of each word, uppercase', () => {
    expect(getInitials('Max Mustermann')).toBe('MM')
  })

  it('truncates to two characters', () => {
    expect(getInitials('Anna Bertha Claudia')).toBe('AB')
  })

  it('handles single word', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('handles empty string', () => {
    expect(getInitials('')).toBe('')
  })

  it('lowercases are converted to uppercase', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('formatDateLongDe', () => {
  it('returns a German date string', () => {
    const d = new Date('2024-01-15T12:00:00Z')
    const result = formatDateLongDe(d)
    // Should contain the German month name
    expect(result).toMatch(/Januar/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2024/)
  })

  it('uses current date when no argument given', () => {
    const result = formatDateLongDe()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(5)
  })

  it('contains weekday', () => {
    // 2024-01-15 is a Monday (Montag)
    const d = new Date('2024-01-15T12:00:00Z')
    const result = formatDateLongDe(d)
    expect(result).toMatch(/Montag/)
  })
})
