export type SchoolKind = 'Gymnasium' | 'Gesamtschule' | 'Realschule' | 'Hauptschule'

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
