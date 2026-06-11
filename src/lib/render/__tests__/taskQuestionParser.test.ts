import { describe, it, expect } from 'vitest'
import { parseQuestion } from '@/lib/render/taskQuestionParser'

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

  it('returns single preamble when no subtasks present', () => {
    const result = parseQuestion('Löse die Gleichung 2x = 8.')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'preamble', content: 'Löse die Gleichung 2x = 8.' })
  })

  it('splits into preamble and subtasks', () => {
    const text = 'Ein Würfel hat die Kantenlänge 3 cm.\n\na) Berechne das Volumen.\nb) Berechne die Oberfläche.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(3)
    expect(result[0].type).toBe('preamble')
    expect(result[1]).toEqual({ type: 'subtask', key: 'a', content: 'Berechne das Volumen.' })
    expect(result[2]).toEqual({ type: 'subtask', key: 'b', content: 'Berechne die Oberfläche.' })
  })

  it('omits preamble when text starts directly with a subtask', () => {
    const text = 'a) Erste Aufgabe.\nb) Zweite Aufgabe.'
    const result = parseQuestion(text)
    expect(result.every(p => p.type === 'subtask')).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('handles subtasks a through e', () => {
    const lines = ['a) Eins.', 'b) Zwei.', 'c) Drei.', 'd) Vier.', 'e) Fünf.']
    const result = parseQuestion(lines.join('\n'))
    expect(result).toHaveLength(5)
    const keys = result.map(p => (p.type === 'subtask' ? p.key : null))
    expect(keys).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('trims whitespace from preamble and subtask content', () => {
    const text = '  Einleitung  \n\na)   Aufgabe mit Leerzeichen   '
    const result = parseQuestion(text)
    expect(result[0].content.trim()).toBe(result[0].content)
    if (result[1].type === 'subtask') {
      expect(result[1].content).not.toMatch(/\s$/)
    }
  })

  it('handles multiline preamble before first subtask', () => {
    const text = 'Zeile 1\nZeile 2\nZeile 3\n\na) Aufgabe'
    const result = parseQuestion(text)
    expect(result[0].type).toBe('preamble')
    expect(result[0].content).toContain('Zeile 1')
    expect(result[0].content).toContain('Zeile 3')
  })

  it('preserves embedded table markdown inside subtask content', () => {
    const text = 'Intro\n\na) Berechne:\n| x | y |\n|---|---|\n| 1 | 2 |\n\nb) Erkläre.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(3)
    const subtaskA = result.find(p => p.type === 'subtask' && p.key === 'a')
    expect(subtaskA?.content).toContain('|')
  })

  it('does not create subtask for uppercase letter + paren', () => {
    // Only lowercase letters trigger subtask detection
    const text = 'A) Not a subtask\nB) Also not'
    const result = parseQuestion(text)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('preamble')
  })
})
