import { describe, it, expect } from 'vitest'
import { canProceed } from '@/components/edvance/onboarding/validation'
import type { OnboardingFormData } from '@/types'

const base: OnboardingFormData = {
  firstName: 'Lena',
  lastName: 'Fischer',
  email: 'lena@example.com',
  classLevel: '8',
  schoolName: 'Humboldt-Gymnasium',
  schoolType: 'Gymnasium',
  subjects: ['Mathematik'],
  tier: 'basic',
  coachId: 'coach-1',
}

describe('canProceed – step 0 (student data)', () => {
  it('returns true when all required fields are set', () => {
    expect(canProceed(0, base)).toBe(true)
  })

  it('returns false when firstName is empty', () => {
    expect(canProceed(0, { ...base, firstName: '' })).toBe(false)
  })

  it('returns false when lastName is empty', () => {
    expect(canProceed(0, { ...base, lastName: '' })).toBe(false)
  })

  it('returns false when classLevel is empty', () => {
    expect(canProceed(0, { ...base, classLevel: '' })).toBe(false)
  })

  it('returns false when schoolType is empty', () => {
    expect(canProceed(0, { ...base, schoolType: '' })).toBe(false)
  })
})

describe('canProceed – step 1 (subjects)', () => {
  it('returns true with at least one subject', () => {
    expect(canProceed(1, base)).toBe(true)
  })

  it('returns false when subjects is empty', () => {
    expect(canProceed(1, { ...base, subjects: [] })).toBe(false)
  })

  it('returns true with multiple subjects', () => {
    expect(canProceed(1, { ...base, subjects: ['Mathematik', 'Deutsch'] })).toBe(true)
  })
})

describe('canProceed – step 2 (tier)', () => {
  it('returns true when tier is set', () => {
    expect(canProceed(2, base)).toBe(true)
  })

  it('returns false when tier is empty string', () => {
    expect(canProceed(2, { ...base, tier: '' })).toBe(false)
  })

  it('returns false when tier is undefined', () => {
    expect(canProceed(2, { ...base, tier: undefined as unknown as string })).toBe(false)
  })
})

describe('canProceed – step 3 (coach)', () => {
  it('returns true when coachId is set', () => {
    expect(canProceed(3, base)).toBe(true)
  })

  it('returns false when coachId is empty', () => {
    expect(canProceed(3, { ...base, coachId: '' })).toBe(false)
  })
})

describe('canProceed – unknown step', () => {
  it('returns true for any step beyond 3', () => {
    expect(canProceed(99, base)).toBe(true)
  })
})
