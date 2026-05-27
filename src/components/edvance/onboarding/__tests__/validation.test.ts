import { describe, it, expect } from 'vitest'
import { canProceed } from '@/components/edvance/onboarding/validation'
import type { OnboardingFormData } from '@/types'

function makeData(overrides: Partial<OnboardingFormData> = {}): OnboardingFormData {
  return {
    firstName: 'Lena',
    lastName: 'Fischer',
    email: 'lena@example.com',
    classLevel: '8',
    schoolName: 'Gymnasium Köln',
    schoolType: 'Gymnasium',
    subjects: ['Mathematik'],
    tier: 'premium',
    coachId: 'coach-1',
    ...overrides,
  }
}

// ── Step 0: Student data ─────────────────────────────────────────────────────

describe('canProceed – step 0 (student data)', () => {
  it('returns true when all required fields are set', () => {
    expect(canProceed(0, makeData())).toBe(true)
  })

  it('returns false when firstName is empty', () => {
    expect(canProceed(0, makeData({ firstName: '' }))).toBe(false)
  })

  it('returns false when lastName is empty', () => {
    expect(canProceed(0, makeData({ lastName: '' }))).toBe(false)
  })

  it('returns false when classLevel is empty', () => {
    expect(canProceed(0, makeData({ classLevel: '' }))).toBe(false)
  })

  it('returns false when schoolType is empty', () => {
    expect(canProceed(0, makeData({ schoolType: '' }))).toBe(false)
  })

  it('returns false when multiple required fields missing', () => {
    expect(canProceed(0, makeData({ firstName: '', lastName: '' }))).toBe(false)
  })
})

// ── Step 1: Subjects ─────────────────────────────────────────────────────────

describe('canProceed – step 1 (subjects)', () => {
  it('returns true when at least one subject is selected', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik'] }))).toBe(true)
  })

  it('returns true for multiple subjects', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik', 'Deutsch'] }))).toBe(true)
  })

  it('returns false when subjects is empty', () => {
    expect(canProceed(1, makeData({ subjects: [] }))).toBe(false)
  })
})

// ── Step 2: Tier ─────────────────────────────────────────────────────────────

describe('canProceed – step 2 (tier)', () => {
  it('returns true when tier is set', () => {
    expect(canProceed(2, makeData({ tier: 'standard' }))).toBe(true)
  })

  it('returns false when tier is empty', () => {
    expect(canProceed(2, makeData({ tier: '' }))).toBe(false)
  })
})

// ── Step 3: Coach ────────────────────────────────────────────────────────────

describe('canProceed – step 3 (coach)', () => {
  it('returns true when coachId is set', () => {
    expect(canProceed(3, makeData({ coachId: 'coach-42' }))).toBe(true)
  })

  it('returns false when coachId is empty', () => {
    expect(canProceed(3, makeData({ coachId: '' }))).toBe(false)
  })
})

// ── Other steps ──────────────────────────────────────────────────────────────

describe('canProceed – unknown step', () => {
  it('returns true for any step beyond 3', () => {
    expect(canProceed(4, makeData())).toBe(true)
    expect(canProceed(99, makeData())).toBe(true)
  })
})
