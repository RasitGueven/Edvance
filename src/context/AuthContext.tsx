import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getCurrentSession,
  signIn as signInRequest,
  signOut as signOutRequest,
  subscribeToAuthChanges,
} from '@/lib/supabase/auth'
import { getProfileRole } from '@/lib/supabase/profiles'
import type { Role } from '@/types'

type AuthContextValue = {
  user: User | null
  role: Role
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    void getCurrentSession().then(({ data }) => {
      setUser(data?.user ?? null)
      setLoading(false)
    })

    const subscription = subscribeToAuthChanges((session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Rollen-Fetch separat – nicht im onAuthStateChange-Callback,
  // sonst Supabase-interner Lock-Deadlock.
  useEffect(() => {
    if (!user) {
      setRole(null)
      return
    }
    let cancelled = false
    void getProfileRole(user.id).then(({ data }) => {
      if (!cancelled) setRole(data ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    const { error } = await signInRequest(email, password)
    return { error }
  }

  const signOut = async (): Promise<void> => {
    await signOutRequest()
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider')
  return ctx
}
