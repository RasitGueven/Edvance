import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export function StudentDashboard() {
  const { user, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between border-b border-border bg-card px-6 py-3" style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>E</div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Edvance</p>
            <p className="text-xs text-muted leading-tight">Schüler-Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:block">{user?.email}</span>
          <Button variant="outline" onClick={signOut}>Abmelden</Button>
        </div>
      </nav>
      <main className="flex items-center justify-center py-32">
        <p className="text-muted">Schüler-Bereich – coming soon</p>
      </main>
    </div>
  )
}
