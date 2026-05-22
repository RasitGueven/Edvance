// Central type barrel for the Edvance project.
// Domain types live in ./domain.ts, content/task types in ./content.ts.
// This file keeps component-level, UI, and onboarding types plus re-exports
// everything for backward-compatible `import type { ... } from '@/types'`.

import type { ReactNode } from 'react'

// ── Re-exports ────────────────────────────────────────────────────────────────

export type {
  UserRole,
  Role,
  Coach,
  SchoolKind,
  LeadStatus,
  LeadGoal,
  Lead,
  LeadInput,
  Student,
  StudentInput,
  StudentWithName,
  AttendanceStatus,
  SessionStatus,
  CoachingSession,
  SessionStudent,
  IntakeStatus,
  IntakeSession,
  IntakeInput,
  TierPlan,
  TierInput,
  SubscriptionStatus,
  StudentSubscription,
  StudentCoach,
  ScreeningStatus,
  ScreeningTest,
  ScreeningTestInput,
  ScreeningRating,
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
  TaskCoachMetadata,
  DiagnosticTask,
  DiagnosticTest,
  RunTask,
} from './content'

// ── Theme ─────────────────────────────────────────────────────────────────────

export const THEMES = ['edvance', 'ocean', 'forest', 'sunset'] as const
export type Theme = (typeof THEMES)[number]
export type ThemeColors = { primary: string; light: string; dark: string }

// ── Onboarding-Wizard ─────────────────────────────────────────────────────────

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
  coaches: import('./domain').Coach[]
}

export type CoachStepProps = StepProps & {
  coaches: import('./domain').Coach[]
  loading?: boolean
}

export type StepIndicatorProps = {
  current: number
}

export type TierStepProps = {
  data: OnboardingFormData
  setData: (next: OnboardingFormData) => void
  tiers: import('./domain').TierPlan[]
  loading?: boolean
}

export type OnboardingData = {
  student_id: string
  grade: number
  school_type: 'GESAMTSCHULE' | 'GYMNASIUM' | 'REALSCHULE' | 'HAUPTSCHULE'
  subject: 'MATH' | 'GERMAN' | 'ENGLISH'
  goal: 'IMPROVE_GRADES' | 'CLOSE_GAPS' | 'EXAM_PREP' | 'GENERAL'
  known_weak_topics?: string[]
  last_grade_in_subject?: number
}

// ── Component Props ───────────────────────────────────────────────────────────

export type ProtectedRouteProps = {
  allowedRoles: import('./domain').UserRole[]
  children: ReactNode
}

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
