import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe } from '@/lib/utils'

describe('cn – Tailwind-Klassen zusammenführen', () => {
  it('verbindet einfache Klassen', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('löst Tailwind-Konflikte auf (letzte gewinnt)', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('m-2', 'mx-4')).toBe('m-2 mx-4')
  })

  it('ignoriert falsy-Werte', () => {
    expect(cn('base', false && 'hidden', 'other')).toBe('base other')
    expect(cn('base', undefined, null, 'other')).toBe('base other')
    expect(cn('base', 0 && 'zero')).toBe('base')
  })

  it('unterstützt Arrays und Objekte', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
    expect(cn({ foo: true, bar: false })).toBe('foo')
  })

  it('gibt leeren String zurück ohne Argumente', () => {
    expect(cn()).toBe('')
  })

  it('dedupliziert identische Klassen', () => {
    const result = cn('px-4', 'px-4')
    expect(result).toBe('px-4')
  })
})

describe('getInitials – Initialen aus Namen', () => {
  it('gibt 2 Großbuchstaben für Vor- und Nachnamen zurück', () => {
    expect(getInitials('Lena Fischer')).toBe('LF')
    expect(getInitials('Max Mustermann')).toBe('MM')
  })

  it('gibt maximal 2 Initialen zurück bei 3+ Wörtern', () => {
    expect(getInitials('Hans Peter Mueller')).toBe('HP')
    expect(getInitials('Anna Maria Lisa Schmidt')).toBe('AM')
  })

  it('gibt 1 Initial für Einzelnamen zurück', () => {
    expect(getInitials('Max')).toBe('M')
  })

  it('wandelt in Großbuchstaben um', () => {
    expect(getInitials('anna becker')).toBe('AB')
    expect(getInitials('max')).toBe('M')
  })

  it('gibt leeren String für leeren Namen zurück', () => {
    expect(getInitials('')).toBe('')
  })

  it('verarbeitet Namen mit Leerzeichen am Anfang/Ende', () => {
    const result = getInitials('  Anna  Müller  ')
    expect(result.length).toBeLessThanOrEqual(2)
  })
})

describe('formatDateLongDe – deutsches Langdatum', () => {
  it('enthält das Jahr', () => {
    const result = formatDateLongDe(new Date(2026, 0, 1))
    expect(result).toContain('2026')
  })

  it('enthält den Monatsnamen auf Deutsch', () => {
    const result = formatDateLongDe(new Date(2026, 0, 1))
    expect(result).toContain('Januar')
  })

  it('enthält den Wochentag auf Deutsch', () => {
    // 1. Jan 2026 ist ein Donnerstag
    const result = formatDateLongDe(new Date(2026, 0, 1))
    expect(result.toLowerCase()).toContain('donnerstag')
  })

  it('gibt Ergebnis für das aktuelle Datum zurück wenn kein Datum übergeben', () => {
    const result = formatDateLongDe()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(10)
  })

  it('formatiert einen Sommer-Monat korrekt', () => {
    const result = formatDateLongDe(new Date(2025, 6, 15)) // 15. Juli 2025
    expect(result).toContain('Juli')
    expect(result).toContain('2025')
  })
})
