import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDiagnosis } from '@/context/DiagnosisContext'
import { StudentView } from '@/components/edvance/diagnosis/StudentView'
import { CoachView } from '@/components/edvance/diagnosis/CoachView'
import { SetupScreen } from '@/components/edvance/diagnosis/SetupScreen'

function MinimalHeader({ subtitle }: { subtitle: string }) {
  return (
    <nav className="flex items-center justify-between bg-card px-6 py-4 border-b-2 border-border">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-base font-black text-white"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            boxShadow: '0 3px 0 0 var(--primary-shadow)',
          }}
        >
          E
        </div>
        <div>
          <p className="text-sm font-black text-foreground leading-tight tracking-tight">Edvance</p>
          <p className="text-xs font-semibold text-muted leading-tight uppercase tracking-wider">{subtitle}</p>
        </div>
      </div>
    </nav>
  )
}

export function DiagnosisSession({ screening = false }: { screening?: boolean }) {
  const [params] = useSearchParams()
  const { state } = useDiagnosis()
  const view = (params.get('view') === 'coach' ? 'coach' : 'student') as 'student' | 'coach'

  const base = screening ? 'Screening' : 'Diagnose'
  const subtitle = useMemo(
    () => (view === 'coach' ? `${base} · Coach-Sicht` : base),
    [view, base],
  )

  const sessionStarted = state.startedAt !== null

  return (
    <div className="min-h-screen bg-background">
      <MinimalHeader subtitle={subtitle} />
      {!sessionStarted ? (
        <SetupScreen view={view} screening={screening} />
      ) : view === 'coach' ? (
        <CoachView />
      ) : (
        <StudentView />
      )}
    </div>
  )
}
