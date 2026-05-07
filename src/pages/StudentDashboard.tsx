import { useAuth } from '@/context/AuthContext'

export function StudentDashboard() {
  const { user } = useAuth()
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-xl font-semibold text-foreground">
        Schüler-Dashboard – {user?.email ?? ''}
      </p>
    </main>
  )
}
