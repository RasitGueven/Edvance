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
