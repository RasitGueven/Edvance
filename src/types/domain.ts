// Core domain types: students, leads, sessions, subscriptions, reports

import type { DiagnosticTest } from './content'

export type AttendanceStatus = 'present' | 'absent' | 'unknown'
export type SessionStatus = 'upcoming' | 'active' | 'done'
export type SchoolKind = 'Gymnasium' | 'Gesamtschule' | 'Realschule' | 'Hauptschule'
export type SchoolType = SchoolKind | ''

export type SupabaseResult<T> = {
  data: T | null
  error: string | null
}

export type Coach = { id: string; full_name: string | null }

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'onboarding_scheduled'
  | 'converted'
  | 'rejected'

export type LeadGoal = 'IMPROVE_GRADES' | 'CLOSE_GAPS' | 'EXAM_PREP' | 'GENERAL'

export type Lead = {
  id: string
  created_at: string
  full_name: string
  contact_email: string | null
  contact_phone: string | null
  class_level: number | null
  school_type: SchoolKind | null
  school_name: string | null
  subjects: string[]
  goal: LeadGoal | null
  known_weak_topics: string[]
  source: string | null
  status: LeadStatus
  owner_id: string | null
  notes: string | null
  converted_student_id: string | null
  contacted_at: string | null
  onboarding_scheduled_at: string | null
}

export type LeadInput = {
  full_name: string
  contact_email?: string | null
  contact_phone?: string | null
  class_level?: number | null
  school_type?: SchoolKind | null
  school_name?: string | null
  subjects?: string[]
  goal?: LeadGoal | null
  known_weak_topics?: string[]
  source?: string | null
}

export type Student = {
  id: string
  profile_id: string
  class_level: number | null
  school_name: string | null
  school_type: SchoolKind | null
}

export type StudentInput = {
  profile_id: string
  class_level?: number | null
  school_name?: string | null
  school_type?: SchoolKind | null
}

export type StudentWithName = Student & { full_name: string | null }

export type IntakeStatus = 'draft' | 'final'

export type IntakeSession = {
  id: string
  created_at: string
  student_id: string
  lead_id: string | null
  coach_id: string | null
  conducted_at: string | null
  goals: string | null
  motivation: string | null
  learning_history: string | null
  parent_expectations: string | null
  known_weak_topics: string[]
  agreed_next_steps: string | null
  notes: string | null
  status: IntakeStatus
}

export type IntakeInput = {
  student_id: string
  lead_id?: string | null
  coach_id?: string | null
  conducted_at?: string | null
  goals?: string | null
  motivation?: string | null
  learning_history?: string | null
  parent_expectations?: string | null
  known_weak_topics?: string[]
  agreed_next_steps?: string | null
  notes?: string | null
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

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'

export type StudentSubscription = {
  id: string
  created_at: string
  student_id: string
  tier_id: string
  status: SubscriptionStatus
  started_at: string | null
  ended_at: string | null
}

export type StudentCoach = {
  student_id: string
  coach_id: string
  assigned_at: string
  active: boolean
}

export type ScreeningStatus = 'in_progress' | 'completed' | 'aborted'

export type ScreeningTest = {
  id: string
  created_at: string
  student_id: string
  subject: string
  status: ScreeningStatus
  coach_id: string | null
  coach_note: string | null
  generated_test: DiagnosticTest | null
  generated_test_version: number
  result_summary: Record<string, unknown> | null
  estimated_total_minutes: number | null
  started_at: string | null
  completed_at: string | null
}

export type ScreeningTestInput = {
  student_id: string
  subject: string
  generated_test: DiagnosticTest
  estimated_total_minutes?: number | null
  coach_id?: string | null
}

export type ScreeningRating = {
  id: string
  created_at: string
  behavior_snapshot_id: string
  screening_test_id: string
  rating: 1 | 2 | 3 | 4
  coach_id: string | null
}

export type CoachingSession = {
  id: string
  created_at: string
  coach_id: string
  room: string | null
  scheduled_at: string
  status: SessionStatus
}

export type SessionStudent = {
  session_id: string
  student_id: string
  attendance: AttendanceStatus
}

export type StudentTaskProgress = {
  student_id: string
  task_id: string
  completed_at: string
}

export type StudentProgress = {
  student_id: string
  xp_total: number
  streak_days: number
  level: number
  last_activity: string | null
}

export type XpEvent = {
  id: string
  created_at: string
  student_id: string
  task_id: string | null
  xp: number
  reason: string | null
}

export type ParentReportStatus = 'draft' | 'published'

export type ParentReport = {
  id: string
  created_at: string
  student_id: string
  period_start: string
  period_end: string
  summary: Record<string, unknown> | null
  coach_note: string | null
  status: ParentReportStatus
  published_at: string | null
}

export type ParentReportInput = {
  student_id: string
  period_start: string
  period_end: string
  summary?: Record<string, unknown> | null
  coach_note?: string | null
}
