import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '../utils'

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('removes falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, null, 'baz')).toBe('foo baz')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('handles array inputs', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('handles object inputs', () => {
    expect(cn({ active: true, hidden: false })).toBe('active')
  })
})

describe('getInitials', () => {
  it('returns first two initials from full name', () => {
    expect(getInitials('Max Mustermann')).toBe('MM')
  })

  it('returns single initial for single word', () => {
    expect(getInitials('Anna')).toBe('A')
  })

  it('uppercases result', () => {
    expect(getInitials('hans peter')).toBe('HP')
  })

  it('truncates to 2 initials for multi-word names', () => {
    expect(getInitials('Karl Heinrich Wilhelm')).toBe('KH')
  })

  it('handles empty string', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles name with extra spaces', () => {
    expect(getInitials('Anna Müller')).toBe('AM')
  })
})

describe('formatDateLongDe', () => {
  it('returns a non-empty German date string', () => {
    const result = formatDateLongDe(new Date('2024-01-15'))
    expect(result).toMatch(/Januar/)
    expect(result).toMatch(/2024/)
  })

  it('includes weekday', () => {
    // 2024-01-15 is a Monday
    const result = formatDateLongDe(new Date('2024-01-15'))
    expect(result).toMatch(/Montag/)
  })

  it('falls back to current date when no arg given', () => {
    const result = formatDateLongDe()
    expect(result.length).toBeGreaterThan(5)
  })

  it('formats May 1 correctly', () => {
    const result = formatDateLongDe(new Date('2024-05-01'))
    expect(result).toMatch(/Mai/)
    expect(result).toMatch(/1/)
  })
})
