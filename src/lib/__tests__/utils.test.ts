import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

// ── cn ───────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles no arguments', () => {
    expect(cn()).toBe('')
  })

  it('handles undefined and null values', () => {
    expect(cn('foo', undefined, null as unknown as string)).toBe('foo')
  })

  it('resolves Tailwind conflicts by keeping the last value', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional classes with false', () => {
    expect(cn('foo', false && 'bar')).toBe('foo')
  })

  it('handles conditional classes with true', () => {
    expect(cn('foo', true && 'bar')).toBe('foo bar')
  })

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles objects with boolean values', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo')
  })

  it('deduplicates conflicting padding classes', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('preserves non-conflicting classes', () => {
    const result = cn('flex', 'items-center', 'justify-between')
    expect(result).toContain('flex')
    expect(result).toContain('items-center')
    expect(result).toContain('justify-between')
  })
})

// ── getInitials ──────────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('returns first two initials for a full name', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
  })

  it('returns uppercase initials', () => {
    expect(getInitials('max mustermann')).toBe('MM')
  })

  it('returns only first initial for single-word name', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('handles three-part names, returning only first two', () => {
    expect(getInitials('Anna Maria Schmidt')).toBe('AM')
  })

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles multiple spaces gracefully', () => {
    const result = getInitials('Lisa  Mayer')
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('handles a single character name', () => {
    expect(getInitials('A')).toBe('A')
  })
})

// ── formatDateLongDe ─────────────────────────────────────────────────────────

describe('formatDateLongDe', () => {
  it('returns a non-empty string', () => {
    expect(formatDateLongDe(new Date('2025-01-15'))).toBeTruthy()
  })

  it('includes the year', () => {
    expect(formatDateLongDe(new Date('2025-03-12'))).toContain('2025')
  })

  it('is in German', () => {
    const result = formatDateLongDe(new Date('2025-01-06'))
    const germanMonths = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    expect(germanMonths.some(m => result.includes(m))).toBe(true)
  })

  it('includes a German weekday name', () => {
    const result = formatDateLongDe(new Date('2025-01-06'))
    const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
    expect(weekdays.some(d => result.includes(d))).toBe(true)
  })

  it('uses current date when called with no argument', () => {
    const result = formatDateLongDe()
    expect(result).toContain(String(new Date().getFullYear()))
  })

  it('formats a known date correctly', () => {
    // 2025-05-27 is a Tuesday (Dienstag) in German
    const result = formatDateLongDe(new Date('2025-05-27'))
    expect(result).toContain('2025')
    expect(result).toContain('27')
  })
})
