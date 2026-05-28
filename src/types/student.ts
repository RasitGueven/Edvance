import type { SchoolKind } from './lead'

export type AttendanceStatus = 'present' | 'absent' | 'unknown'
export type SessionStatus = 'upcoming' | 'active' | 'done'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'

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
