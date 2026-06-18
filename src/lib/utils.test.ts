import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDateLongDe, studentSelectLabel } from './utils'
import type { StudentWithName } from '@/types'

describe('cn', () => {
  it('gibt einfache Klasse zurück', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('kombiniert mehrere Klassen', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('löst Tailwind-Konflikte auf (letzter gewinnt)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('filtert falsy-Werte heraus', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar')
  })

  it('unterstützt bedingte Klassen als Objekt', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })

  it('gibt leeren String bei keinen Klassen zurück', () => {
    expect(cn()).toBe('')
  })
})

describe('getInitials', () => {
  it('gibt die ersten Buchstaben von Vor- und Nachname zurück', () => {
    expect(getInitials('Ahmet Yılmaz')).toBe('AY')
  })

  it('gibt bei einem Wort nur den ersten Buchstaben zurück', () => {
    expect(getInitials('Rasit')).toBe('R')
  })

  it('gibt maximal 2 Zeichen zurück', () => {
    expect(getInitials('Max Moritz Mueller')).toBe('MM')
  })

  it('macht immer Großbuchstaben', () => {
    expect(getInitials('max muster')).toBe('MM')
  })

  it('gibt leeren String bei leerem Input zurück', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatDateLongDe', () => {
  it('gibt ein deutsches Datums-Format zurück', () => {
    const date = new Date(2024, 0, 15) // 15. Januar 2024
    const result = formatDateLongDe(date)
    expect(result).toContain('2024')
    expect(result).toContain('Januar')
    expect(result).toContain('Montag')
  })

  it('verwendet das heutige Datum wenn kein Argument', () => {
    const result = formatDateLongDe()
    const year = new Date().getFullYear().toString()
    expect(result).toContain(year)
  })
})

describe('studentSelectLabel', () => {
  it('gibt Name und Klassenstufe zurück', () => {
    const student = { full_name: 'Lisa Müller', class_level: 8 } as StudentWithName
    expect(studentSelectLabel(student)).toBe('Lisa Müller · Kl. 8')
  })

  it('gibt nur Namen zurück wenn keine Klassenstufe', () => {
    const student = { full_name: 'Tim Schmidt', class_level: null } as StudentWithName
    expect(studentSelectLabel(student)).toBe('Tim Schmidt')
  })

  it('gibt "Unbenannt" wenn kein Name vorhanden', () => {
    const student = { full_name: null, class_level: null } as StudentWithName
    expect(studentSelectLabel(student)).toBe('Unbenannt')
  })

  it('zeigt Klassenstufe auch bei unbekanntem Namen', () => {
    const student = { full_name: null, class_level: 5 } as StudentWithName
    expect(studentSelectLabel(student)).toBe('Unbenannt · Kl. 5')
  })
})
