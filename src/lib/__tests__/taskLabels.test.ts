import { describe, it, expect } from 'vitest'
import {
  INPUT_TYPE_LABELS,
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
  inputTypeLabel,
  cognitiveTypeLabel,
  difficultyLabel,
} from '../taskLabels'
import type { InputType, CognitiveType } from '@/types'

describe('INPUT_TYPE_LABELS', () => {
  it('has a label for every InputType', () => {
    const types: InputType[] = ['MC', 'FREE_INPUT', 'STEPS', 'MATCHING', 'DRAW']
    for (const t of types) {
      expect(INPUT_TYPE_LABELS[t]).toBeTruthy()
    }
  })

  it('labels MC as "Multiple Choice"', () => {
    expect(INPUT_TYPE_LABELS.MC).toBe('Multiple Choice')
  })

  it('labels FREE_INPUT as "Freie Eingabe"', () => {
    expect(INPUT_TYPE_LABELS.FREE_INPUT).toBe('Freie Eingabe')
  })
})

describe('COGNITIVE_TYPE_LABELS', () => {
  it('has a label for every CognitiveType', () => {
    const types: CognitiveType[] = ['FACT', 'TRANSFER', 'ANALYSIS']
    for (const t of types) {
      expect(COGNITIVE_TYPE_LABELS[t]).toBeTruthy()
    }
  })

  it('labels FACT as "Faktenwissen"', () => {
    expect(COGNITIVE_TYPE_LABELS.FACT).toBe('Faktenwissen')
  })
})

describe('DIFFICULTY_OPTIONS', () => {
  it('has exactly 5 entries', () => {
    expect(DIFFICULTY_OPTIONS).toHaveLength(5)
  })

  it('values run from 1 to 5', () => {
    const values = DIFFICULTY_OPTIONS.map((d) => d.value)
    expect(values).toEqual([1, 2, 3, 4, 5])
  })

  it('each entry has a non-empty label', () => {
    for (const opt of DIFFICULTY_OPTIONS) {
      expect(opt.label.length).toBeGreaterThan(0)
    }
  })
})

describe('inputTypeLabel()', () => {
  it('returns the human-readable label for a valid type', () => {
    expect(inputTypeLabel('MC')).toBe('Multiple Choice')
    expect(inputTypeLabel('DRAW')).toBe('Zeichnung')
  })

  it('returns "–" for null', () => {
    expect(inputTypeLabel(null)).toBe('–')
  })

  it('returns "–" for undefined', () => {
    expect(inputTypeLabel(undefined)).toBe('–')
  })
})

describe('cognitiveTypeLabel()', () => {
  it('returns the human-readable label for a valid type', () => {
    expect(cognitiveTypeLabel('FACT')).toBe('Faktenwissen')
    expect(cognitiveTypeLabel('ANALYSIS')).toBe('Analyse / Problemlösen')
  })

  it('returns "–" for null', () => {
    expect(cognitiveTypeLabel(null)).toBe('–')
  })

  it('returns "–" for undefined', () => {
    expect(cognitiveTypeLabel(undefined)).toBe('–')
  })
})

describe('difficultyLabel()', () => {
  it('returns the correct label for value 1', () => {
    expect(difficultyLabel(1)).toBe('1 – Sehr leicht')
  })

  it('returns the correct label for value 5', () => {
    expect(difficultyLabel(5)).toBe('5 – Sehr schwer')
  })

  it('returns the number as string for an unknown value', () => {
    expect(difficultyLabel(99)).toBe('99')
  })

  it('returns "–" for null', () => {
    expect(difficultyLabel(null)).toBe('–')
  })

  it('returns "–" for undefined', () => {
    expect(difficultyLabel(undefined)).toBe('–')
  })

  it('returns correct labels for all 5 difficulty levels', () => {
    expect(difficultyLabel(2)).toBe('2 – Leicht')
    expect(difficultyLabel(3)).toBe('3 – Mittel')
    expect(difficultyLabel(4)).toBe('4 – Schwer')
  })
})
