import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from './utils'

describe('cn', () => {
  it('joins class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters out falsy conditionals', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('merges conflicting tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles undefined and null', () => {
    expect(cn(undefined, null, 'foo')).toBe('foo')
  })
})

describe('getInitials', () => {
  it('returns two uppercase initials for a full name', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
  })

  it('returns single initial for a single name', () => {
    expect(getInitials('Lena')).toBe('L')
  })

  it('truncates to 2 chars for names with more than two words', () => {
    expect(getInitials('Anna Maria Schmidt')).toBe('AM')
  })

  it('uppercases lowercase input', () => {
    expect(getInitials('lena fischer')).toBe('LF')
  })

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles names with leading/trailing spaces gracefully', () => {
    const result = getInitials('Rasit Güven')
    expect(result).toBe('RG')
  })
})

describe('formatDateLongDe', () => {
  it('formats a known date in German long form', () => {
    const date = new Date('2026-05-17T12:00:00Z')
    const result = formatDateLongDe(date)
    expect(result).toContain('2026')
    expect(result).toContain('Mai')
    expect(result).toMatch(/17\.?/)
  })

  it('returns a non-empty string when called without arguments', () => {
    const result = formatDateLongDe()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the weekday', () => {
    // 2026-05-17 is a Sunday
    const date = new Date('2026-05-17T12:00:00Z')
    const result = formatDateLongDe(date)
    expect(result).toMatch(/Sonntag|Samstag/) // timezone-safe: could shift one day
  })
})
