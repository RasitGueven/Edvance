import { describe, it, expect } from 'vitest'
import { canProceed } from '../../components/edvance/onboarding/validation'
import type { OnboardingFormData } from '@/types'

function baseData(overrides: Partial<OnboardingFormData> = {}): OnboardingFormData {
  return {
    firstName: 'Anna',
    lastName: 'Schmidt',
    email: 'anna@example.com',
    classLevel: '8',
    schoolName: 'Gymnasium Köln',
    schoolType: 'Gymnasium',
    subjects: ['Mathematik'],
    tier: 'basic',
    coachId: 'coach-1',
    ...overrides,
  }
}

// ── Step 0 – Student data ───────────────────────────────────────

describe('canProceed – step 0 (student data)', () => {
  it('returns true when all required fields are filled', () => {
    expect(canProceed(0, baseData())).toBe(true)
  })

  it('returns false when firstName is empty', () => {
    expect(canProceed(0, baseData({ firstName: '' }))).toBe(false)
  })

  it('returns false when lastName is empty', () => {
    expect(canProceed(0, baseData({ lastName: '' }))).toBe(false)
  })

  it('returns false when classLevel is empty', () => {
    expect(canProceed(0, baseData({ classLevel: '' }))).toBe(false)
  })

  it('returns false when schoolType is empty', () => {
    expect(canProceed(0, baseData({ schoolType: '' }))).toBe(false)
  })
})

// ── Step 1 – Subjects ───────────────────────────────────────────

describe('canProceed – step 1 (subjects)', () => {
  it('returns true when at least one subject is selected', () => {
    expect(canProceed(1, baseData({ subjects: ['Mathematik'] }))).toBe(true)
  })

  it('returns true when multiple subjects are selected', () => {
    expect(canProceed(1, baseData({ subjects: ['Mathematik', 'Deutsch'] }))).toBe(true)
  })

  it('returns false when no subjects are selected', () => {
    expect(canProceed(1, baseData({ subjects: [] }))).toBe(false)
  })
})

// ── Step 2 – Tier ───────────────────────────────────────────────

describe('canProceed – step 2 (tier)', () => {
  it('returns true when a tier is selected', () => {
    expect(canProceed(2, baseData({ tier: 'premium' }))).toBe(true)
  })

  it('returns false when tier is empty', () => {
    expect(canProceed(2, baseData({ tier: '' }))).toBe(false)
  })
})

// ── Step 3 – Coach ───────────────────────────────────────────────

describe('canProceed – step 3 (coach)', () => {
  it('returns true when a coach is selected', () => {
    expect(canProceed(3, baseData({ coachId: 'coach-42' }))).toBe(true)
  })

  it('returns false when no coach is selected', () => {
    expect(canProceed(3, baseData({ coachId: '' }))).toBe(false)
  })
})

// ── Unknown step ─────────────────────────────────────────────────

describe('canProceed – unknown step', () => {
  it('returns true for any unknown step index', () => {
    expect(canProceed(99, baseData())).toBe(true)
  })
})
