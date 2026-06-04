import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional falsy values', () => {
    expect(cn('base', false && 'ignored', undefined, null, 'extra')).toBe('base extra')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })
})

describe('getInitials', () => {
  it('returns first two letters of two-word name', () => {
    expect(getInitials('Max Mustermann')).toBe('MM')
  })

  it('returns single initial for one word', () => {
    expect(getInitials('Max')).toBe('M')
  })

  it('caps at two initials for long names', () => {
    expect(getInitials('Anna Bella Clara')).toBe('AB')
  })

  it('uppercases initials', () => {
    expect(getInitials('anna becker')).toBe('AB')
  })

  it('handles empty string gracefully', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatDateLongDe', () => {
  it('formats a known date in German', () => {
    const date = new Date('2024-01-15T12:00:00Z')
    const result = formatDateLongDe(date)
    expect(result).toContain('Januar')
    expect(result).toContain('2024')
  })

  it('uses current date when no argument given', () => {
    const result = formatDateLongDe()
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})
