import type { Coach } from './coach'

export type SchoolType = 'Gymnasium' | 'Gesamtschule' | 'Realschule' | 'Hauptschule' | ''

export type OnboardingFormData = {
  firstName: string
  lastName: string
  email: string
  classLevel: string
  schoolName: string
  schoolType: SchoolType
  subjects: string[]
  tier: string
  coachId: string
}

export type StepProps = {
  data: OnboardingFormData
  setData: (next: OnboardingFormData) => void
}

export type SummaryStepProps = {
  data: OnboardingFormData
  coaches: Coach[]
}

export type CoachStepProps = StepProps & {
  coaches: Coach[]
  loading?: boolean
}

export type StepIndicatorProps = {
  current: number
}

export type TierPlan = {
  id: string
  name: string
  price_cents: number
  features: string[]
  sort_order: number
  active: boolean
}

export type TierInput = {
  name: string
  price_cents: number
  features: string[]
  sort_order?: number
  active?: boolean
}

export type TierStepProps = {
  data: OnboardingFormData
  setData: (next: OnboardingFormData) => void
  tiers: TierPlan[]
  loading?: boolean
}
