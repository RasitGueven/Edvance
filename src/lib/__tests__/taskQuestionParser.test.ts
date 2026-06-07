import { describe, it, expect } from 'vitest'
import { parseQuestion } from '../render/taskQuestionParser'

describe('parseQuestion', () => {
  it('returns empty array for null', () => {
    expect(parseQuestion(null)).toEqual([])
  })

  it('returns empty array for undefined', () => {
    expect(parseQuestion(undefined)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseQuestion('')).toEqual([])
  })

  it('returns single preamble for text without subtasks', () => {
    const result = parseQuestion('Ein Würfel hat 6 Seiten.')
    expect(result).toEqual([{ type: 'preamble', content: 'Ein Würfel hat 6 Seiten.' }])
  })

  it('parses a single subtask without preamble', () => {
    const result = parseQuestion('a) Berechne die Fläche.')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'subtask', key: 'a', content: 'Berechne die Fläche.' })
  })

  it('parses preamble + two subtasks', () => {
    const text = 'Ein Dreieck ist gegeben.\n\na) Berechne den Umfang.\nb) Bestimme die Fläche.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ type: 'preamble', content: 'Ein Dreieck ist gegeben.' })
    expect(result[1]).toMatchObject({ type: 'subtask', key: 'a' })
    expect(result[2]).toMatchObject({ type: 'subtask', key: 'b' })
  })

  it('trims whitespace from content', () => {
    const text = 'Praeambel.  \n\na)  Antwort   '
    const result = parseQuestion(text)
    expect(result[0].content).toBe('Praeambel.')
    expect(result[1].content).toBe('Antwort')
  })

  it('handles subtasks a through d', () => {
    const text = 'a) Eins\nb) Zwei\nc) Drei\nd) Vier'
    const result = parseQuestion(text)
    expect(result).toHaveLength(4)
    const keys = result.map((r) => (r.type === 'subtask' ? r.key : null))
    expect(keys).toEqual(['a', 'b', 'c', 'd'])
  })

  it('keeps subtask content with multi-line text', () => {
    const text = 'Aufgabe:\n\na) Erste Zeile\nweiter\nb) Zweite Aufgabe'
    const result = parseQuestion(text)
    expect(result[1].type).toBe('subtask')
    expect(result[1].content).toContain('Erste Zeile')
    expect(result[1].content).toContain('weiter')
  })

  it('does not create empty preamble when text starts directly with subtask', () => {
    const text = 'a) Sofort los.'
    const result = parseQuestion(text)
    expect(result.every((r) => r.content.length > 0)).toBe(true)
    expect(result.some((r) => r.type === 'preamble' && r.content === '')).toBe(false)
  })

  it('handles text with table-like content in preamble', () => {
    const text = 'Daten:\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\na) Werte ablesen.'
    const result = parseQuestion(text)
    expect(result[0].type).toBe('preamble')
    expect(result[0].content).toContain('| A | B |')
    expect(result[1].type).toBe('subtask')
    expect(result[1].key).toBe('a')
  })
})
