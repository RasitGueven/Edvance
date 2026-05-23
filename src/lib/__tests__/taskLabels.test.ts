import { describe, it, expect } from 'vitest'
import {
  inputTypeLabel,
  cognitiveTypeLabel,
  difficultyLabel,
  INPUT_TYPE_LABELS,
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
} from '../taskLabels'

describe('INPUT_TYPE_LABELS', () => {
  it('contains label for every InputType', () => {
    const expected = ['MC', 'FREE_INPUT', 'STEPS', 'MATCHING', 'DRAW']
    for (const key of expected) {
      expect(INPUT_TYPE_LABELS).toHaveProperty(key)
    }
  })
})

describe('COGNITIVE_TYPE_LABELS', () => {
  it('contains label for every CognitiveType', () => {
    const expected = ['FACT', 'TRANSFER', 'ANALYSIS']
    for (const key of expected) {
      expect(COGNITIVE_TYPE_LABELS).toHaveProperty(key)
    }
  })
})

describe('DIFFICULTY_OPTIONS', () => {
  it('has 5 entries for difficulty 1–5', () => {
    expect(DIFFICULTY_OPTIONS).toHaveLength(5)
  })

  it('values are 1 to 5 in order', () => {
    expect(DIFFICULTY_OPTIONS.map((d) => d.value)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('inputTypeLabel', () => {
  it('returns German label for MC', () => {
    expect(inputTypeLabel('MC')).toBe('Multiple Choice')
  })

  it('returns German label for FREE_INPUT', () => {
    expect(inputTypeLabel('FREE_INPUT')).toBe('Freie Eingabe')
  })

  it('returns dash for null', () => {
    expect(inputTypeLabel(null)).toBe('–')
  })

  it('returns dash for undefined', () => {
    expect(inputTypeLabel(undefined)).toBe('–')
  })
})

describe('cognitiveTypeLabel', () => {
  it('returns German label for FACT', () => {
    expect(cognitiveTypeLabel('FACT')).toBe('Faktenwissen')
  })

  it('returns German label for ANALYSIS', () => {
    expect(cognitiveTypeLabel('ANALYSIS')).toBe('Analyse / Problemlösen')
  })

  it('returns dash for null', () => {
    expect(cognitiveTypeLabel(null)).toBe('–')
  })
})

describe('difficultyLabel', () => {
  it('returns label for difficulty 1', () => {
    expect(difficultyLabel(1)).toBe('1 – Sehr leicht')
  })

  it('returns label for difficulty 5', () => {
    expect(difficultyLabel(5)).toBe('5 – Sehr schwer')
  })

  it('returns numeric string for unknown value', () => {
    expect(difficultyLabel(99)).toBe('99')
  })

  it('returns dash for null', () => {
    expect(difficultyLabel(null)).toBe('–')
  })

  it('returns dash for undefined', () => {
    expect(difficultyLabel(undefined)).toBe('–')
  })
})
