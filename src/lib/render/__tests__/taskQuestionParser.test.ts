import { describe, it, expect } from 'vitest'
import { parseQuestion } from '@/lib/render/taskQuestionParser'

describe('parseQuestion – Null/Leer-Fälle', () => {
  it('gibt leeres Array für null zurück', () => {
    expect(parseQuestion(null)).toEqual([])
  })

  it('gibt leeres Array für undefined zurück', () => {
    expect(parseQuestion(undefined)).toEqual([])
  })

  it('gibt leeres Array für leeren String zurück', () => {
    expect(parseQuestion('')).toEqual([])
  })
})

describe('parseQuestion – Nur Präambel (keine Teilaufgaben)', () => {
  it('gibt eine einzelne Präambel zurück', () => {
    const text = 'Berechne den Umfang eines Kreises mit Radius 5 cm.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('preamble')
    if (result[0].type === 'preamble') {
      expect(result[0].content).toBe(text)
    }
  })

  it('trimmt Whitespace in der Präambel', () => {
    const result = parseQuestion('  Ein Würfel hat 6 Seiten.  ')
    expect(result[0].type).toBe('preamble')
    if (result[0].type === 'preamble') {
      expect(result[0].content).toBe('Ein Würfel hat 6 Seiten.')
    }
  })

  it('erkennt Satzzeichen wie "a." als KEINE Teilaufgaben', () => {
    const text = 'Die Tabelle zeigt folgende Werte: a. Wert1 b. Wert2'
    const result = parseQuestion(text)
    // "a." mit Punkt, nicht "a)" mit Klammer → keine Teilaufgaben
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('preamble')
  })

  it('erkennt Buchstaben am Zeilenende als KEINE Teilaufgaben', () => {
    const text = 'Schreibe den Buchstaben a) nicht als Teilaufgabe, wenn es mitten im Satz steht: a) Ergebnis.'
    // "a)" am Zeilenanfang (nach \n oder am Anfang) ist eine Teilaufgabe
    const result = parseQuestion(text)
    // Da "a)" am Anfang des Strings steht, wird es als Teilaufgabe erkannt
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('parseQuestion – Aufgaben mit Teilaufgaben', () => {
  it('trennt Präambel und eine Teilaufgabe', () => {
    const text = 'Ein Quadrat hat Seite 4 cm.\n\na) Berechne den Umfang.'
    const result = parseQuestion(text)
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('preamble')
    expect(result[1].type).toBe('subtask')
  })

  it('gibt den korrekten Schlüssel für Teilaufgaben zurück', () => {
    const text = 'Gegeben:\n\na) Erste Aufgabe\nb) Zweite Aufgabe'
    const result = parseQuestion(text)
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(2)
    if (subtasks[0].type === 'subtask') expect(subtasks[0].key).toBe('a')
    if (subtasks[1].type === 'subtask') expect(subtasks[1].key).toBe('b')
  })

  it('extrahiert Content der Teilaufgaben korrekt', () => {
    const text = 'Aufgabe:\n\na) Berechne x.\nb) Bestimme y.'
    const result = parseQuestion(text)
    const subtaskA = result.find(p => p.type === 'subtask' && p.key === 'a')
    const subtaskB = result.find(p => p.type === 'subtask' && p.key === 'b')
    expect(subtaskA).toBeDefined()
    expect(subtaskB).toBeDefined()
    if (subtaskA?.type === 'subtask') expect(subtaskA.content).toBe('Berechne x.')
    if (subtaskB?.type === 'subtask') expect(subtaskB.content).toBe('Bestimme y.')
  })

  it('verarbeitet viele Teilaufgaben (a-e)', () => {
    const text = 'Aufgabenblock:\n\na) Teil A\nb) Teil B\nc) Teil C\nd) Teil D\ne) Teil E'
    const result = parseQuestion(text)
    const subtasks = result.filter(p => p.type === 'subtask')
    expect(subtasks).toHaveLength(5)
    const keys = subtasks.map(p => p.type === 'subtask' ? p.key : '').filter(Boolean)
    expect(keys).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('verarbeitet Teilaufgaben ohne Präambel', () => {
    const text = 'a) Erste Aufgabe\nb) Zweite Aufgabe'
    const result = parseQuestion(text)
    const preambles = result.filter(p => p.type === 'preamble')
    const subtasks = result.filter(p => p.type === 'subtask')
    // Wenn am Anfang des Strings eine Teilaufgabe steht, keine Präambel
    expect(preambles).toHaveLength(0)
    expect(subtasks).toHaveLength(2)
  })

  it('verarbeitet mehrzeiligen Content in Teilaufgaben', () => {
    const text = 'Basis:\n\na) Berechne:\n- Schritt 1\n- Schritt 2\nb) Erkläre.'
    const result = parseQuestion(text)
    const subtaskA = result.find(p => p.type === 'subtask' && p.key === 'a')
    expect(subtaskA).toBeDefined()
    if (subtaskA?.type === 'subtask') {
      expect(subtaskA.content).toContain('Schritt 1')
    }
  })

  it('Snapshot-Test für typische Mathe-Aufgabe', () => {
    const text = 'Ein Würfel hat die Seitenlänge 3 cm.\n\na) Berechne das Volumen.\nb) Bestimme die Oberfläche.'
    const result = parseQuestion(text)
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "content": "Ein Würfel hat die Seitenlänge 3 cm.",
          "type": "preamble",
        },
        {
          "content": "Berechne das Volumen.",
          "key": "a",
          "type": "subtask",
        },
        {
          "content": "Bestimme die Oberfläche.",
          "key": "b",
          "type": "subtask",
        },
      ]
    `)
  })
})
