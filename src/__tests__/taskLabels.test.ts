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
  it('maps all known input types', () => {
    expect(INPUT_TYPE_LABELS.MC).toBe('Multiple Choice')
    expect(INPUT_TYPE_LABELS.FREE_INPUT).toBe('Freie Eingabe')
    expect(INPUT_TYPE_LABELS.STEPS).toBe('Schritt für Schritt')
    expect(INPUT_TYPE_LABELS.MATCHING).toBe('Zuordnung')
    expect(INPUT_TYPE_LABELS.DRAW).toBe('Zeichnung')
  })
})

describe('COGNITIVE_TYPE_LABELS', () => {
  it('maps all cognitive types', () => {
    expect(COGNITIVE_TYPE_LABELS.FACT).toBe('Faktenwissen')
    expect(COGNITIVE_TYPE_LABELS.TRANSFER).toBe('Transfer / Anwendung')
    expect(COGNITIVE_TYPE_LABELS.ANALYSIS).toBe('Analyse / Problemlösen')
  })
})

describe('DIFFICULTY_OPTIONS', () => {
  it('has exactly 5 options', () => {
    expect(DIFFICULTY_OPTIONS).toHaveLength(5)
  })

  it('covers values 1 through 5', () => {
    const values = DIFFICULTY_OPTIONS.map((d) => d.value)
    expect(values).toEqual([1, 2, 3, 4, 5])
  })
})

describe('inputTypeLabel', () => {
  it('returns correct label for known type', () => {
    expect(inputTypeLabel('MC')).toBe('Multiple Choice')
    expect(inputTypeLabel('DRAW')).toBe('Zeichnung')
  })

  it('returns dash for null', () => {
    expect(inputTypeLabel(null)).toBe('–')
  })

  it('returns dash for undefined', () => {
    expect(inputTypeLabel(undefined)).toBe('–')
  })
})

describe('cognitiveTypeLabel', () => {
  it('returns correct label for known type', () => {
    expect(cognitiveTypeLabel('FACT')).toBe('Faktenwissen')
    expect(cognitiveTypeLabel('ANALYSIS')).toBe('Analyse / Problemlösen')
  })

  it('returns dash for null', () => {
    expect(cognitiveTypeLabel(null)).toBe('–')
  })

  it('returns dash for undefined', () => {
    expect(cognitiveTypeLabel(undefined)).toBe('–')
  })
})

describe('difficultyLabel', () => {
  it('returns label for valid values', () => {
    expect(difficultyLabel(1)).toBe('1 – Sehr leicht')
    expect(difficultyLabel(3)).toBe('3 – Mittel')
    expect(difficultyLabel(5)).toBe('5 – Sehr schwer')
  })

  it('returns dash for null', () => {
    expect(difficultyLabel(null)).toBe('–')
  })

  it('returns dash for undefined', () => {
    expect(difficultyLabel(undefined)).toBe('–')
  })

  it('returns raw value string for out-of-range numbers', () => {
    expect(difficultyLabel(9)).toBe('9')
  })
})
