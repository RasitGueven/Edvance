// Central re-export barrel for all Edvance TypeScript types.
// Domain types are split into sub-files for maintainability.

export type { UserRole, Role, ProtectedRouteProps } from './auth'

export type {
  AttendanceStatus,
  SessionStatus,
  SchoolKind,
  Coach,
  LeadStatus,
  LeadGoal,
  Lead,
  LeadInput,
  Student,
  StudentInput,
  StudentWithName,
  IntakeStatus,
  IntakeSession,
  IntakeInput,
  TierPlan,
  TierInput,
  SubscriptionStatus,
  StudentSubscription,
  StudentCoach,
  ScreeningStatus,
  CoachingSession,
  SessionStudent,
  StudentTaskProgress,
  StudentProgress,
  XpEvent,
  ParentReportStatus,
  ParentReport,
  ParentReportInput,
} from './domain'

export type {
  ContentType,
  CognitiveType,
  InputType,
  Subject,
  SkillCluster,
  Microskill,
  TaskAsset,
  Task,
  DiagnosticTaskInput,
  DiagnosticTask,
  DiagnosticTest,
  TaskCoachMetadata,
} from './content'

export type {
  ScreeningTest,
  ScreeningTestInput,
  ScreeningRating,
  RunTask,
  OnboardingData,
} from './screening'

// ── Theme ─────────────────────────────────────────────────────────────────────

export const THEMES = ['edvance', 'ocean', 'forest', 'sunset'] as const
export type Theme = (typeof THEMES)[number]
export type ThemeColors = { primary: string; light: string; dark: string }

// ── Onboarding-Wizard Props ───────────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { TierPlan, Coach } from './domain'
import type { OnboardingData } from './screening'

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

export type TierStepProps = {
  data: OnboardingFormData
  setData: (next: OnboardingFormData) => void
  tiers: TierPlan[]
  loading?: boolean
}

// ── Legacy UI Props ───────────────────────────────────────────────────────────

export type AvatarProps = {
  initials: string
  attendance?: import('./domain').AttendanceStatus
  className?: string
}

export type BadgeVariant =
  | 'active' | 'done' | 'upcoming'
  | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'celebration'

export type BadgeProps = {
  variant: BadgeVariant
  className?: string
  children?: ReactNode
}

// ── Supabase-Wrapper-Result ───────────────────────────────────────────────────

export type SupabaseResult<T> = {
  data: T | null
  error: string | null
}
