import type { SessionStatus } from './student'

export type Coach = { id: string; full_name: string | null }

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
  attendance: import('./student').AttendanceStatus
}
