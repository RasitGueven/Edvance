import { supabase } from '@/lib/supabase/client'
import type {
  ScreeningTest,
  ScreeningTestInput,
  SupabaseResult,
} from '@/types'
// Abgeschlossene Screening-Tests eines Schülers (neueste zuerst) — für
// die Coach-Ergebnis-Sicht.
export async function listCompletedScreeningTests(
  studentId: string,
): Promise<SupabaseResult<ScreeningTest[]>> {
  try {
    const { data, error } = await supabase
      .from('screening_tests')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as ScreeningTest[], error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Screening-Ergebnisse konnten nicht geladen werden'
    return { data: null, error: message }
  }
}

// Startet einen Screening-Lauf (Aggregat). status defaultet DB-seitig
// 'in_progress'; partial-unique-Index verhindert doppelte aktive Tests
// pro (Schueler, Fach).
export async function createScreeningTest(
  input: ScreeningTestInput,
): Promise<SupabaseResult<ScreeningTest>> {
  try {
    const { data, error } = await supabase
      .from('screening_tests')
      .insert({
        student_id: input.student_id,
        subject: input.subject,
        generated_test: input.generated_test,
        estimated_total_minutes: input.estimated_total_minutes ?? null,
        coach_id: input.coach_id ?? null,
        started_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as ScreeningTest, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Screening konnte nicht gestartet werden'
    return { data: null, error: message }
  }
}

// Aktiver Test eines Schuelers in einem Fach (fuer Resume; kann fehlen).
export async function getActiveScreeningTest(
  studentId: string,
  subject: string,
): Promise<SupabaseResult<ScreeningTest | null>> {
  try {
    const { data, error } = await supabase
      .from('screening_tests')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('status', 'in_progress')
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: (data as ScreeningTest | null) ?? null, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Screening konnte nicht geladen werden'
    return { data: null, error: message }
  }
}

// Schliesst den Lauf ab: Ergebnis-Aggregat + optionale Coach-Notiz.
export async function completeScreeningTest(
  id: string,
  resultSummary: Record<string, unknown>,
  coachNote?: string | null,
): Promise<SupabaseResult<ScreeningTest>> {
  try {
    const { data, error } = await supabase
      .from('screening_tests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_summary: resultSummary,
        coach_note: coachNote ?? null,
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as ScreeningTest, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Screening konnte nicht abgeschlossen werden'
    return { data: null, error: message }
  }
}

