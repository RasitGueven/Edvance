import { describe, it, expect } from 'vitest'
import { canProceed } from './validation'
import type { OnboardingFormData } from '@/types'

// ── Fixture ───────────────────────────────────────────────────────────────────

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

// ── Step 0 – Schülerdaten ─────────────────────────────────────────────────────

describe('canProceed() step 0 – Schülerdaten', () => {
  it('returns true when all required fields are present', () => {
    expect(canProceed(0, makeData())).toBe(true)
  })

  it('returns false when firstName is missing', () => {
    expect(canProceed(0, makeData({ firstName: '' }))).toBe(false)
  })

  it('returns false when lastName is missing', () => {
    expect(canProceed(0, makeData({ lastName: '' }))).toBe(false)
  })

  it('returns false when classLevel is missing', () => {
    expect(canProceed(0, makeData({ classLevel: '' }))).toBe(false)
  })

  it('returns false when schoolType is missing', () => {
    expect(canProceed(0, makeData({ schoolType: '' }))).toBe(false)
  })

  it('allows optional email and schoolName to be empty', () => {
    expect(canProceed(0, makeData({ email: '', schoolName: '' }))).toBe(true)
  })
})

// ── Step 1 – Fächer ───────────────────────────────────────────────────────────

describe('canProceed() step 1 – Fächer', () => {
  it('returns true when at least one subject selected', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik'] }))).toBe(true)
  })

  it('returns true for multiple subjects', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik', 'Deutsch'] }))).toBe(true)
  })

  it('returns false when no subjects selected', () => {
    expect(canProceed(1, makeData({ subjects: [] }))).toBe(false)
  })
})

// ── Step 2 – Tarif ────────────────────────────────────────────────────────────

describe('canProceed() step 2 – Tarif', () => {
  it('returns true when tier is set', () => {
    expect(canProceed(2, makeData({ tier: 'premium' }))).toBe(true)
  })

  it('returns false when tier is empty string', () => {
    expect(canProceed(2, makeData({ tier: '' }))).toBe(false)
  })
})

// ── Step 3 – Coach ────────────────────────────────────────────────────────────

describe('canProceed() step 3 – Coach', () => {
  it('returns true when coachId is set', () => {
    expect(canProceed(3, makeData({ coachId: 'coach-42' }))).toBe(true)
  })

  it('returns false when coachId is empty', () => {
    expect(canProceed(3, makeData({ coachId: '' }))).toBe(false)
  })
})

// ── Unknown steps ─────────────────────────────────────────────────────────────

describe('canProceed() – unknown step', () => {
  it('returns true for step 4 (summary/confirmation step)', () => {
    expect(canProceed(4, makeData())).toBe(true)
  })

  it('returns true for any step > 3', () => {
    expect(canProceed(99, makeData())).toBe(true)
  })
})
