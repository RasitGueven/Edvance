import { supabase } from '@/lib/supabase/client'
import type { Role, SupabaseResult, UserRole } from '@/types'

const VALID_ROLES: readonly UserRole[] = ['student', 'parent', 'coach', 'admin']

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (VALID_ROLES as readonly string[]).includes(value)
}

// Lädt die Rolle (student|parent|coach|admin) für einen User aus der profiles-Tabelle.
export async function getProfileRole(userId: string): Promise<SupabaseResult<Role>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (error) return { data: null, error: error.message }
    const role = isUserRole(data?.role) ? data.role : null
    return { data: role, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profil konnte nicht geladen werden'
    return { data: null, error: message }
  }
}
