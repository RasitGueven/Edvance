import { describe, it, expect } from 'vitest'
import {
  INPUT_TYPE_LABELS,
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
  inputTypeLabel,
  cognitiveTypeLabel,
} from '@/lib/taskLabels'

describe('INPUT_TYPE_LABELS', () => {
  it('has a label for every InputType', () => {
    expect(INPUT_TYPE_LABELS.MC).toBe('Multiple Choice')
    expect(INPUT_TYPE_LABELS.FREE_INPUT).toBe('Freie Eingabe')
    expect(INPUT_TYPE_LABELS.STEPS).toBe('Schritt für Schritt')
    expect(INPUT_TYPE_LABELS.MATCHING).toBe('Zuordnung')
    expect(INPUT_TYPE_LABELS.DRAW).toBe('Zeichnung')
  })
})

describe('COGNITIVE_TYPE_LABELS', () => {
  it('has a label for every CognitiveType', () => {
    expect(COGNITIVE_TYPE_LABELS.FACT).toBe('Faktenwissen')
    expect(COGNITIVE_TYPE_LABELS.TRANSFER).toBe('Transfer / Anwendung')
    expect(COGNITIVE_TYPE_LABELS.ANALYSIS).toBe('Analyse / Problemlösen')
  })
})

describe('DIFFICULTY_OPTIONS', () => {
  it('has exactly 5 entries', () => {
    expect(DIFFICULTY_OPTIONS).toHaveLength(5)
  })

  it('has values 1 through 5', () => {
    const values = DIFFICULTY_OPTIONS.map(o => o.value)
    expect(values).toEqual([1, 2, 3, 4, 5])
  })

  it('all labels are non-empty strings', () => {
    for (const opt of DIFFICULTY_OPTIONS) {
      expect(opt.label.length).toBeGreaterThan(0)
    }
  })
})

describe('inputTypeLabel', () => {
  it('returns German label for a valid InputType', () => {
    expect(inputTypeLabel('MC')).toBe('Multiple Choice')
    expect(inputTypeLabel('FREE_INPUT')).toBe('Freie Eingabe')
    expect(inputTypeLabel('STEPS')).toBe('Schritt für Schritt')
    expect(inputTypeLabel('MATCHING')).toBe('Zuordnung')
    expect(inputTypeLabel('DRAW')).toBe('Zeichnung')
  })

  it('returns "–" for null', () => {
    expect(inputTypeLabel(null)).toBe('–')
  })

  it('returns "–" for undefined', () => {
    expect(inputTypeLabel(undefined)).toBe('–')
  })
})

describe('cognitiveTypeLabel', () => {
  it('returns German label for a valid CognitiveType', () => {
    expect(cognitiveTypeLabel('FACT')).toBe('Faktenwissen')
    expect(cognitiveTypeLabel('TRANSFER')).toBe('Transfer / Anwendung')
    expect(cognitiveTypeLabel('ANALYSIS')).toBe('Analyse / Problemlösen')
  })

  it('returns "–" for null', () => {
    expect(cognitiveTypeLabel(null)).toBe('–')
  })

  it('returns "–" for undefined', () => {
    expect(cognitiveTypeLabel(undefined)).toBe('–')
  })
})
