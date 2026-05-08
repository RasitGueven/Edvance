import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

type EdvanceNavbarProps = {
  subtitle: string
  sticky?: boolean
}

const NAVBAR_SHADOW = '0 1px 4px 0 rgba(0,0,0,0.06)'
const LOGO_GRADIENT = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'

// Einheitliche Navbar für alle Dashboards mit Logo, Titel, User-Mail und Logout.
export function EdvanceNavbar({ subtitle, sticky = false }: EdvanceNavbarProps): JSX.Element {
  const { user, signOut } = useAuth()

  const stickyClass = sticky ? 'sticky top-0 z-10 ' : ''

  return (
    <nav
      className={`${stickyClass}flex items-center justify-between border-b border-border bg-card px-6 py-3`}
      style={{ boxShadow: NAVBAR_SHADOW }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ background: LOGO_GRADIENT }}
        >
          E
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">Edvance</p>
          <p className="text-xs text-muted leading-tight">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted sm:block">{user?.email}</span>
        <Button variant="outline" onClick={signOut}>
          Abmelden
        </Button>
      </div>
    </nav>
  )
}
