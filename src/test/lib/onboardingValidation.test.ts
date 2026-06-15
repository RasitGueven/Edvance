import { describe, it, expect } from 'vitest'
import { canProceed } from '@/components/edvance/onboarding/validation'
import type { OnboardingFormData } from '@/types'

function makeData(overrides: Partial<OnboardingFormData> = {}): OnboardingFormData {
  return {
    firstName: 'Max',
    lastName: 'Muster',
    email: 'max@test.de',
    classLevel: '8',
    schoolName: 'Mustergymnasium',
    schoolType: 'Gymnasium',
    subjects: ['Mathematik'],
    tier: 'standard',
    coachId: 'coach-1',
    ...overrides,
  }
}

describe('canProceed()', () => {
  // ── Schritt 0: Stammdaten ───────────────────────────────────────────────────
  describe('Schritt 0 (Stammdaten)', () => {
    it('gibt true zurück wenn alle Pflichtfelder gefüllt sind', () => {
      expect(canProceed(0, makeData())).toBe(true)
    })

    it('gibt false zurück wenn firstName fehlt', () => {
      expect(canProceed(0, makeData({ firstName: '' }))).toBe(false)
    })

    it('gibt false zurück wenn lastName fehlt', () => {
      expect(canProceed(0, makeData({ lastName: '' }))).toBe(false)
    })

    it('gibt false zurück wenn classLevel fehlt', () => {
      expect(canProceed(0, makeData({ classLevel: '' }))).toBe(false)
    })

    it('gibt false zurück wenn schoolType fehlt', () => {
      expect(canProceed(0, makeData({ schoolType: '' }))).toBe(false)
    })
  })

  // ── Schritt 1: Fächer ───────────────────────────────────────────────────────
  describe('Schritt 1 (Fächer)', () => {
    it('gibt true zurück wenn mindestens 1 Fach ausgewählt ist', () => {
      expect(canProceed(1, makeData({ subjects: ['Mathematik'] }))).toBe(true)
    })

    it('gibt true zurück wenn mehrere Fächer ausgewählt sind', () => {
      expect(canProceed(1, makeData({ subjects: ['Mathematik', 'Englisch'] }))).toBe(true)
    })

    it('gibt false zurück wenn keine Fächer ausgewählt sind', () => {
      expect(canProceed(1, makeData({ subjects: [] }))).toBe(false)
    })
  })

  // ── Schritt 2: Tarif ─────────────────────────────────────────────────────────
  describe('Schritt 2 (Tarif)', () => {
    it('gibt true zurück wenn Tarif gesetzt ist', () => {
      expect(canProceed(2, makeData({ tier: 'premium' }))).toBe(true)
    })

    it('gibt false zurück wenn kein Tarif gesetzt ist', () => {
      expect(canProceed(2, makeData({ tier: '' }))).toBe(false)
    })
  })

  // ── Schritt 3: Coach ─────────────────────────────────────────────────────────
  describe('Schritt 3 (Coach)', () => {
    it('gibt true zurück wenn ein Coach ausgewählt ist', () => {
      expect(canProceed(3, makeData({ coachId: 'coach-42' }))).toBe(true)
    })

    it('gibt false zurück wenn kein Coach ausgewählt ist', () => {
      expect(canProceed(3, makeData({ coachId: '' }))).toBe(false)
    })
  })

  // ── Unbekannte Schritte ───────────────────────────────────────────────────────
  describe('Unbekannte Schritte', () => {
    it('gibt true zurück für Schritt > 3', () => {
      expect(canProceed(4, makeData())).toBe(true)
      expect(canProceed(99, makeData())).toBe(true)
    })
  })
})
