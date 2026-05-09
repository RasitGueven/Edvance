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

export type Subject = {
  id: string
  name: string
  serlo_id: number | null
}

export type SkillCluster = {
  id: string
  subject_id: string
  name: string
  class_level_min: number
  class_level_max: number
  serlo_taxonomy_id: number | null
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
}

export type Task = {
  id: string
  microskill_id: string | null
  cluster_id: string | null
  serlo_uuid: number | null
  serlo_url: string | null
  serlo_video_url: string | null
  serlo_content_raw: unknown | null
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
}

export type TaskCoachMetadata = {
  id: string
  task_id: string
  typical_errors: string | null
  observation_hints: string | null
  intervention_triggers: string | null
}
