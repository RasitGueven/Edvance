import type { Session, Subscription, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { SupabaseResult } from '@/types'

// Login per E-Mail/Passwort.
export async function signIn(
  email: string,
  password: string,
): Promise<SupabaseResult<User>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { data: null, error: error.message }
    return { data: data.user, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler beim Login'
    return { data: null, error: message }
  }
}

// Aktuelle Session laden (z.B. beim App-Start).
export async function getCurrentSession(): Promise<SupabaseResult<Session>> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) return { data: null, error: error.message }
    return { data: data.session, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Session konnte nicht geladen werden'
    return { data: null, error: message }
  }
}

// Logout.
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Logout fehlgeschlagen'
    return { error: message }
  }
}

// Auth-State-Listener registrieren. Gibt Subscription zum Abmelden zurück.
export function subscribeToAuthChanges(
  callback: (session: Session | null) => void,
): Subscription {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return data.subscription
}
