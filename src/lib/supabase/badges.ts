import { supabase } from '@/lib/supabase/client'
import type { Badge, StudentBadge, SupabaseResult } from '@/types'

/** Vollständiger Badge-Catalog (MVP-Badges + Klassen-Abschluss-Platin). */
export async function getBadgeCatalog(): Promise<SupabaseResult<Badge[]>> {
  try {
    const { data, error } = await supabase
      .from('badge_catalog')
      .select('*')
      .order('rarity', { ascending: true })
      .order('label', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Badge[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Badge-Catalog konnte nicht geladen werden'
    return { data: null, error: message }
  }
}

/** Liste der von einem Schüler erhaltenen Badges (joined mit Catalog). */
export async function getStudentBadges(
  studentId: string,
): Promise<SupabaseResult<(StudentBadge & { badge: Badge })[]>> {
  try {
    const { data, error } = await supabase
      .from('student_badges')
      .select('*, badge:badge_catalog(*)')
      .eq('student_id', studentId)
      .order('awarded_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return {
      data: (data ?? []) as (StudentBadge & { badge: Badge })[],
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Schüler-Badges konnten nicht geladen werden'
    return { data: null, error: message }
  }
}

/** Verleiht einem Schüler ein Badge (Coach/Admin). Idempotent durch PK. */
export async function awardBadge(
  studentId: string,
  badgeId: string,
): Promise<SupabaseResult<StudentBadge>> {
  try {
    const { data, error } = await supabase
      .from('student_badges')
      .upsert(
        { student_id: studentId, badge_id: badgeId },
        { onConflict: 'student_id,badge_id', ignoreDuplicates: false },
      )
      .select('*')
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as StudentBadge, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Badge konnte nicht vergeben werden'
    return { data: null, error: message }
  }
}
