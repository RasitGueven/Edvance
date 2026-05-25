import { describe, it, expect } from 'vitest'
import { canProceed } from '../validation'
import type { OnboardingFormData } from '@/types'

// ── Fixture ──────────────────────────────────────────────────────────────────

function fullData(overrides: Partial<OnboardingFormData> = {}): OnboardingFormData {
  return {
    firstName: 'Lena',
    lastName: 'Fischer',
    email: 'lena@example.com',
    classLevel: '8',
    schoolName: 'Gymnasium Köln',
    schoolType: 'Gymnasium',
    subjects: ['Mathematik'],
    tier: 'standard',
    coachId: 'coach-42',
    ...overrides,
  }
}

// ── Step 0 – Schülerdaten ────────────────────────────────────────────────────

describe('canProceed() — Step 0 (Schülerdaten)', () => {
  it('returns true when all required fields are present', () => {
    expect(canProceed(0, fullData())).toBe(true)
  })

  it('returns false when firstName is missing', () => {
    expect(canProceed(0, fullData({ firstName: '' }))).toBe(false)
  })

  it('returns false when lastName is missing', () => {
    expect(canProceed(0, fullData({ lastName: '' }))).toBe(false)
  })

  it('returns false when classLevel is missing', () => {
    expect(canProceed(0, fullData({ classLevel: '' }))).toBe(false)
  })

  it('returns false when schoolType is missing', () => {
    expect(canProceed(0, fullData({ schoolType: '' }))).toBe(false)
  })

  it('returns true when optional fields (email, schoolName) are empty', () => {
    expect(canProceed(0, fullData({ email: '', schoolName: '' }))).toBe(true)
  })

  it('returns false when all required fields are empty', () => {
    expect(
      canProceed(0, fullData({ firstName: '', lastName: '', classLevel: '', schoolType: '' })),
    ).toBe(false)
  })
})

// ── Step 1 – Fächer ──────────────────────────────────────────────────────────

describe('canProceed() — Step 1 (Fächer)', () => {
  it('returns true when at least one subject is selected', () => {
    expect(canProceed(1, fullData({ subjects: ['Mathematik'] }))).toBe(true)
  })

  it('returns true when multiple subjects are selected', () => {
    expect(canProceed(1, fullData({ subjects: ['Mathematik', 'Deutsch'] }))).toBe(true)
  })

  it('returns false when no subjects are selected', () => {
    expect(canProceed(1, fullData({ subjects: [] }))).toBe(false)
  })
})

// ── Step 2 – Tarif ───────────────────────────────────────────────────────────

describe('canProceed() — Step 2 (Tarif)', () => {
  it('returns true when a tier is chosen', () => {
    expect(canProceed(2, fullData({ tier: 'premium' }))).toBe(true)
  })

  it('returns true for any non-empty tier string', () => {
    expect(canProceed(2, fullData({ tier: 'basic' }))).toBe(true)
  })

  it('returns false when no tier is chosen', () => {
    expect(canProceed(2, fullData({ tier: '' }))).toBe(false)
  })
})

// ── Step 3 – Coach ───────────────────────────────────────────────────────────

describe('canProceed() — Step 3 (Coach)', () => {
  it('returns true when a coachId is set', () => {
    expect(canProceed(3, fullData({ coachId: 'coach-1' }))).toBe(true)
  })

  it('returns false when coachId is empty', () => {
    expect(canProceed(3, fullData({ coachId: '' }))).toBe(false)
  })

  it('returns true for any non-empty coachId', () => {
    expect(canProceed(3, fullData({ coachId: 'x' }))).toBe(true)
  })
})

// ── Steps beyond wizard ───────────────────────────────────────────────────────

describe('canProceed() — beyond wizard steps', () => {
  it('returns true for step 4 (summary step — no validation needed)', () => {
    expect(canProceed(4, fullData({ coachId: '' }))).toBe(true)
  })

  it('returns true for any unknown step number', () => {
    expect(canProceed(99, fullData({ firstName: '' }))).toBe(true)
  })

  it('returns true for a negative step number', () => {
    expect(canProceed(-1, fullData({ firstName: '' }))).toBe(true)
  })
})
