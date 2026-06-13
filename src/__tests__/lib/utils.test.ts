import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'active')).toBe('base active')
  })

  it('handles undefined/null inputs', () => {
    expect(cn(undefined, null, 'visible')).toBe('visible')
  })
})

describe('getInitials', () => {
  it('extracts first two initials from a full name', () => {
    expect(getInitials('Max Mustermann')).toBe('MM')
  })

  it('returns single initial for single word', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('caps at two initials even for many words', () => {
    expect(getInitials('Anna Maria Scholz')).toBe('AM')
  })

  it('uppercases initials', () => {
    expect(getInitials('john doe')).toBe('JD')
  })

  it('handles empty string gracefully', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatDateLongDe', () => {
  it('returns a German long-date string', () => {
    const result = formatDateLongDe(new Date('2026-06-13'))
    // Must contain day and month in German
    expect(result).toMatch(/Juni/)
    expect(result).toMatch(/2026/)
  })

  it('uses current date when no argument provided', () => {
    const result = formatDateLongDe()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
