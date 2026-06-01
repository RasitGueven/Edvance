import { describe, it, expect } from 'vitest'
import {
  INPUT_TYPE_LABELS,
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
  inputTypeLabel,
  cognitiveTypeLabel,
  difficultyLabel,
} from '@/lib/taskLabels'

describe('INPUT_TYPE_LABELS', () => {
  it('covers all expected input types', () => {
    expect(INPUT_TYPE_LABELS['MC']).toBe('Multiple Choice')
    expect(INPUT_TYPE_LABELS['FREE_INPUT']).toBe('Freie Eingabe')
    expect(INPUT_TYPE_LABELS['STEPS']).toBe('Schritt für Schritt')
    expect(INPUT_TYPE_LABELS['MATCHING']).toBe('Zuordnung')
    expect(INPUT_TYPE_LABELS['DRAW']).toBe('Zeichnung')
  })
})

describe('COGNITIVE_TYPE_LABELS', () => {
  it('covers all cognitive types', () => {
    expect(COGNITIVE_TYPE_LABELS['FACT']).toBe('Faktenwissen')
    expect(COGNITIVE_TYPE_LABELS['TRANSFER']).toBe('Transfer / Anwendung')
    expect(COGNITIVE_TYPE_LABELS['ANALYSIS']).toBe('Analyse / Problemlösen')
  })
})

describe('DIFFICULTY_OPTIONS', () => {
  it('has 5 entries from 1 to 5', () => {
    expect(DIFFICULTY_OPTIONS).toHaveLength(5)
    expect(DIFFICULTY_OPTIONS[0].value).toBe(1)
    expect(DIFFICULTY_OPTIONS[4].value).toBe(5)
  })

  it('each entry has a non-empty label', () => {
    for (const opt of DIFFICULTY_OPTIONS) {
      expect(opt.label.length).toBeGreaterThan(0)
    }
  })
})

describe('inputTypeLabel', () => {
  it('returns the German label for a valid InputType', () => {
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

describe('cognitiveTypeLabel', () => {
  it('returns the German label for a valid CognitiveType', () => {
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

describe('difficultyLabel', () => {
  it('returns the correct label for values 1–5', () => {
    expect(difficultyLabel(1)).toContain('Sehr leicht')
    expect(difficultyLabel(3)).toContain('Mittel')
    expect(difficultyLabel(5)).toContain('Sehr schwer')
  })

  it('returns "–" for null', () => {
    expect(difficultyLabel(null)).toBe('–')
  })

  it('returns "–" for undefined', () => {
    expect(difficultyLabel(undefined)).toBe('–')
  })

  it('falls back to the numeric string for an unknown value', () => {
    expect(difficultyLabel(99)).toBe('99')
  })
})
