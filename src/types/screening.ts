// Screening and onboarding types.

import type { DiagnosticTest } from './content'

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

// Laufzeit-Aufgabe der Screening-/Diagnose-Engine.
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

export type OnboardingData = {
  student_id: string
  grade: number
  school_type: 'GESAMTSCHULE' | 'GYMNASIUM' | 'REALSCHULE' | 'HAUPTSCHULE'
  subject: 'MATH' | 'GERMAN' | 'ENGLISH'
  goal: 'IMPROVE_GRADES' | 'CLOSE_GAPS' | 'EXAM_PREP' | 'GENERAL'
  known_weak_topics?: string[]
  last_grade_in_subject?: number
}
