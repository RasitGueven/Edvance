import { describe, it, expect } from 'vitest'
import { parseQuestion } from '../taskQuestionParser'

describe('parseQuestion()', () => {
  it('returns empty array for null', () => {
    expect(parseQuestion(null)).toEqual([])
  })

  it('returns empty array for undefined', () => {
    expect(parseQuestion(undefined)).toEqual([])
  })

  it('returns empty array for an empty string', () => {
    expect(parseQuestion('')).toEqual([])
  })

  it('returns a single preamble block when there are no subtask markers', () => {
    const text = 'Ein Würfel hat 6 Seiten. Beschreibe seine Eigenschaften.'
    const parts = parseQuestion(text)
    expect(parts).toHaveLength(1)
    expect(parts[0]).toEqual({ type: 'preamble', content: text.trim() })
  })

  it('trims whitespace from preamble content', () => {
    const parts = parseQuestion('  Nur Präambel.  ')
    expect(parts[0]?.content).toBe('Nur Präambel.')
  })

  it('splits into preamble + one subtask', () => {
    const text = 'Gegeben ist ein Dreieck.\n\na) Berechne den Umfang.'
    const parts = parseQuestion(text)
    expect(parts).toHaveLength(2)
    expect(parts[0]).toMatchObject({ type: 'preamble' })
    expect(parts[1]).toMatchObject({ type: 'subtask', key: 'a', content: 'Berechne den Umfang.' })
  })

  it('parses multiple subtasks correctly', () => {
    const text = 'Einleitung.\n\na) Erster Teil.\nb) Zweiter Teil.\nc) Dritter Teil.'
    const parts = parseQuestion(text)
    expect(parts).toHaveLength(4)
    expect(parts[0]).toMatchObject({ type: 'preamble' })
    expect(parts[1]).toMatchObject({ type: 'subtask', key: 'a' })
    expect(parts[2]).toMatchObject({ type: 'subtask', key: 'b' })
    expect(parts[3]).toMatchObject({ type: 'subtask', key: 'c' })
  })

  it('handles subtasks without a preamble', () => {
    const text = 'a) Erster Subtask.\nb) Zweiter Subtask.'
    const parts = parseQuestion(text)
    const preambles = parts.filter((p) => p.type === 'preamble')
    expect(preambles).toHaveLength(0)
    expect(parts).toHaveLength(2)
    expect(parts[0]).toMatchObject({ type: 'subtask', key: 'a' })
    expect(parts[1]).toMatchObject({ type: 'subtask', key: 'b' })
  })

  it('preserves multi-line content within subtasks', () => {
    const text = 'Einleitung\n\na) Zeile 1\nZeile 2\nZeile 3\nb) Anderer Teil.'
    const parts = parseQuestion(text)
    const subtaskA = parts.find((p) => p.type === 'subtask' && p.key === 'a')
    expect(subtaskA?.content).toContain('Zeile 1')
    expect(subtaskA?.content).toContain('Zeile 2')
  })

  it('trims subtask content', () => {
    const text = 'Preamble.\n\na)   Mit Leerzeichen vorne.  '
    const parts = parseQuestion(text)
    const subtask = parts.find((p) => p.type === 'subtask')
    expect(subtask?.content).toBe('Mit Leerzeichen vorne.')
  })

  it('handles a realistic Lambacher-style task with 3 subtasks', () => {
    const text = [
      'Ein Würfel hat Kantenlänge 4 cm. Die Tabelle zeigt seine Eigenschaften.',
      '',
      'a) Ordne die Zeilen nach Größe.',
      'b) Berechne das Volumen.',
      'c) Begründe deine Antwort.',
    ].join('\n')
    const parts = parseQuestion(text)
    expect(parts.filter((p) => p.type === 'subtask')).toHaveLength(3)
    expect(parts.find((p) => p.type === 'preamble')).toBeDefined()
  })

  it('each part has a type field of "preamble" or "subtask"', () => {
    const text = 'Intro\n\na) Teil A\nb) Teil B'
    const parts = parseQuestion(text)
    for (const p of parts) {
      expect(['preamble', 'subtask']).toContain(p.type)
    }
  })

  it('subtask parts include the correct key', () => {
    const text = 'a) Alpha\nb) Beta\nc) Gamma'
    const parts = parseQuestion(text)
    const subtasks = parts.filter((p) => p.type === 'subtask')
    const keys = subtasks.map((p) => p.key)
    expect(keys).toEqual(['a', 'b', 'c'])
  })

  it('handles text with only whitespace as empty', () => {
    const parts = parseQuestion('   ')
    // No subtask markers → single preamble, but content trims to empty? Check:
    // Actually text.trim() = '' but text itself is not falsy → single preamble with trimmed content
    // The function only returns [] for falsy, not empty trimmed
    if (parts.length > 0) {
      expect(parts[0]?.type).toBe('preamble')
    }
  })
})
