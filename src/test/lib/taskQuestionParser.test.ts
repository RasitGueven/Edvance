import { describe, it, expect } from 'vitest'
import { parseQuestion } from '@/lib/render/taskQuestionParser'

describe('parseQuestion()', () => {
  it('gibt leeres Array für null zurück', () => {
    expect(parseQuestion(null)).toEqual([])
  })

  it('gibt leeres Array für undefined zurück', () => {
    expect(parseQuestion(undefined)).toEqual([])
  })

  it('gibt leeres Array für leeren String zurück', () => {
    expect(parseQuestion('')).toEqual([])
  })

  it('liefert nur Präambel wenn keine Teilaufgaben vorhanden', () => {
    const result = parseQuestion('Ein einfacher Text ohne Teilaufgaben.')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'preamble', content: 'Ein einfacher Text ohne Teilaufgaben.' })
  })

  it('erkennt einfache Teilaufgaben a) und b)', () => {
    const text = 'Gegeben sei x.\n\na) Berechne x.\nb) Zeichne x.'
    const result = parseQuestion(text)
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(2)
    expect(subtasks[0]).toMatchObject({ type: 'subtask', key: 'a' })
    expect(subtasks[1]).toMatchObject({ type: 'subtask', key: 'b' })
  })

  it('extrahiert die Präambel korrekt', () => {
    const text = 'Die folgende Tabelle zeigt Daten.\n\na) Werte aus.\nb) Begründe.'
    const result = parseQuestion(text)
    const preamble = result.find(p => p.type === 'preamble')
    expect(preamble).toBeDefined()
    expect(preamble!.content).toContain('Die folgende Tabelle')
  })

  it('enthält den Inhalt der Teilaufgaben', () => {
    const text = 'Einleitung.\n\na) Ordne die Zahlen.\nb) Berechne den Mittelwert.'
    const result = parseQuestion(text)
    const a = result.find(p => p.type === 'subtask' && (p as { key: string }).key === 'a')
    const b = result.find(p => p.type === 'subtask' && (p as { key: string }).key === 'b')
    expect((a as { content: string }).content).toBe('Ordne die Zahlen.')
    expect((b as { content: string }).content).toBe('Berechne den Mittelwert.')
  })

  it('parst Text ohne Präambel korrekt (Teilaufgaben direkt am Anfang)', () => {
    const text = 'a) Erste Aufgabe.\nb) Zweite Aufgabe.'
    const result = parseQuestion(text)
    const preamble = result.find(p => p.type === 'preamble')
    expect(preamble).toBeUndefined()
    expect(result).toHaveLength(2)
  })

  it('parst viele Teilaufgaben korrekt', () => {
    const text = 'Intro.\n\na) A\nb) B\nc) C\nd) D\ne) E'
    const result = parseQuestion(text)
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(5)
    const keys = subtasks.map(s => (s as { key: string }).key)
    expect(keys).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('trimmt Whitespace in Inhalt und Präambel', () => {
    const result = parseQuestion('  Einleitung mit Whitespace.  ')
    expect(result[0].content).toBe('Einleitung mit Whitespace.')
  })

  it('gibt Präambel mit leerem Inhalt für reinen Whitespace zurück', () => {
    // '   ' ist truthy → kein Early Return, aber trim() ergibt ''
    const result = parseQuestion('   ')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'preamble', content: '' })
  })
})
