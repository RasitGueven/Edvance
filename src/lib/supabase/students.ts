// Schueler-bezogene Supabase-Operationen.

import { supabase } from '@/lib/supabase/client'
import type { Student, StudentInput, SupabaseResult } from '@/types'

// Legt eine students-Reihe zu einem bestehenden profile_id an.
export async function createStudent(
  input: StudentInput,
): Promise<SupabaseResult<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert({
        profile_id: input.profile_id,
        class_level: input.class_level ?? null,
        school_name: input.school_name ?? null,
        school_type: input.school_type ?? null,
      })
      .select('*')
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as Student, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Schueler konnte nicht angelegt werden'
    return { data: null, error: message }
  }
}

// Schueler-Reihe zu einem profile_id (kann fehlen → null).
export async function getStudentByProfile(
  profileId: string,
): Promise<SupabaseResult<Student | null>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: (data as Student | null) ?? null, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Schueler konnte nicht geladen werden'
    return { data: null, error: message }
  }
}

// Alle Schueler (RLS: nur Coach/Admin sehen alle).
export async function listStudents(): Promise<SupabaseResult<Student[]>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('class_level', { ascending: true, nullsFirst: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Student[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Schueler konnten nicht geladen werden'
    return { data: null, error: message }
  }
}

// Mappt Fachnamen → subjects.id und setzt student_subjects (idempotent).
// Unbekannte Faecher → Fehler (Fail-Fast, kein stilles Verschlucken).
export async function setStudentSubjects(
  studentId: string,
  subjectNames: string[],
): Promise<SupabaseResult<{ linked: number }>> {
  try {
    if (subjectNames.length === 0) return { data: { linked: 0 }, error: null }
    const { data: subs, error: subErr } = await supabase
      .from('subjects')
      .select('id, name')
      .in('name', subjectNames)
    if (subErr) return { data: null, error: subErr.message }
    const found = (subs ?? []) as { id: string; name: string }[]
    const missing = subjectNames.filter(
      (n) => !found.some((s) => s.name === n),
    )
    if (missing.length > 0) {
      return { data: null, error: `Fach unbekannt: ${missing.join(', ')}` }
    }
    const rows = found.map((s) => ({ student_id: studentId, subject_id: s.id }))
    const { error } = await supabase
      .from('student_subjects')
      .upsert(rows, { onConflict: 'student_id,subject_id' })
    if (error) return { data: null, error: error.message }
    return { data: { linked: rows.length }, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Faecher konnten nicht zugeordnet werden'
    return { data: null, error: message }
  }
}
