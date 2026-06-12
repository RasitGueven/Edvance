import { describe, it, expect } from 'vitest'
import {
  CONTENT_TYPE_LABELS,
  INPUT_TYPE_LABELS,
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
  inputTypeLabel,
  cognitiveTypeLabel,
} from '../taskLabels'
import type { ContentType, InputType, CognitiveType } from '@/types'

describe('CONTENT_TYPE_LABELS', () => {
  const types: ContentType[] = ['exercise', 'exercise_group', 'article', 'video', 'course']

  it('has a German label for every ContentType', () => {
    for (const type of types) {
      expect(CONTENT_TYPE_LABELS[type]).toBeTruthy()
    }
  })

  it('returns German labels', () => {
    expect(CONTENT_TYPE_LABELS.exercise).toBe('Übung')
    expect(CONTENT_TYPE_LABELS.article).toBe('Artikel')
    expect(CONTENT_TYPE_LABELS.video).toBe('Video')
    expect(CONTENT_TYPE_LABELS.course).toBe('Kurs')
  })
})

describe('INPUT_TYPE_LABELS', () => {
  const types: InputType[] = ['MC', 'FREE_INPUT', 'STEPS', 'MATCHING', 'DRAW']

  it('has a German label for every InputType', () => {
    for (const type of types) {
      expect(INPUT_TYPE_LABELS[type]).toBeTruthy()
    }
  })

  it('returns correct German labels', () => {
    expect(INPUT_TYPE_LABELS.MC).toBe('Multiple Choice')
    expect(INPUT_TYPE_LABELS.FREE_INPUT).toBe('Freie Eingabe')
    expect(INPUT_TYPE_LABELS.STEPS).toBe('Schritt für Schritt')
    expect(INPUT_TYPE_LABELS.MATCHING).toBe('Zuordnung')
    expect(INPUT_TYPE_LABELS.DRAW).toBe('Zeichnung')
  })
})

describe('COGNITIVE_TYPE_LABELS', () => {
  const types: CognitiveType[] = ['FACT', 'TRANSFER', 'ANALYSIS']

  it('has a label for every CognitiveType', () => {
    for (const type of types) {
      expect(COGNITIVE_TYPE_LABELS[type]).toBeTruthy()
    }
  })

  it('returns correct German labels', () => {
    expect(COGNITIVE_TYPE_LABELS.FACT).toBe('Faktenwissen')
    expect(COGNITIVE_TYPE_LABELS.TRANSFER).toBe('Transfer / Anwendung')
    expect(COGNITIVE_TYPE_LABELS.ANALYSIS).toBe('Analyse / Problemlösen')
  })
})

describe('DIFFICULTY_OPTIONS', () => {
  it('has 5 difficulty levels (1-5)', () => {
    expect(DIFFICULTY_OPTIONS).toHaveLength(5)
  })

  it('values are 1 through 5', () => {
    expect(DIFFICULTY_OPTIONS.map(o => o.value)).toEqual([1, 2, 3, 4, 5])
  })

  it('each option has a non-empty label', () => {
    for (const option of DIFFICULTY_OPTIONS) {
      expect(option.label).toBeTruthy()
      expect(option.label).toContain(String(option.value))
    }
  })
})

describe('inputTypeLabel', () => {
  it('returns the label for a known InputType', () => {
    expect(inputTypeLabel('MC')).toBe('Multiple Choice')
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
  it('returns the label for a known CognitiveType', () => {
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
