import { describe, it, expect } from 'vitest'
import { parseQuestion } from '../taskQuestionParser'

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

  it('wraps plain text as single preamble', () => {
    const result = parseQuestion('Was ist 2 + 2?')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'preamble', content: 'Was ist 2 + 2?' })
  })

  it('parses single subtask without preamble', () => {
    const result = parseQuestion('a) Ordne die Zahlen')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'subtask', key: 'a', content: 'Ordne die Zahlen' })
  })

  it('parses preamble + multiple subtasks', () => {
    const text = 'Ein Würfel hat 6 Seiten.\n\na) Ordne die Zahlen.\nb) Begründe deine Antwort.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(3)
    expect(result[0].type).toBe('preamble')
    expect(result[0]).toMatchObject({ type: 'preamble', content: 'Ein Würfel hat 6 Seiten.' })
    expect(result[1]).toEqual({ type: 'subtask', key: 'a', content: 'Ordne die Zahlen.' })
    expect(result[2]).toEqual({ type: 'subtask', key: 'b', content: 'Begründe deine Antwort.' })
  })

  it('handles subtasks at start (no preamble)', () => {
    const text = 'a) Erste Aufgabe\nb) Zweite Aufgabe'
    const result = parseQuestion(text)
    // No preamble since subtask starts immediately
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(2)
    expect(subtasks[0]).toMatchObject({ type: 'subtask', key: 'a', content: 'Erste Aufgabe' })
    expect(subtasks[1]).toMatchObject({ type: 'subtask', key: 'b', content: 'Zweite Aufgabe' })
  })

  it('trims whitespace from content', () => {
    const text = '  Preamble text  \n\na) Task with trailing spaces   '
    const result = parseQuestion(text)
    const preamble = result.find(p => p.type === 'preamble')
    expect(preamble?.content).not.toMatch(/^\s|\s$/)
  })

  it('handles complex multi-line preamble with table placeholder', () => {
    const text = 'Ein Würfel hat 6 Seiten. Die Tabelle zeigt:\n\n[TABLE]\n\na) Ordne die Zeilen.\nb) Begründe.'
    const result = parseQuestion(text)
    expect(result[0].type).toBe('preamble')
    expect((result[0] as { type: 'preamble'; content: string }).content).toContain('[TABLE]')
  })

  it('handles many subtasks a-z', () => {
    const text = 'a) First\nb) Second\nc) Third\nd) Fourth'
    const result = parseQuestion(text)
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(4)
    expect(subtasks.map(s => (s as { type: 'subtask'; key: string; content: string }).key))
      .toEqual(['a', 'b', 'c', 'd'])
  })

  it('does not split on uppercase letters like A)', () => {
    // Pattern only matches lowercase a-z
    const text = 'Aufgabe: A) Nicht erkennen'
    const result = parseQuestion(text)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('preamble')
  })
})
