export interface DiagnosisTask {
  id: string
  skill_id: string
  skill_cluster: string
  question: string
  solution: string
  common_errors: string
  coach_hint: string
  estimated_minutes: number
}

export interface BehaviorSnapshot {
  task_id: string
  thinking_time_ms: number
  task_duration_ms: number
  revision_count: number
  rewrite_count: number
  hint_used: boolean
  hint_request_time_ms: number | null
  answer_length: number
  time_after_completion_ms: number
  answer_text: string
  coach_rating: 1 | 2 | 3 | 4 | null
}

export type MasterySignal = 'secure' | 'developing' | 'gap' | 'guessing'

export interface BehaviorAnalysis {
  confidence_score: number
  effort_score: number
  frustration_index: number
  mastery_signal: MasterySignal
  flags: string[]
}

export interface SkillLevelEntry {
  skill_cluster: string
  level: number
  label: 'Lücke' | 'Erkennbar' | 'Sicher'
}

export interface DiagnosisResult {
  student_name: string
  subject: string
  date: string
  snapshots: BehaviorSnapshot[]
  analyses: BehaviorAnalysis[]
  skill_levels: SkillLevelEntry[]
  overall_behavior_flags: string[]
  coach_note: string
}
