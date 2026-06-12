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

  it('wraps plain text without subtasks in a preamble', () => {
    const result = parseQuestion('Berechne den Umfang des Dreiecks.')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      type: 'preamble',
      content: 'Berechne den Umfang des Dreiecks.',
    })
  })

  it('parses a single subtask with no preamble', () => {
    const result = parseQuestion('a) Berechne den Umfang.')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'subtask', key: 'a', content: 'Berechne den Umfang.' })
  })

  it('parses preamble + multiple subtasks', () => {
    const text =
      'Ein Würfel hat die Kantenlänge 4 cm.\n\na) Berechne das Volumen.\nb) Berechne die Oberfläche.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(3)
    expect(result[0].type).toBe('preamble')
    expect(result[1]).toEqual({ type: 'subtask', key: 'a', content: 'Berechne das Volumen.' })
    expect(result[2]).toEqual({ type: 'subtask', key: 'b', content: 'Berechne die Oberfläche.' })
  })

  it('trims leading/trailing whitespace from content', () => {
    const result = parseQuestion('  Praeambel  \n\na) Teilaufgabe  ')
    const preamble = result.find(p => p.type === 'preamble')
    const subtask = result.find(p => p.type === 'subtask')
    expect(preamble?.content).toBe('Praeambel')
    expect(subtask && 'content' in subtask ? subtask.content : '').toBe('Teilaufgabe')
  })

  it('handles subtasks a) through e)', () => {
    const text = 'a) Eins\nb) Zwei\nc) Drei\nd) Vier\ne) Fünf'
    const result = parseQuestion(text)
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(5)
    expect(subtasks.map(s => (s as { key: string }).key)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('does not produce empty preamble when subtask starts immediately', () => {
    const text = 'a) Erste Aufgabe\nb) Zweite Aufgabe'
    const result = parseQuestion(text)
    const preambles = result.filter(p => p.type === 'preamble')
    expect(preambles).toHaveLength(0)
  })

  it('handles subtask content spanning multiple lines', () => {
    const text = 'Intro\n\na) Zeile 1\nZeile 2\nZeile 3\nb) Andere Aufgabe'
    const result = parseQuestion(text)
    const subtaskA = result.find(p => p.type === 'subtask' && (p as { key: string }).key === 'a')
    expect(subtaskA?.content).toContain('Zeile 1')
    expect(subtaskA?.content).toContain('Zeile 2')
  })

  it('handles table-like preamble with subtasks', () => {
    const text = 'Die Tabelle zeigt:\n\n[TABLE]\n\na) Ordne die Zeilen...\nb) Begründe...'
    const result = parseQuestion(text)
    expect(result[0].type).toBe('preamble')
    expect(result[0].content).toContain('[TABLE]')
    expect(result).toHaveLength(3)
  })
})
