import { describe, it, expect } from 'vitest'
import { parseQuestion } from '@/lib/render/taskQuestionParser'
import type { QuestionPart } from '@/lib/render/taskQuestionParser'

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

  it('returns a single preamble when no subtask markers exist', () => {
    const text = 'Löse folgende Gleichung: 2x + 4 = 12'
    const result = parseQuestion(text)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual<QuestionPart>({ type: 'preamble', content: text })
  })

  it('parses preamble + two subtasks', () => {
    const text = 'Ein Würfel liegt auf dem Tisch.\n\na) Beschreibe die Form.\nb) Berechne das Volumen.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ type: 'preamble', content: 'Ein Würfel liegt auf dem Tisch.' })
    expect(result[1]).toMatchObject({ type: 'subtask', key: 'a', content: 'Beschreibe die Form.' })
    expect(result[2]).toMatchObject({ type: 'subtask', key: 'b', content: 'Berechne das Volumen.' })
  })

  it('parses multiple subtasks without preamble', () => {
    const text = 'a) Erste Aufgabe.\nb) Zweite Aufgabe.\nc) Dritte Aufgabe.'
    const result = parseQuestion(text)
    // No preamble because text starts directly with subtask marker
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(3)
    expect(subtasks[0]).toMatchObject({ key: 'a' })
    expect(subtasks[1]).toMatchObject({ key: 'b' })
    expect(subtasks[2]).toMatchObject({ key: 'c' })
  })

  it('trims whitespace from preamble and subtask content', () => {
    const text = '  Einleitung  \n\na)   Aufgabenteil  \n'
    const result = parseQuestion(text)
    const preamble = result.find(p => p.type === 'preamble')
    const subtask = result.find(p => p.type === 'subtask')
    expect(preamble?.content).toBe('Einleitung')
    expect(subtask?.content).toBe('Aufgabenteil')
  })

  it('handles subtask text spanning multiple lines', () => {
    const text = 'Intro\n\na) Erste Zeile\nZweite Zeile\nDritte Zeile\nb) Neue Aufgabe'
    const result = parseQuestion(text)
    const aTask = result.find(p => p.type === 'subtask' && (p as { key: string }).key === 'a')
    expect(aTask?.content).toContain('Erste Zeile')
    expect(aTask?.content).toContain('Zweite Zeile')
  })

  it('assigns correct sequential keys to subtasks', () => {
    const text = 'a) Eins\nb) Zwei\nc) Drei\nd) Vier'
    const result = parseQuestion(text)
    const keys = result
      .filter(p => p.type === 'subtask')
      .map(p => (p as { key: string }).key)
    expect(keys).toEqual(['a', 'b', 'c', 'd'])
  })

  it('does not produce preamble when text starts directly with subtask', () => {
    const text = 'a) Direkt los'
    const result = parseQuestion(text)
    expect(result.every(p => p.type !== 'preamble')).toBe(true)
  })
})
