import { describe, it, expect } from 'vitest'
import {
  INPUT_TYPE_LABELS,
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
  inputTypeLabel,
  cognitiveTypeLabel,
  difficultyLabel,
} from '@/lib/taskLabels'
import type { InputType, CognitiveType } from '@/types'

// ── INPUT_TYPE_LABELS ────────────────────────────────────────────────────────

describe('INPUT_TYPE_LABELS', () => {
  it('covers all InputTypes', () => {
    const types: InputType[] = ['MC', 'FREE_INPUT', 'STEPS', 'MATCHING', 'DRAW']
    for (const t of types) {
      expect(INPUT_TYPE_LABELS[t]).toBeTruthy()
    }
  })

  it('has correct German label for MC', () => {
    expect(INPUT_TYPE_LABELS['MC']).toBe('Multiple Choice')
  })

  it('has correct German label for FREE_INPUT', () => {
    expect(INPUT_TYPE_LABELS['FREE_INPUT']).toBe('Freie Eingabe')
  })
})

// ── COGNITIVE_TYPE_LABELS ────────────────────────────────────────────────────

describe('COGNITIVE_TYPE_LABELS', () => {
  it('covers all CognitiveTypes', () => {
    const types: CognitiveType[] = ['FACT', 'TRANSFER', 'ANALYSIS']
    for (const t of types) {
      expect(COGNITIVE_TYPE_LABELS[t]).toBeTruthy()
    }
  })

  it('has correct German label for FACT', () => {
    expect(COGNITIVE_TYPE_LABELS['FACT']).toBe('Faktenwissen')
  })
})

// ── DIFFICULTY_OPTIONS ───────────────────────────────────────────────────────

describe('DIFFICULTY_OPTIONS', () => {
  it('has 5 options', () => {
    expect(DIFFICULTY_OPTIONS).toHaveLength(5)
  })

  it('values are 1 through 5', () => {
    const values = DIFFICULTY_OPTIONS.map(d => d.value)
    expect(values).toEqual([1, 2, 3, 4, 5])
  })

  it('each option has a non-empty label', () => {
    for (const opt of DIFFICULTY_OPTIONS) {
      expect(opt.label).toBeTruthy()
    }
  })
})

// ── inputTypeLabel ───────────────────────────────────────────────────────────

describe('inputTypeLabel', () => {
  it('returns label for valid InputType', () => {
    expect(inputTypeLabel('MC')).toBe('Multiple Choice')
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

// ── cognitiveTypeLabel ───────────────────────────────────────────────────────

describe('cognitiveTypeLabel', () => {
  it('returns label for valid CognitiveType', () => {
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

// ── difficultyLabel ──────────────────────────────────────────────────────────

describe('difficultyLabel', () => {
  it('returns correct label for value 1', () => {
    expect(difficultyLabel(1)).toBe('1 – Sehr leicht')
  })

  it('returns correct label for value 5', () => {
    expect(difficultyLabel(5)).toBe('5 – Sehr schwer')
  })

  it('returns "–" for null', () => {
    expect(difficultyLabel(null)).toBe('–')
  })

  it('returns "–" for undefined', () => {
    expect(difficultyLabel(undefined)).toBe('–')
  })

  it('returns raw number string for unknown value', () => {
    expect(difficultyLabel(99)).toBe('99')
  })

  it('returns correct labels for all defined values', () => {
    expect(difficultyLabel(2)).toBe('2 – Leicht')
    expect(difficultyLabel(3)).toBe('3 – Mittel')
    expect(difficultyLabel(4)).toBe('4 – Schwer')
  })
})
