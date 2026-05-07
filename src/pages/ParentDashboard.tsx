import { useAuth } from '@/context/AuthContext'

export function ParentDashboard() {
  const { user } = useAuth()
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-xl font-semibold text-foreground">
        Eltern-Dashboard – {user?.email ?? ''}
      </p>
    </main>
  )
}
