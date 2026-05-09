import { supabase } from '@/lib/supabase/client'
import type {
  Microskill,
  SkillCluster,
  SupabaseResult,
  Task,
  TaskCoachMetadata,
} from '@/types'

// Aufgaben fuer einen einzelnen Microskill (nur aktive).
export async function getTasksByMicroskill(
  microskillId: string,
): Promise<SupabaseResult<Task[]>> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('microskill_id', microskillId)
      .eq('is_active', true)
      .order('difficulty', { ascending: true, nullsFirst: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Task[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Aufgaben konnten nicht geladen werden'
    return { data: null, error: message }
  }
}

// Aufgaben fuer ein Cluster, optional auf eine Klassenstufe gefiltert.
export async function getTasksByCluster(
  clusterId: string,
  classLevel?: number,
): Promise<SupabaseResult<Task[]>> {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('cluster_id', clusterId)
      .eq('is_active', true)
    if (classLevel != null) {
      query = query.eq('class_level', classLevel)
    }
    const { data, error } = await query.order('difficulty', { ascending: true, nullsFirst: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Task[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Aufgaben konnten nicht geladen werden'
    return { data: null, error: message }
  }
}

// Cluster eines Fachs, optional auf eine Klassenstufe gefiltert (Stufe muss in Range liegen).
export async function getClustersBySubject(
  subjectId: string,
  classLevel?: number,
): Promise<SupabaseResult<SkillCluster[]>> {
  try {
    let query = supabase
      .from('skill_clusters')
      .select('*')
      .eq('subject_id', subjectId)
    if (classLevel != null) {
      query = query.lte('class_level_min', classLevel).gte('class_level_max', classLevel)
    }
    const { data, error } = await query.order('sort_order', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as SkillCluster[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cluster konnten nicht geladen werden'
    return { data: null, error: message }
  }
}

// Microskills eines Clusters, sortiert nach sort_order.
export async function getMicroskillsByCluster(
  clusterId: string,
): Promise<SupabaseResult<Microskill[]>> {
  try {
    const { data, error } = await supabase
      .from('microskills')
      .select('*')
      .eq('cluster_id', clusterId)
      .order('sort_order', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Microskill[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Microskills konnten nicht geladen werden'
    return { data: null, error: message }
  }
}

// Coach-Metadaten zu einer Aufgabe (kann fehlen → null).
export async function getTaskCoachMetadata(
  taskId: string,
): Promise<SupabaseResult<TaskCoachMetadata | null>> {
  try {
    const { data, error } = await supabase
      .from('task_coach_metadata')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: (data as TaskCoachMetadata | null) ?? null, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Coach-Metadaten konnten nicht geladen werden'
    return { data: null, error: message }
  }
}
