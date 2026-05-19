import { describe, it, expect } from 'vitest'
import { canProceed } from '@/components/edvance/onboarding/validation'
import type { OnboardingFormData } from '@/types'

function makeData(overrides: Partial<OnboardingFormData> = {}): OnboardingFormData {
  return {
    firstName: 'Lena',
    lastName: 'Fischer',
    email: 'lena@example.com',
    classLevel: '8',
    schoolName: 'Schiller-Gymnasium',
    schoolType: 'Gymnasium',
    subjects: ['Mathematik'],
    tier: 'standard',
    coachId: 'coach-1',
    ...overrides,
  }
}

describe('canProceed()', () => {
  // ── Step 0: Student data ────────────────────────────────────────────────────
  describe('step 0 (student data)', () => {
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
  })

  // ── Step 1: Subjects ────────────────────────────────────────────────────────
  describe('step 1 (subjects)', () => {
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

  // ── Step 2: Tier ────────────────────────────────────────────────────────────
  describe('step 2 (tier)', () => {
    it('returns true when tier is set', () => {
      expect(canProceed(2, makeData({ tier: 'premium' }))).toBe(true)
    })

    it('returns false when tier is empty', () => {
      expect(canProceed(2, makeData({ tier: '' }))).toBe(false)
    })
  })

  // ── Step 3: Coach ────────────────────────────────────────────────────────────
  describe('step 3 (coach)', () => {
    it('returns true when coachId is set', () => {
      expect(canProceed(3, makeData({ coachId: 'coach-abc' }))).toBe(true)
    })

    it('returns false when coachId is empty', () => {
      expect(canProceed(3, makeData({ coachId: '' }))).toBe(false)
    })
  })

  // ── Unknown steps ─────────────────────────────────────────────────────────
  describe('unknown step', () => {
    it('returns true for steps beyond the wizard', () => {
      expect(canProceed(99, makeData())).toBe(true)
    })
  })
})
