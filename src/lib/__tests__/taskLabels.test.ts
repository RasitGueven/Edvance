import { describe, it, expect } from 'vitest'
import {
  CONTENT_TYPE_LABELS,
  INPUT_TYPE_LABELS,
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
  inputTypeLabel,
  cognitiveTypeLabel,
} from '@/lib/taskLabels'
import type { InputType, CognitiveType } from '@/types'

describe('INPUT_TYPE_LABELS – Deutsche Labels', () => {
  it('enthält alle Input-Typen', () => {
    const expectedTypes: InputType[] = ['MC', 'FREE_INPUT', 'STEPS', 'MATCHING', 'DRAW']
    expectedTypes.forEach(type => {
      expect(INPUT_TYPE_LABELS[type]).toBeDefined()
      expect(typeof INPUT_TYPE_LABELS[type]).toBe('string')
    })
  })

  it('übersetzt MC korrekt', () => {
    expect(INPUT_TYPE_LABELS['MC']).toBe('Multiple Choice')
  })

  it('übersetzt STEPS korrekt', () => {
    expect(INPUT_TYPE_LABELS['STEPS']).toBe('Schritt für Schritt')
  })
})

describe('COGNITIVE_TYPE_LABELS – Deutsche Labels', () => {
  it('enthält alle Kognitionstypen', () => {
    const expectedTypes: CognitiveType[] = ['FACT', 'TRANSFER', 'ANALYSIS']
    expectedTypes.forEach(type => {
      expect(COGNITIVE_TYPE_LABELS[type]).toBeDefined()
      expect(typeof COGNITIVE_TYPE_LABELS[type]).toBe('string')
    })
  })

  it('übersetzt FACT korrekt', () => {
    expect(COGNITIVE_TYPE_LABELS['FACT']).toBe('Faktenwissen')
  })
})

describe('CONTENT_TYPE_LABELS – Deutsche Labels', () => {
  it('enthält alle Content-Typen', () => {
    const types = ['exercise', 'exercise_group', 'article', 'video', 'course'] as const
    types.forEach(type => {
      expect(CONTENT_TYPE_LABELS[type]).toBeDefined()
    })
  })
})

describe('DIFFICULTY_OPTIONS – Schwierigkeitsstufen', () => {
  it('enthält 5 Optionen (1-5)', () => {
    expect(DIFFICULTY_OPTIONS).toHaveLength(5)
  })

  it('hat aufsteigende Werte von 1 bis 5', () => {
    DIFFICULTY_OPTIONS.forEach((opt, idx) => {
      expect(opt.value).toBe(idx + 1)
    })
  })

  it('enthält Labels mit Schwierigkeitsgrad', () => {
    DIFFICULTY_OPTIONS.forEach(opt => {
      expect(typeof opt.label).toBe('string')
      expect(opt.label).toContain(String(opt.value))
    })
  })
})

describe('inputTypeLabel – Hilfsfunktion', () => {
  it('gibt deutschen Label für gültige InputType zurück', () => {
    expect(inputTypeLabel('MC')).toBe('Multiple Choice')
    expect(inputTypeLabel('FREE_INPUT')).toBe('Freie Eingabe')
    expect(inputTypeLabel('STEPS')).toBe('Schritt für Schritt')
    expect(inputTypeLabel('MATCHING')).toBe('Zuordnung')
    expect(inputTypeLabel('DRAW')).toBe('Zeichnung')
  })

  it('gibt "–" für null zurück', () => {
    expect(inputTypeLabel(null)).toBe('–')
  })

  it('gibt "–" für undefined zurück', () => {
    expect(inputTypeLabel(undefined)).toBe('–')
  })
})

describe('cognitiveTypeLabel – Hilfsfunktion', () => {
  it('gibt deutschen Label für gültige CognitiveType zurück', () => {
    expect(cognitiveTypeLabel('FACT')).toBe('Faktenwissen')
    expect(cognitiveTypeLabel('TRANSFER')).toBe('Transfer / Anwendung')
    expect(cognitiveTypeLabel('ANALYSIS')).toBe('Analyse / Problemlösen')
  })

  it('gibt "–" für null zurück', () => {
    expect(cognitiveTypeLabel(null)).toBe('–')
  })

  it('gibt "–" für undefined zurück', () => {
    expect(cognitiveTypeLabel(undefined)).toBe('–')
  })
})
