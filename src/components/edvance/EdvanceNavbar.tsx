import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

type EdvanceNavbarProps = {
  subtitle: string
  sticky?: boolean
}

// Einheitliche Navbar für alle Dashboards mit Logo, Titel, User-Mail und Logout.
export function EdvanceNavbar({ subtitle, sticky = false }: EdvanceNavbarProps): JSX.Element {
  const { user, signOut } = useAuth()

  return (
    <nav
      className={cn(
        'glass-light flex items-center justify-between border-b border-[var(--border)] px-6 py-3',
        sticky && 'sticky top-0 z-30',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-black text-white bg-gradient-brand shadow-glow-primary"
          aria-hidden="true"
        >
          E
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-[var(--text-primary)] leading-tight">
            Edvance
          </p>
          <p className="text-xs text-[var(--text-muted)] leading-tight">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-[var(--text-muted)] sm:block">{user?.email}</span>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Abmelden
        </Button>
      </div>
    </nav>
  )
}
