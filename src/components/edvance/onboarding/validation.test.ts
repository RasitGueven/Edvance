import { describe, it, expect } from 'vitest'
import { canProceed } from './validation'
import type { OnboardingFormData } from '@/types'

function makeData(overrides: Partial<OnboardingFormData> = {}): OnboardingFormData {
  return {
    firstName: 'Anna',
    lastName: 'Schmidt',
    classLevel: '8',
    schoolType: 'Gymnasium',
    subjects: ['Mathematik'],
    tier: 'standard',
    coachId: 'coach-42',
    ...overrides,
  } as OnboardingFormData
}

describe('canProceed – Schritt 0 (Stammdaten)', () => {
  it('gibt true zurück wenn alle Pflichtfelder ausgefüllt', () => {
    expect(canProceed(0, makeData())).toBe(true)
  })

  it('gibt false wenn Vorname fehlt', () => {
    expect(canProceed(0, makeData({ firstName: '' }))).toBe(false)
  })

  it('gibt false wenn Nachname fehlt', () => {
    expect(canProceed(0, makeData({ lastName: '' }))).toBe(false)
  })

  it('gibt false wenn Klassenstufe fehlt', () => {
    expect(canProceed(0, makeData({ classLevel: '' }))).toBe(false)
  })

  it('gibt false wenn Schulart fehlt', () => {
    expect(canProceed(0, makeData({ schoolType: '' }))).toBe(false)
  })
})

describe('canProceed – Schritt 1 (Fächer)', () => {
  it('gibt true zurück bei mindestens einem Fach', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik'] }))).toBe(true)
  })

  it('gibt true bei mehreren Fächern', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik', 'Deutsch'] }))).toBe(true)
  })

  it('gibt false wenn keine Fächer ausgewählt', () => {
    expect(canProceed(1, makeData({ subjects: [] }))).toBe(false)
  })
})

describe('canProceed – Schritt 2 (Paket)', () => {
  it('gibt true zurück wenn Paket ausgewählt', () => {
    expect(canProceed(2, makeData({ tier: 'premium' }))).toBe(true)
  })

  it('gibt false wenn kein Paket ausgewählt', () => {
    expect(canProceed(2, makeData({ tier: '' }))).toBe(false)
  })
})

describe('canProceed – Schritt 3 (Coach)', () => {
  it('gibt true zurück wenn Coach ausgewählt', () => {
    expect(canProceed(3, makeData({ coachId: 'coach-1' }))).toBe(true)
  })

  it('gibt false wenn kein Coach ausgewählt', () => {
    expect(canProceed(3, makeData({ coachId: '' }))).toBe(false)
  })
})

describe('canProceed – unbekannte Schritte', () => {
  it('gibt true für unbekannte Schritt-Nummer zurück', () => {
    expect(canProceed(99, makeData())).toBe(true)
    expect(canProceed(-1, makeData())).toBe(true)
  })
})
