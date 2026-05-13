// Zentrale TypeScript-Typen für das gesamte Edvance-Projekt.
// Alle Props-Interfaces, Domain-Types und Enums leben hier.

import type { ReactNode } from 'react'

// ── Auth & Rollen ─────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'parent' | 'coach' | 'admin'
export type Role = UserRole | null

// ── Sessions / Students (Domain) ──────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'unknown'
export type SessionStatus = 'upcoming' | 'active' | 'done'

export type MockStudent = {
  id: string
  name: string
  classLevel: number
  subjects: string[]
  attendance: AttendanceStatus
}

export type MockSession = {
  id: string
  time: string
  status: SessionStatus
  room: string
  coach: string
  students: MockStudent[]
}

// ── Theme ─────────────────────────────────────────────────────────────────────

export const THEMES = ['edvance', 'ocean', 'forest', 'sunset'] as const
export type Theme = (typeof THEMES)[number]
export type ThemeColors = { primary: string; light: string; dark: string }

// ── Onboarding-Wizard ─────────────────────────────────────────────────────────

export type SchoolType = 'Gymnasium' | 'Gesamtschule' | 'Realschule' | 'Hauptschule' | ''
export type Tier = 'Basic' | 'Standard' | 'Premium' | ''

export type OnboardingFormData = {
  firstName: string
  lastName: string
  email: string
  classLevel: string
  schoolName: string
  schoolType: SchoolType
  subjects: string[]
  tier: Tier
  coachId: string
}

export type StepProps = {
  data: OnboardingFormData
  setData: (next: OnboardingFormData) => void
}

export type SummaryStepProps = {
  data: OnboardingFormData
}

export type StepIndicatorProps = {
  current: number
}

export type TierOption = {
  id: Tier
  label: string
  price: string
  features: string[]
}

export type CoachOption = {
  id: string
  name: string
}

// ── Komponenten-Props ─────────────────────────────────────────────────────────

export type ProtectedRouteProps = {
  allowedRoles: UserRole[]
  children: ReactNode
}

export type AvatarProps = {
  initials: string
  attendance?: AttendanceStatus
  className?: string
}

export type BadgeVariant = 'active' | 'done' | 'upcoming'

export type BadgeProps = {
  variant: BadgeVariant
  className?: string
}

// ── Supabase-Wrapper-Result ───────────────────────────────────────────────────

export type SupabaseResult<T> = {
  data: T | null
  error: string | null
}

// ── Content / Aufgaben-Schema ─────────────────────────────────────────────────

export type ContentType = 'exercise' | 'exercise_group' | 'article' | 'video' | 'course'

export type CognitiveType = 'FACT' | 'TRANSFER' | 'ANALYSIS'

export type InputType = 'MC' | 'FREE_INPUT' | 'STEPS' | 'MATCHING' | 'DRAW'

export type Subject = {
  id: string
  name: string
}

export type SkillCluster = {
  id: string
  subject_id: string
  name: string
  class_level_min: number
  class_level_max: number
  sort_order: number
}

export type Microskill = {
  id: string
  cluster_id: string
  code: string
  name: string
  description: string | null
  class_level: number
  prerequisite_ids: string[]
  sort_order: number
  cognitive_type: CognitiveType | null
  estimated_minutes: number | null
  curriculum_ref: string | null
}

export type TaskAsset = {
  url: string
  alt: string
  caption?: string
}

export type Task = {
  id: string
  microskill_id: string | null
  cluster_id: string | null
  source: string
  source_ref: string | null
  content_type: ContentType
  title: string | null
  question: string | null
  solution: string | null
  hint: string | null
  common_errors: string | null
  coach_note: string | null
  difficulty: number | null
  estimated_minutes: number
  class_level: number | null
  is_active: boolean
  created_at: string
  cognitive_type: CognitiveType | null
  input_type: InputType | null
  is_diagnostic: boolean
  curriculum_ref: string | null
  question_payload: unknown | null
  typical_errors: string[] | null
  assets: TaskAsset[]
}

// Diagnostic-Generator Output-Typen (siehe src/lib/diagnostic/generator.ts).
export type DiagnosticTask = {
  sequence: number
  task_id: string
  topic_id: string
  topic_label: string
  input_type: InputType
  competency_level: 1 | 2 | 3
  estimated_minutes: number
  coach_hint: string
  typical_errors: string[]
}

export type DiagnosticTest = {
  student_id: string
  subject: string
  grade: number
  generated_at: string
  estimated_total_minutes: number
  coverage: { topic_id: string; topic_label: string; task_id: string }[]
  tasks: DiagnosticTask[]
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

export type TaskCoachMetadata = {
  id: string
  task_id: string
  typical_errors: string | null
  observation_hints: string | null
  intervention_triggers: string | null
}
