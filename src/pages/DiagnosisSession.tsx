import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDiagnosis } from '@/context/DiagnosisContext'
import { MinimalHeader } from '@/components/edvance/diagnosis/SessionShared'
import { StudentView } from '@/components/edvance/diagnosis/SessionStudentView'
import { CoachView } from '@/components/edvance/diagnosis/SessionCoachView'
import { SetupScreen } from '@/components/edvance/diagnosis/SessionSetupScreen'

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
