import { describe, it, expect } from 'vitest'
import { parseQuestion } from '@/lib/render/taskQuestionParser'

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

  it('returns single preamble for text without subtask markers', () => {
    const result = parseQuestion('Berechne die Fläche eines Kreises.')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'preamble', content: 'Berechne die Fläche eines Kreises.' })
  })

  it('parses subtasks without a preamble', () => {
    const text = 'a) Erste Aufgabe\nb) Zweite Aufgabe'
    const result = parseQuestion(text)
    expect(result.some(p => p.type === 'subtask' && p.key === 'a')).toBe(true)
    expect(result.some(p => p.type === 'subtask' && p.key === 'b')).toBe(true)
  })

  it('parses preamble + subtasks correctly', () => {
    const text = 'Ein Würfel hat eine Kantenlänge von 4 cm.\n\na) Berechne das Volumen.\nb) Berechne die Oberfläche.'
    const result = parseQuestion(text)
    const preamble = result.find(p => p.type === 'preamble')
    expect(preamble).toBeDefined()
    expect(preamble!.content).toContain('Würfel')

    const subtaskA = result.find(p => p.type === 'subtask' && p.key === 'a')
    expect(subtaskA!.content).toContain('Volumen')

    const subtaskB = result.find(p => p.type === 'subtask' && p.key === 'b')
    expect(subtaskB!.content).toContain('Oberfläche')
  })

  it('trims whitespace from parts', () => {
    const text = '  Präambel  \n\na) Aufgabe  \n'
    const result = parseQuestion(text)
    const preamble = result.find(p => p.type === 'preamble')
    expect(preamble!.content).toBe('Präambel')
  })

  it('handles multi-line subtask content', () => {
    const text = 'a) Erste Zeile\nZweite Zeile\nb) Nächste Aufgabe'
    const result = parseQuestion(text)
    const subtaskA = result.find(p => p.type === 'subtask' && p.key === 'a')
    expect(subtaskA!.content).toContain('Erste Zeile')
    expect(subtaskA!.content).toContain('Zweite Zeile')
  })

  it('parses multiple subtasks up to z)', () => {
    const letters = ['a', 'b', 'c', 'd']
    const text = letters.map(l => `${l}) Aufgabe ${l}`).join('\n')
    const result = parseQuestion(text)
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(4)
    expect(subtasks.map(s => s.type === 'subtask' && s.key)).toEqual(letters)
  })
})
