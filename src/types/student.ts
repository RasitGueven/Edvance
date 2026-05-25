import type { SchoolKind } from './lead'
import type { CognitiveType, DiagnosticTest, InputType } from './content'

export type AttendanceStatus = 'present' | 'absent' | 'unknown'
export type SessionStatus = 'upcoming' | 'active' | 'done'

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

export type DiagnosticTaskInput = {
  question: string
  solution?: string | null
  common_errors?: string | null
  coach_note?: string | null
  microskill_id?: string | null
  cluster_id?: string | null
  class_level?: number | null
  difficulty?: number | null
  input_type?: InputType | null
  cognitive_type?: CognitiveType | null
  estimated_minutes?: number | null
}

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

export type OnboardingData = {
  student_id: string
  grade: number
  school_type: 'GESAMTSCHULE' | 'GYMNASIUM' | 'REALSCHULE' | 'HAUPTSCHULE'
  subject: 'MATH' | 'GERMAN' | 'ENGLISH'
  goal: 'IMPROVE_GRADES' | 'CLOSE_GAPS' | 'EXAM_PREP' | 'GENERAL'
  known_weak_topics?: string[]
  last_grade_in_subject?: number
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
