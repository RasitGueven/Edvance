import { describe, it, expect } from 'vitest'
import { canProceed } from '../validation'
import type { OnboardingFormData } from '@/types'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeData(overrides: Partial<OnboardingFormData> = {}): OnboardingFormData {
  return {
    firstName: 'Lena',
    lastName: 'Müller',
    email: 'lena@example.com',
    classLevel: '8',
    schoolName: 'Gymnasium Köln',
    schoolType: 'Gymnasium',
    subjects: ['Mathematik'],
    tier: 'basic',
    coachId: 'coach-1',
    ...overrides,
  }
}

// ── Step 0: StudentData ───────────────────────────────────────────────────────

describe('canProceed – step 0 (StudentData)', () => {
  it('returns true when all required fields are filled', () => {
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

  it('ignores optional fields (email, schoolName)', () => {
    expect(canProceed(0, makeData({ email: '', schoolName: '' }))).toBe(true)
  })
})

// ── Step 1: Subjects ──────────────────────────────────────────────────────────

describe('canProceed – step 1 (Subjects)', () => {
  it('returns true when at least 1 subject selected', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik'] }))).toBe(true)
  })

  it('returns true for multiple subjects', () => {
    expect(canProceed(1, makeData({ subjects: ['Mathematik', 'Englisch'] }))).toBe(true)
  })

  it('returns false when subjects list is empty', () => {
    expect(canProceed(1, makeData({ subjects: [] }))).toBe(false)
  })
})

// ── Step 2: Tier ─────────────────────────────────────────────────────────────

describe('canProceed – step 2 (Tier)', () => {
  it('returns true when tier is selected', () => {
    expect(canProceed(2, makeData({ tier: 'premium' }))).toBe(true)
  })

  it('returns false when tier is empty', () => {
    expect(canProceed(2, makeData({ tier: '' }))).toBe(false)
  })
})

// ── Step 3: Coach ─────────────────────────────────────────────────────────────

describe('canProceed – step 3 (Coach)', () => {
  it('returns true when coachId is set', () => {
    expect(canProceed(3, makeData({ coachId: 'coach-42' }))).toBe(true)
  })

  it('returns false when coachId is empty', () => {
    expect(canProceed(3, makeData({ coachId: '' }))).toBe(false)
  })
})

// ── Steps beyond defined range ────────────────────────────────────────────────

describe('canProceed – unknown steps', () => {
  it('returns true for step 4 (beyond defined range)', () => {
    expect(canProceed(4, makeData())).toBe(true)
  })

  it('returns true for step 99', () => {
    expect(canProceed(99, makeData())).toBe(true)
  })
})
