import { supabase } from '@/lib/supabase/client'
import type { StreakRepairInventory, SupabaseResult } from '@/types'

/** Liefert den aktuellen Repair-Token-Stand eines Schülers (oder null, falls noch nie initialisiert). */
export async function getRepairTokens(
  studentId: string,
): Promise<SupabaseResult<StreakRepairInventory | null>> {
  try {
    const { data, error } = await supabase
      .from('streak_repair_inventory')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: (data as StreakRepairInventory | null) ?? null, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Repair-Token-Stand konnte nicht geladen werden'
    return { data: null, error: message }
  }
}

/**
 * Reduziert Token-Bestand um 1 und erhöht used_total. Sollte nur aus dem
 * `StreakRepairFlow`-Component aufgerufen werden, nachdem der Schüler den
 * Repair bewusst bestätigt hat.
 */
export async function useRepairToken(
  studentId: string,
): Promise<SupabaseResult<StreakRepairInventory>> {
  try {
    const current = await getRepairTokens(studentId)
    if (current.error) return { data: null, error: current.error }
    if (!current.data || current.data.tokens <= 0) {
      return { data: null, error: 'Keine Repair-Token vorhanden' }
    }
    const { data, error } = await supabase
      .from('streak_repair_inventory')
      .update({
        tokens: current.data.tokens - 1,
        used_total: current.data.used_total + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .select('*')
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as StreakRepairInventory, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Repair-Token konnte nicht eingesetzt werden'
    return { data: null, error: message }
  }
}

/** Admin-Schnittstelle: vergibt einem Schüler einen neuen Repair-Token. */
export async function awardRepairToken(
  studentId: string,
): Promise<SupabaseResult<StreakRepairInventory>> {
  try {
    const current = await getRepairTokens(studentId)
    if (current.error) return { data: null, error: current.error }

    if (!current.data) {
      const { data, error } = await supabase
        .from('streak_repair_inventory')
        .insert({
          student_id: studentId,
          tokens: 1,
          earned_total: 1,
          used_total: 0,
        })
        .select('*')
        .single()
      if (error) return { data: null, error: error.message }
      return { data: data as StreakRepairInventory, error: null }
    }

    const { data, error } = await supabase
      .from('streak_repair_inventory')
      .update({
        tokens: current.data.tokens + 1,
        earned_total: current.data.earned_total + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .select('*')
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as StreakRepairInventory, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Repair-Token konnte nicht vergeben werden'
    return { data: null, error: message }
  }
}
