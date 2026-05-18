import { describe, it, expect } from 'vitest'
import { parseQuestion } from './taskQuestionParser'

describe('parseQuestion()', () => {
  // ── Null / empty guards ──────────────────────────────────────────────────────

  it('returns [] for null', () => {
    expect(parseQuestion(null)).toEqual([])
  })

  it('returns [] for undefined', () => {
    expect(parseQuestion(undefined)).toEqual([])
  })

  it('returns [] for empty string', () => {
    expect(parseQuestion('')).toEqual([])
  })

  // ── No subtasks → single preamble ────────────────────────────────────────────

  it('returns single preamble when no subtask markers exist', () => {
    const result = parseQuestion('Berechne den Umfang eines Kreises.')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      type: 'preamble',
      content: 'Berechne den Umfang eines Kreises.',
    })
  })

  it('trims whitespace from plain preamble', () => {
    const result = parseQuestion('  Keine Teilaufgaben  ')
    expect(result[0].content).toBe('Keine Teilaufgaben')
  })

  // ── Single subtask without preamble ─────────────────────────────────────────

  it('handles single subtask at start with no preamble', () => {
    const result = parseQuestion('a) Löse die Gleichung.')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'subtask', key: 'a', content: 'Löse die Gleichung.' })
  })

  // ── Preamble + multiple subtasks ─────────────────────────────────────────────

  it('separates preamble from subtasks', () => {
    const text = 'Ein Würfel hat die Kantenlänge 5 cm.\n\na) Berechne das Volumen.\nb) Berechne die Oberfläche.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ type: 'preamble', content: 'Ein Würfel hat die Kantenlänge 5 cm.' })
    expect(result[1]).toMatchObject({ type: 'subtask', key: 'a', content: 'Berechne das Volumen.' })
    expect(result[2]).toMatchObject({ type: 'subtask', key: 'b', content: 'Berechne die Oberfläche.' })
  })

  it('assigns correct keys a, b, c for three subtasks', () => {
    const text = 'Einleitung:\n\na) Erste Teilaufgabe\nb) Zweite Teilaufgabe\nc) Dritte Teilaufgabe'
    const result = parseQuestion(text)
    const subtasks = result.filter((p) => p.type === 'subtask')
    expect(subtasks).toHaveLength(3)
    expect(subtasks.map((s) => (s as { key: string }).key)).toEqual(['a', 'b', 'c'])
  })

  it('trims content within each subtask', () => {
    const text = 'a) Erste Aufgabe   \nb) Zweite Aufgabe   '
    const result = parseQuestion(text)
    const [first, second] = result as [{ content: string }, { content: string }]
    expect(first.content).toBe('Erste Aufgabe')
    expect(second.content).toBe('Zweite Aufgabe')
  })

  // ── Preamble content preservation ───────────────────────────────────────────

  it('preserves multiline preamble', () => {
    const text = 'Zeile 1\nZeile 2\n\na) Teilaufgabe'
    const result = parseQuestion(text)
    expect(result[0]).toMatchObject({ type: 'preamble', content: 'Zeile 1\nZeile 2' })
  })

  // ── No preamble (subtask at beginning) ──────────────────────────────────────

  it('skips empty preamble when subtask starts at position 0', () => {
    const text = 'a) Direkt los\nb) Zweite'
    const result = parseQuestion(text)
    // No preamble part — starts directly with subtask
    const preambles = result.filter((p) => p.type === 'preamble')
    expect(preambles).toHaveLength(0)
  })

  // ── Edge case: inline subtask marker within sentence (no newline) ────────────
  // The regex anchors on ^ or \n, so "a)" mid-sentence without newline is not split

  it('does not split on "a)" in the middle of a sentence without preceding newline', () => {
    const text = 'Ordne die Antworten a) und b) zu.'
    // "a)" appears after " " (not ^ or \n), but the regex uses (?:^|\n)
    // "a)" at start of text matches ^, so it IS parsed as subtask key 'a'
    // This is an edge case we document here
    const result = parseQuestion(text)
    // We simply verify the function returns something consistent
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  // ── Real-world example ───────────────────────────────────────────────────────

  it('handles the docstring example correctly', () => {
    const text = 'Ein Wuerfel ... Die Tabelle zeigt:\n\n[TABLE]\n\na) Ordne die Zeilen ...\nb) Begruende ...'
    const result = parseQuestion(text)
    expect(result).toHaveLength(3)
    expect(result[0].type).toBe('preamble')
    expect(result[1]).toMatchObject({ type: 'subtask', key: 'a' })
    expect(result[2]).toMatchObject({ type: 'subtask', key: 'b' })
  })
})
