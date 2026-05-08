import type { OnboardingFormData } from '@/types'

const STEP_DATA = 0
const STEP_SUBJECTS = 1
const STEP_TIER = 2
const STEP_COACH = 3

// Prüft ob der Wizard zum nächsten Schritt weitergehen darf.
export function canProceed(step: number, data: OnboardingFormData): boolean {
  if (step === STEP_DATA) {
    return Boolean(data.firstName) && Boolean(data.lastName) && Boolean(data.classLevel) && Boolean(data.schoolType)
  }
  if (step === STEP_SUBJECTS) return data.subjects.length >= 1
  if (step === STEP_TIER) return Boolean(data.tier)
  if (step === STEP_COACH) return Boolean(data.coachId)
  return true
}
