import { describe, it, expect } from 'vitest'
import { parseQuestion } from '@/lib/render/taskQuestionParser'
import type { QuestionPart } from '@/lib/render/taskQuestionParser'

describe('parseQuestion', () => {
  // ── Null / Empty ────────────────────────────────────────────────────────────

  it('returns empty array for null', () => {
    expect(parseQuestion(null)).toEqual([])
  })

  it('returns empty array for undefined', () => {
    expect(parseQuestion(undefined)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseQuestion('')).toEqual([])
  })

  // ── No subtasks ─────────────────────────────────────────────────────────────

  it('returns single preamble for plain text', () => {
    const result = parseQuestion('Berechne 2 + 2.')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'preamble', content: 'Berechne 2 + 2.' })
  })

  it('trims whitespace around preamble', () => {
    const result = parseQuestion('  Aufgabe  ')
    expect(result[0].content).toBe('Aufgabe')
  })

  it('returns single preamble with newlines if no subtask markers', () => {
    const text = 'Zeile 1\nZeile 2\nZeile 3'
    const result = parseQuestion(text)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('preamble')
  })

  // ── Subtasks only ───────────────────────────────────────────────────────────

  it('parses two subtasks without preamble', () => {
    const text = 'a) Erste Aufgabe\nb) Zweite Aufgabe'
    const result = parseQuestion(text)
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(2)
    expect(subtasks[0]).toEqual({ type: 'subtask', key: 'a', content: 'Erste Aufgabe' })
    expect(subtasks[1]).toEqual({ type: 'subtask', key: 'b', content: 'Zweite Aufgabe' })
  })

  it('parses three subtasks', () => {
    const text = 'a) Aufgabe A\nb) Aufgabe B\nc) Aufgabe C'
    const result = parseQuestion(text)
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(3)
    expect(subtasks[2]).toEqual({ type: 'subtask', key: 'c', content: 'Aufgabe C' })
  })

  // ── Preamble + subtasks ─────────────────────────────────────────────────────

  it('separates preamble from subtasks', () => {
    const text = 'Ein Würfel hat 6 Seiten.\n\na) Berechne das Volumen.\nb) Berechne die Oberfläche.'
    const result = parseQuestion(text)
    expect(result[0].type).toBe('preamble')
    expect((result[0] as Extract<QuestionPart, { type: 'preamble' }>).content).toContain('Ein Würfel')
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(2)
  })

  it('trims content of each subtask', () => {
    const text = 'Preamble\n\na)   Eingerückte Aufgabe   \nb) Nächste'
    const result = parseQuestion(text)
    const sub = result.find(p => p.type === 'subtask' && (p as Extract<QuestionPart, { type: 'subtask' }>).key === 'a')
    expect((sub as Extract<QuestionPart, { type: 'subtask' }>).content).toBe('Eingerückte Aufgabe')
  })

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it('handles single subtask with no preamble', () => {
    const result = parseQuestion('a) Nur eine Aufgabe')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'subtask', key: 'a', content: 'Nur eine Aufgabe' })
  })

  it('handles text with table marker in preamble', () => {
    const text = 'Gegeben ist:\n\n[TABLE]\n\na) Lies ab.\nb) Erkläre.'
    const result = parseQuestion(text)
    expect(result[0].type).toBe('preamble')
    expect((result[0] as Extract<QuestionPart, { type: 'preamble' }>).content).toContain('[TABLE]')
    expect(result.filter(p => p.type === 'subtask')).toHaveLength(2)
  })

  it('captures multiline subtask content', () => {
    const text = 'a) Zeile 1\nZeile 2\nZeile 3\nb) Nächste'
    const result = parseQuestion(text)
    const subA = result.find(p => p.type === 'subtask' && (p as Extract<QuestionPart, { type: 'subtask' }>).key === 'a')
    expect((subA as Extract<QuestionPart, { type: 'subtask' }>).content).toContain('Zeile 1')
    expect((subA as Extract<QuestionPart, { type: 'subtask' }>).content).toContain('Zeile 2')
  })

  it('handles subtask marker at start of string', () => {
    const result = parseQuestion('a) Start of text')
    expect(result[0].type).toBe('subtask')
  })

  it('returns correct QuestionPart types', () => {
    const result = parseQuestion('Preamble\na) Sub')
    for (const part of result) {
      expect(['preamble', 'subtask']).toContain(part.type)
    }
  })
})
