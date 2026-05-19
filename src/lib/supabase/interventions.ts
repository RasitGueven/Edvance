import { supabase } from '@/lib/supabase/client'
import type { Intervention, SupabaseResult } from '@/types'

// Eingriffe einer Session (RLS filtert nach Rolle).
export async function listInterventionsForSession(
  sessionId: string,
): Promise<SupabaseResult<Intervention[]>> {
  try {
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('session_id', sessionId)
      .order('started_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Intervention[], error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Eingriffe konnten nicht geladen werden'
    return { data: null, error: message }
  }
}

// Eingriff starten (started_at via DB-Default).
export async function startIntervention(
  sessionId: string,
  studentId: string,
  coachId: string,
): Promise<SupabaseResult<Intervention>> {
  try {
    const { data, error } = await supabase
      .from('interventions')
      .insert({ session_id: sessionId, student_id: studentId, coach_id: coachId })
      .select('*')
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as Intervention, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Eingriff konnte nicht gestartet werden'
    return { data: null, error: message }
  }
}

// Eingriff lösen (resolved_at = jetzt, UTC).
export async function resolveIntervention(
  id: string,
): Promise<SupabaseResult<Intervention>> {
  try {
    const { data, error } = await supabase
      .from('interventions')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as Intervention, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Eingriff konnte nicht gelöst werden'
    return { data: null, error: message }
  }
}
