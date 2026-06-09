import { describe, it, expect } from 'vitest'
import { parseQuestion } from '../render/taskQuestionParser'

describe('parseQuestion', () => {
  it('returns empty array for null input', () => {
    expect(parseQuestion(null)).toEqual([])
  })

  it('returns empty array for undefined input', () => {
    expect(parseQuestion(undefined)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseQuestion('')).toEqual([])
  })

  it('returns single preamble when no subtasks present', () => {
    const result = parseQuestion('Ein Würfel hat 6 Seiten.')
    expect(result).toEqual([{ type: 'preamble', content: 'Ein Würfel hat 6 Seiten.' }])
  })

  it('trims whitespace from preamble', () => {
    const result = parseQuestion('  Betrachte die Abbildung.  ')
    expect(result[0].content).toBe('Betrachte die Abbildung.')
  })

  it('parses a single subtask without preamble', () => {
    const result = parseQuestion('a) Berechne die Fläche.')
    expect(result).toEqual([{ type: 'subtask', key: 'a', content: 'Berechne die Fläche.' }])
  })

  it('parses multiple subtasks without preamble', () => {
    const result = parseQuestion('a) Erste Aufgabe.\nb) Zweite Aufgabe.')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ type: 'subtask', key: 'a', content: 'Erste Aufgabe.' })
    expect(result[1]).toEqual({ type: 'subtask', key: 'b', content: 'Zweite Aufgabe.' })
  })

  it('parses preamble + subtasks', () => {
    const text = 'Ein Würfel liegt auf dem Tisch.\n\na) Berechne.\nb) Begründe.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(3)
    expect(result[0].type).toBe('preamble')
    expect(result[0].content).toBe('Ein Würfel liegt auf dem Tisch.')
    expect(result[1]).toEqual({ type: 'subtask', key: 'a', content: 'Berechne.' })
    expect(result[2]).toEqual({ type: 'subtask', key: 'b', content: 'Begründe.' })
  })

  it('handles the example from the doc comment', () => {
    const text = 'Ein Wuerfel ... Die Tabelle zeigt:\n\n[TABLE]\n\na) Ordne die Zeilen ...\nb) Begruende ...'
    const result = parseQuestion(text)
    expect(result[0].type).toBe('preamble')
    expect(result[0].content).toContain('[TABLE]')
    expect(result[1]).toEqual({ type: 'subtask', key: 'a', content: 'Ordne die Zeilen ...' })
    expect(result[2]).toEqual({ type: 'subtask', key: 'b', content: 'Begruende ...' })
  })

  it('handles subtasks c) through e)', () => {
    const text = 'c) Dritte.\nd) Vierte.\ne) Fünfte.'
    const result = parseQuestion(text)
    const keys = result.map(r => r.type === 'subtask' ? r.key : null)
    expect(keys).toContain('c')
    expect(keys).toContain('d')
    expect(keys).toContain('e')
  })

  it('does not treat uppercase A) as a subtask', () => {
    // SUBTASK_PATTERN only matches lowercase letters
    const result = parseQuestion('A) This should be preamble.')
    expect(result[0].type).toBe('preamble')
  })

  it('trims content of each subtask', () => {
    const result = parseQuestion('a)   Lots of spaces around.   ')
    expect(result[0].type).toBe('subtask')
    if (result[0].type === 'subtask') {
      expect(result[0].content).toBe('Lots of spaces around.')
    }
  })
})
