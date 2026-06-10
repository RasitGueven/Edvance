import { describe, it, expect } from 'vitest'
import { parseQuestion } from '@/lib/render/taskQuestionParser'

describe('parseQuestion', () => {
  describe('null / undefined / empty input', () => {
    it('null → []', () => {
      expect(parseQuestion(null)).toEqual([])
    })

    it('undefined → []', () => {
      expect(parseQuestion(undefined)).toEqual([])
    })

    it('empty string → []', () => {
      expect(parseQuestion('')).toEqual([])
    })
  })

  describe('no subtask markers', () => {
    it('plain text → single preamble part', () => {
      const result = parseQuestion('Just a question without subtasks.')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('preamble')
      expect(result[0].content).toBe('Just a question without subtasks.')
    })

    it('text with trailing whitespace is trimmed in preamble', () => {
      const result = parseQuestion('  Some text  ')
      expect(result[0].content).toBe('Some text')
    })
  })

  describe('single subtask', () => {
    it('"a) text" → single subtask, no preamble', () => {
      const result = parseQuestion('a) Describe the process')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('subtask')
      if (result[0].type === 'subtask') {
        expect(result[0].key).toBe('a')
        expect(result[0].content).toBe('Describe the process')
      }
    })
  })

  describe('preamble + subtasks', () => {
    it('preamble followed by two subtasks', () => {
      const text = 'preamble text\n\na) first subtask\nb) second subtask'
      const result = parseQuestion(text)
      expect(result).toHaveLength(3)
      expect(result[0].type).toBe('preamble')
      expect(result[0].content).toBe('preamble text')
      expect(result[1].type).toBe('subtask')
      expect(result[2].type).toBe('subtask')
    })

    it('preamble content is correct', () => {
      const text = 'Ein Würfel liegt auf dem Tisch.\n\na) Berechne'
      const result = parseQuestion(text)
      expect(result[0].content).toBe('Ein Würfel liegt auf dem Tisch.')
    })
  })

  describe('consecutive subtasks a/b/c', () => {
    it('parses three consecutive subtasks', () => {
      const text = 'a) alpha\nb) beta\nc) gamma'
      const result = parseQuestion(text)
      // No preamble since first char is 'a)'
      const subtasks = result.filter((p) => p.type === 'subtask')
      expect(subtasks).toHaveLength(3)
    })

    it('keys are a, b, c', () => {
      const text = 'a) first\nb) second\nc) third'
      const result = parseQuestion(text)
      const subtasks = result.filter((p) => p.type === 'subtask')
      expect(subtasks[0].type === 'subtask' && subtasks[0].key).toBe('a')
      expect(subtasks[1].type === 'subtask' && subtasks[1].key).toBe('b')
      expect(subtasks[2].type === 'subtask' && subtasks[2].key).toBe('c')
    })
  })

  describe('content trimming', () => {
    it('each subtask content is trimmed', () => {
      const text = 'a) first answer   \nb) second answer'
      const result = parseQuestion(text)
      const a = result.find((p) => p.type === 'subtask' && p.key === 'a')
      expect(a?.content).toBe('first answer')
    })

    it('multiline subtask content includes inner content', () => {
      const text = 'a) line one\nstill subtask a\nb) subtask b'
      const result = parseQuestion(text)
      const a = result.find((p) => p.type === 'subtask' && p.key === 'a')
      expect(a?.content).toBe('line one\nstill subtask a')
    })
  })

  describe('preamble + multiple subtasks from spec example', () => {
    it('full example from spec comment parses correctly', () => {
      const text =
        'Ein Wuerfel hat 6 Seiten. Die Tabelle zeigt:\n\n[TABLE]\n\na) Ordne die Zeilen ...\nb) Begruende ...'
      const result = parseQuestion(text)
      const preamble = result.find((p) => p.type === 'preamble')
      expect(preamble?.content).toContain('[TABLE]')
      const subtaskKeys = result
        .filter((p) => p.type === 'subtask')
        .map((p) => (p.type === 'subtask' ? p.key : ''))
      expect(subtaskKeys).toContain('a')
      expect(subtaskKeys).toContain('b')
    })
  })
})
