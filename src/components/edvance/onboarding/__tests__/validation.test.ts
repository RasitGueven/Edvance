import { describe, it, expect } from 'vitest'
import { canProceed } from '@/components/edvance/onboarding/validation'
import type { OnboardingFormData } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const emptyForm = (): OnboardingFormData => ({
  firstName: '',
  lastName: '',
  email: '',
  classLevel: '',
  schoolName: '',
  schoolType: '',
  subjects: [],
  tier: '',
  coachId: '',
})

const filledForm = (): OnboardingFormData => ({
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max@example.com',
  classLevel: '8',
  schoolName: 'Gymnasium Köln',
  schoolType: 'Gymnasium',
  subjects: ['Mathematik'],
  tier: 'premium',
  coachId: 'coach-42',
})

// ── Step 0: Student data ───────────────────────────────────────────────────────

describe('canProceed – step 0 (student data)', () => {
  it('returns false when all fields empty', () => {
    expect(canProceed(0, emptyForm())).toBe(false)
  })

  it('returns true when firstName, lastName, classLevel and schoolType filled', () => {
    expect(canProceed(0, filledForm())).toBe(true)
  })

  it('returns false when firstName is missing', () => {
    const form = { ...filledForm(), firstName: '' }
    expect(canProceed(0, form)).toBe(false)
  })

  it('returns false when lastName is missing', () => {
    const form = { ...filledForm(), lastName: '' }
    expect(canProceed(0, form)).toBe(false)
  })

  it('returns false when classLevel is missing', () => {
    const form = { ...filledForm(), classLevel: '' }
    expect(canProceed(0, form)).toBe(false)
  })

  it('returns false when schoolType is missing', () => {
    const form = { ...filledForm(), schoolType: '' }
    expect(canProceed(0, form)).toBe(false)
  })

  it('does not require email or schoolName', () => {
    const form = { ...filledForm(), email: '', schoolName: '' }
    expect(canProceed(0, form)).toBe(true)
  })
})

// ── Step 1: Subjects ──────────────────────────────────────────────────────────

describe('canProceed – step 1 (subjects)', () => {
  it('returns false when no subjects selected', () => {
    expect(canProceed(1, emptyForm())).toBe(false)
  })

  it('returns true when at least one subject selected', () => {
    const form = { ...emptyForm(), subjects: ['Mathematik'] }
    expect(canProceed(1, form)).toBe(true)
  })

  it('returns true with multiple subjects', () => {
    const form = { ...emptyForm(), subjects: ['Mathematik', 'Deutsch', 'Englisch'] }
    expect(canProceed(1, form)).toBe(true)
  })
})

// ── Step 2: Tier ──────────────────────────────────────────────────────────────

describe('canProceed – step 2 (tier)', () => {
  it('returns false when no tier selected', () => {
    expect(canProceed(2, emptyForm())).toBe(false)
  })

  it('returns true when tier is set', () => {
    const form = { ...emptyForm(), tier: 'standard' }
    expect(canProceed(2, form)).toBe(true)
  })
})

// ── Step 3: Coach ─────────────────────────────────────────────────────────────

describe('canProceed – step 3 (coach)', () => {
  it('returns false when no coach selected', () => {
    expect(canProceed(3, emptyForm())).toBe(false)
  })

  it('returns true when coachId is set', () => {
    const form = { ...emptyForm(), coachId: 'coach-1' }
    expect(canProceed(3, form)).toBe(true)
  })
})

// ── Unknown steps ─────────────────────────────────────────────────────────────

describe('canProceed – unknown step', () => {
  it('returns true for any step beyond 3 (summary/unknown)', () => {
    expect(canProceed(4, emptyForm())).toBe(true)
    expect(canProceed(99, emptyForm())).toBe(true)
  })
})
