import { describe, it, expect } from 'vitest'
import { canProceed } from './validation'
import type { OnboardingFormData } from '@/types'

function makeFormData(overrides: Partial<OnboardingFormData> = {}): OnboardingFormData {
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

describe('canProceed – step 0 (Schülerdaten)', () => {
  it('returns false when all fields are empty', () => {
    expect(canProceed(0, makeFormData())).toBe(false)
  })

  it('returns false when only firstName is set', () => {
    expect(canProceed(0, makeFormData({ firstName: 'Lena' }))).toBe(false)
  })

  it('returns false when lastName is missing', () => {
    expect(
      canProceed(0, makeFormData({ firstName: 'Lena', classLevel: '8', schoolType: 'Gymnasium' })),
    ).toBe(false)
  })

  it('returns false when classLevel is missing', () => {
    expect(
      canProceed(
        0,
        makeFormData({ firstName: 'Lena', lastName: 'Fischer', schoolType: 'Gymnasium' }),
      ),
    ).toBe(false)
  })

  it('returns false when schoolType is missing', () => {
    expect(
      canProceed(
        0,
        makeFormData({ firstName: 'Lena', lastName: 'Fischer', classLevel: '8' }),
      ),
    ).toBe(false)
  })

  it('returns true when firstName, lastName, classLevel and schoolType are all set', () => {
    expect(
      canProceed(
        0,
        makeFormData({
          firstName: 'Lena',
          lastName: 'Fischer',
          classLevel: '8',
          schoolType: 'Gymnasium',
        }),
      ),
    ).toBe(true)
  })

  it('returns true for all supported school types', () => {
    const schoolTypes = ['Gymnasium', 'Gesamtschule', 'Realschule', 'Hauptschule'] as const
    for (const schoolType of schoolTypes) {
      expect(
        canProceed(
          0,
          makeFormData({
            firstName: 'A',
            lastName: 'B',
            classLevel: '7',
            schoolType,
          }),
        ),
      ).toBe(true)
    }
  })
})

describe('canProceed – step 1 (Fächer)', () => {
  it('returns false for empty subjects array', () => {
    expect(canProceed(1, makeFormData({ subjects: [] }))).toBe(false)
  })

  it('returns true for one subject selected', () => {
    expect(canProceed(1, makeFormData({ subjects: ['Mathematik'] }))).toBe(true)
  })

  it('returns true for multiple subjects selected', () => {
    expect(canProceed(1, makeFormData({ subjects: ['Mathematik', 'Deutsch'] }))).toBe(true)
  })
})

describe('canProceed – step 2 (Tarif)', () => {
  it('returns false when tier is empty string', () => {
    expect(canProceed(2, makeFormData({ tier: '' }))).toBe(false)
  })

  it('returns true for "Basic"', () => {
    expect(canProceed(2, makeFormData({ tier: 'Basic' }))).toBe(true)
  })

  it('returns true for "Standard"', () => {
    expect(canProceed(2, makeFormData({ tier: 'Standard' }))).toBe(true)
  })

  it('returns true for "Premium"', () => {
    expect(canProceed(2, makeFormData({ tier: 'Premium' }))).toBe(true)
  })
})

describe('canProceed – step 3 (Coach)', () => {
  it('returns false when coachId is empty', () => {
    expect(canProceed(3, makeFormData({ coachId: '' }))).toBe(false)
  })

  it('returns true when coachId is set', () => {
    expect(canProceed(3, makeFormData({ coachId: 'coach-abc-123' }))).toBe(true)
  })
})

describe('canProceed – other steps', () => {
  it('returns true for steps beyond the wizard (summary/confirmation step)', () => {
    expect(canProceed(4, makeFormData())).toBe(true)
    expect(canProceed(99, makeFormData())).toBe(true)
  })

  it('returns true for negative step numbers', () => {
    expect(canProceed(-1, makeFormData())).toBe(true)
  })
})
