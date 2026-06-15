import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

describe('cn()', () => {
  it('kombiniert einfache Klassen', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('überschreibt widersprüchliche Tailwind-Klassen', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('ignoriert falsy-Werte', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar')
  })

  it('akzeptiert bedingte Objekte', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })

  it('gibt leeren String zurück ohne Argumente', () => {
    expect(cn()).toBe('')
  })
})

describe('getInitials()', () => {
  it('erzeugt Initialen aus zwei Wörtern', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
  })

  it('erzeugt Initialen aus einem Wort', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('gibt maximal 2 Zeichen zurück', () => {
    expect(getInitials('Anna Maria Müller')).toBe('AM')
  })

  it('gibt Großbuchstaben zurück', () => {
    expect(getInitials('max mustermann')).toBe('MM')
  })

  it('behandelt leeren String', () => {
    expect(getInitials('')).toBe('')
  })

  it('behandelt einzelnes Leerzeichen', () => {
    expect(getInitials(' ')).toBe('')
  })
})

describe('formatDateLongDe()', () => {
  it('formatiert ein bekanntes Datum auf Deutsch', () => {
    const date = new Date('2024-01-15T12:00:00Z')
    const result = formatDateLongDe(date)
    expect(result).toContain('Januar')
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('enthält den Wochentag', () => {
    // 2024-01-15 ist ein Montag
    const date = new Date('2024-01-15T12:00:00Z')
    const result = formatDateLongDe(date)
    expect(result).toMatch(/Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag/)
  })

  it('gibt einen nicht-leeren String zurück', () => {
    const result = formatDateLongDe(new Date())
    expect(result.length).toBeGreaterThan(5)
  })
})
