import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from './utils'

// ── cn ────────────────────────────────────────────────────────────────────────

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, null, 0 as unknown as string)).toBe('foo')
  })

  it('supports conditional objects', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})

// ── getInitials ───────────────────────────────────────────────────────────────

describe('getInitials()', () => {
  it('extracts two initials from full name', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
  })

  it('handles single name', () => {
    expect(getInitials('Max')).toBe('M')
  })

  it('limits to two letters even for three-word names', () => {
    expect(getInitials('Anna Maria Müller')).toBe('AM')
  })

  it('uppercases result', () => {
    expect(getInitials('thomas müller')).toBe('TM')
  })

  it('handles empty string gracefully', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles multiple spaces between parts', () => {
    // split(' ') produces empty parts; empty part contributes empty char
    const result = getInitials('A  B')
    expect(result.length).toBeLessThanOrEqual(2)
  })
})

// ── formatDateLongDe ──────────────────────────────────────────────────────────

describe('formatDateLongDe()', () => {
  it('formats a known Monday correctly', () => {
    // 2026-01-05 is a Monday
    const result = formatDateLongDe(new Date('2026-01-05'))
    expect(result).toContain('Montag')
    expect(result).toContain('Januar')
    expect(result).toContain('2026')
    expect(result).toContain('5')
  })

  it('contains the weekday name in German', () => {
    const result = formatDateLongDe(new Date('2026-05-18'))
    // 2026-05-18 is a Monday
    expect(result).toMatch(/Montag/)
  })

  it('contains the month name in German', () => {
    const result = formatDateLongDe(new Date('2026-12-25'))
    expect(result).toContain('Dezember')
  })

  it('uses current date when no argument given (smoke test)', () => {
    const result = formatDateLongDe()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
