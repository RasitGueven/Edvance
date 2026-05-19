import { describe, it, expect } from 'vitest'
import {
  inputTypeLabel,
  cognitiveTypeLabel,
  difficultyLabel,
  INPUT_TYPE_LABELS,
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
} from '@/lib/taskLabels'

describe('INPUT_TYPE_LABELS', () => {
  it('covers all InputType values', () => {
    const keys = Object.keys(INPUT_TYPE_LABELS)
    expect(keys).toContain('MC')
    expect(keys).toContain('FREE_INPUT')
    expect(keys).toContain('STEPS')
    expect(keys).toContain('MATCHING')
    expect(keys).toContain('DRAW')
  })
})

describe('COGNITIVE_TYPE_LABELS', () => {
  it('covers all CognitiveType values', () => {
    const keys = Object.keys(COGNITIVE_TYPE_LABELS)
    expect(keys).toContain('FACT')
    expect(keys).toContain('TRANSFER')
    expect(keys).toContain('ANALYSIS')
  })
})

describe('DIFFICULTY_OPTIONS', () => {
  it('has entries for 1-5', () => {
    const values = DIFFICULTY_OPTIONS.map(d => d.value)
    expect(values).toEqual([1, 2, 3, 4, 5])
  })
})

describe('inputTypeLabel()', () => {
  it('returns readable label for MC', () => {
    expect(inputTypeLabel('MC')).toBe('Multiple Choice')
  })

  it('returns "–" for null', () => {
    expect(inputTypeLabel(null)).toBe('–')
  })

  it('returns "–" for undefined', () => {
    expect(inputTypeLabel(undefined)).toBe('–')
  })
})

describe('cognitiveTypeLabel()', () => {
  it('returns label for FACT', () => {
    expect(cognitiveTypeLabel('FACT')).toBe('Faktenwissen')
  })

  it('returns "–" for null', () => {
    expect(cognitiveTypeLabel(null)).toBe('–')
  })
})

describe('difficultyLabel()', () => {
  it('returns label for value 3', () => {
    expect(difficultyLabel(3)).toBe('3 – Mittel')
  })

  it('returns "–" for null', () => {
    expect(difficultyLabel(null)).toBe('–')
  })

  it('returns raw value for unknown difficulty', () => {
    expect(difficultyLabel(9)).toBe('9')
  })
})
