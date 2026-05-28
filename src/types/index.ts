export type { UserRole, Role, ProtectedRouteProps } from './auth'
export type { Theme, ThemeColors } from './theme'
export { THEMES } from './theme'
export type {
  AttendanceStatus,
  SessionStatus,
  SubscriptionStatus,
  Student,
  StudentInput,
  StudentWithName,
  StudentSubscription,
  StudentCoach,
  StudentTaskProgress,
  StudentProgress,
  XpEvent,
  CoachingSession,
  SessionStudent,
} from './student'
export type { SchoolKind, Coach, LeadStatus, LeadGoal, Lead, LeadInput } from './lead'
export type {
  SchoolType,
  OnboardingFormData,
  StepProps,
  SummaryStepProps,
  CoachStepProps,
  StepIndicatorProps,
  TierPlan,
  TierInput,
  TierStepProps,
  OnboardingData,
} from './onboarding'
export type { IntakeStatus, IntakeSession, IntakeInput } from './intake'
export type { ParentReportStatus, ParentReport, ParentReportInput } from './reports'
export type {
  ScreeningStatus,
  ScreeningTest,
  ScreeningTestInput,
  ScreeningRating,
} from './screening'
export type {
  ContentType,
  CognitiveType,
  InputType,
  Subject,
  SkillCluster,
  Microskill,
  TaskAsset,
  Task,
  DiagnosticTask,
  DiagnosticTest,
  DiagnosticTaskInput,
  TaskCoachMetadata,
} from './content'

export type SupabaseResult<T> = {
  data: T | null
  error: string | null
}

export type AvatarProps = {
  initials: string
  attendance?: AttendanceStatus
  className?: string
}

export type BadgeVariant =
  | 'active' | 'done' | 'upcoming'
  | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'celebration'

export type BadgeProps = {
  variant: BadgeVariant
  className?: string
  children?: import('react').ReactNode
}

export type RunTask = {
  id: string
  skill_id: string
  skill_cluster: string
  question: string
  solution: string
  common_errors: string
  coach_hint: string
  estimated_minutes: number
}
