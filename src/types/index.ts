// Zentrale TypeScript-Typen für das gesamte Edvance-Projekt.
// Re-exports aus domänenspezifischen Typ-Dateien.

export type { UserRole, Role } from './auth'

export type { AttendanceStatus, SessionStatus, Student, StudentInput, StudentWithName, RunTask, DiagnosticTaskInput, IntakeStatus, IntakeSession, IntakeInput, SubscriptionStatus, StudentSubscription, StudentCoach, StudentTaskProgress, StudentProgress, XpEvent, OnboardingData, ScreeningStatus, ScreeningTest, ScreeningTestInput, ScreeningRating } from './student'

export type { SchoolKind, LeadStatus, LeadGoal, Lead, LeadInput } from './lead'

export type { Coach, CoachingSession, SessionStudent } from './coach'

export type { ParentReportStatus, ParentReport, ParentReportInput } from './parent'

export { THEMES } from './ui'
export type { Theme, ThemeColors, ProtectedRouteProps, AvatarProps, BadgeVariant, BadgeProps, SupabaseResult } from './ui'

export type { SchoolType, OnboardingFormData, StepProps, SummaryStepProps, CoachStepProps, StepIndicatorProps, TierPlan, TierInput, TierStepProps } from './onboarding'

export type { ContentType, CognitiveType, InputType, Subject, SkillCluster, Microskill, TaskAsset, Task, DiagnosticTask, DiagnosticTest, TaskCoachMetadata } from './content'
