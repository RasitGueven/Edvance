import { supabase } from '@/lib/supabase/client'
import type {
  Microskill,
  SkillCluster,
  Subject,
  SupabaseResult,
  Task,
  TaskCoachMetadata,
} from '@/types'

// Alle Faecher.
export async function getSubjects(): Promise<SupabaseResult<Subject[]>> {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Subject[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Faecher konnten nicht geladen werden'
    return { data: null, error: message }
  }
}

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

// Eine einzelne Aufgabe per id.
export async function getTaskById(taskId: string): Promise<SupabaseResult<Task | null>> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: (data as Task | null) ?? null, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Aufgabe konnte nicht geladen werden'
    return { data: null, error: message }
  }
}

// Cluster nach Name suchen (z.B. fuer Diagnose → Cluster Mapping).
export async function getClusterByName(
  name: string,
): Promise<SupabaseResult<SkillCluster | null>> {
  try {
    const { data, error } = await supabase
      .from('skill_clusters')
      .select('*')
      .eq('name', name)
      .limit(1)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: (data as SkillCluster | null) ?? null, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cluster konnte nicht geladen werden'
    return { data: null, error: message }
  }
}

// Ein einzelnes Cluster per id.
export async function getClusterById(
  clusterId: string,
): Promise<SupabaseResult<SkillCluster | null>> {
  try {
    const { data, error } = await supabase
      .from('skill_clusters')
      .select('*')
      .eq('id', clusterId)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: (data as SkillCluster | null) ?? null, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cluster konnte nicht geladen werden'
    return { data: null, error: message }
  }
}

// Alle aktiven Tasks eines Clusters in didaktischer Lernreihenfolge:
// erst Erklären (video, article), dann Üben (exercise nach difficulty),
// dann Testen (exercise_group, course).
const TYPE_ORDER: Record<Task['content_type'], number> = {
  video: 1,
  article: 2,
  exercise: 3,
  exercise_group: 4,
  course: 5,
}

export async function getTasksByClusterOrdered(
  clusterId: string,
): Promise<SupabaseResult<Task[]>> {
  const { data, error } = await getTasksByCluster(clusterId)
  if (error) return { data: null, error }
  const list = data ?? []
  const sorted = [...list].sort((a, b) => {
    const typeDiff = TYPE_ORDER[a.content_type] - TYPE_ORDER[b.content_type]
    if (typeDiff !== 0) return typeDiff
    const da = a.difficulty ?? 99
    const db = b.difficulty ?? 99
    if (da !== db) return da - db
    return a.id.localeCompare(b.id)
  })
  return { data: sorted, error: null }
}

// Tasks ohne Cluster-Zuordnung (cluster_id IS NULL).
export async function getUnmappedTasks(): Promise<SupabaseResult<Task[]>> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .is('cluster_id', null)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Task[], error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Tasks ohne Cluster konnten nicht geladen werden'
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
