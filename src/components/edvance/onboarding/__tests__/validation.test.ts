import { describe, it, expect } from 'vitest'
import { canProceed } from '@/components/edvance/onboarding/validation'
import type { OnboardingFormData } from '@/types'

function makeData(overrides: Partial<OnboardingFormData> = {}): OnboardingFormData {
  return {
    firstName: '',
    lastName: '',
    email: '',
    classLevel: '',
    schoolName: '',
    schoolType: '',
    subjects: [],
    tier: '',
    coachId: '',
    ...overrides,
  }
}

describe('canProceed – Schritt 0: Persönliche Daten', () => {
  it('gibt false zurück wenn alle Felder leer sind', () => {
    expect(canProceed(0, makeData())).toBe(false)
  })

  it('gibt false zurück wenn nur firstName fehlt', () => {
    const data = makeData({ lastName: 'Müller', classLevel: '8', schoolType: 'Gymnasium' })
    expect(canProceed(0, data)).toBe(false)
  })

  it('gibt false zurück wenn nur lastName fehlt', () => {
    const data = makeData({ firstName: 'Max', classLevel: '8', schoolType: 'Gymnasium' })
    expect(canProceed(0, data)).toBe(false)
  })

  it('gibt false zurück wenn nur classLevel fehlt', () => {
    const data = makeData({ firstName: 'Max', lastName: 'Müller', schoolType: 'Gymnasium' })
    expect(canProceed(0, data)).toBe(false)
  })

  it('gibt false zurück wenn nur schoolType fehlt', () => {
    const data = makeData({ firstName: 'Max', lastName: 'Müller', classLevel: '8' })
    expect(canProceed(0, data)).toBe(false)
  })

  it('gibt true zurück wenn alle Pflichtfelder gefüllt sind', () => {
    const data = makeData({
      firstName: 'Max',
      lastName: 'Müller',
      classLevel: '8',
      schoolType: 'Gymnasium',
    })
    expect(canProceed(0, data)).toBe(true)
  })

  it('ignoriert optionale Felder (email, schoolName)', () => {
    const data = makeData({
      firstName: 'Anna',
      lastName: 'Schulz',
      classLevel: '10',
      schoolType: 'Gesamtschule',
      email: '',
      schoolName: '',
    })
    expect(canProceed(0, data)).toBe(true)
  })

  it('funktioniert für alle Schultypen', () => {
    const schoolTypes = ['Gymnasium', 'Gesamtschule', 'Realschule', 'Hauptschule'] as const
    schoolTypes.forEach(schoolType => {
      const data = makeData({ firstName: 'Test', lastName: 'User', classLevel: '7', schoolType })
      expect(canProceed(0, data)).toBe(true)
    })
  })
})

describe('canProceed – Schritt 1: Fächer', () => {
  it('gibt false zurück wenn keine Fächer gewählt', () => {
    expect(canProceed(1, makeData({ subjects: [] }))).toBe(false)
  })

  it('gibt true zurück wenn mind. 1 Fach gewählt', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik'] }))).toBe(true)
  })

  it('gibt true zurück für mehrere Fächer', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik', 'Deutsch', 'Englisch'] }))).toBe(true)
  })
})

describe('canProceed – Schritt 2: Stufe/Tier', () => {
  it('gibt false zurück wenn kein Tier gewählt', () => {
    expect(canProceed(2, makeData({ tier: '' }))).toBe(false)
  })

  it('gibt true zurück wenn Tier gewählt', () => {
    expect(canProceed(2, makeData({ tier: 'premium' }))).toBe(true)
    expect(canProceed(2, makeData({ tier: 'basic' }))).toBe(true)
  })
})

describe('canProceed – Schritt 3: Coach', () => {
  it('gibt false zurück wenn kein Coach gewählt', () => {
    expect(canProceed(3, makeData({ coachId: '' }))).toBe(false)
  })

  it('gibt true zurück wenn Coach gewählt', () => {
    expect(canProceed(3, makeData({ coachId: 'coach-uuid-123' }))).toBe(true)
  })
})

describe('canProceed – Unbekannte Schritte', () => {
  it('gibt true zurück für Schritt 4 (unbekannter Schritt)', () => {
    expect(canProceed(4, makeData())).toBe(true)
  })

  it('gibt true zurück für negative Schritte', () => {
    expect(canProceed(-1, makeData())).toBe(true)
  })

  it('gibt true zurück für sehr hohe Schritte', () => {
    expect(canProceed(99, makeData())).toBe(true)
  })
})
