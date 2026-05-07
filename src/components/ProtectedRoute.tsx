import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

type Props = {
  allowedRoles: string[]
  children: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const { user, role, loading } = useAuth()

  if (loading || (user && role === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!allowedRoles.includes(role ?? '')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <p className="text-xl font-semibold text-foreground">Kein Zugriff</p>
        <p className="text-sm text-muted">Du hast keine Berechtigung für diese Seite.</p>
      </div>
    )
  }

  return <>{children}</>
}
