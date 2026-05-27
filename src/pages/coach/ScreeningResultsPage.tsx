import { useEffect, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import {
  EdvanceCard,
  EdvanceBadge,
  EmptyState,
  LoadingPulse,
  MasteryBar,
} from '@/components/edvance'
import { listStudentsWithName } from '@/lib/supabase/students'
import { masteryStage, type MasteryStage } from '@/lib/mastery'
import type { StudentWithName } from '@/types'

/**
 * Screening-Ergebnisse — Coach-Sicht.
 * Mastery-Übersicht eines Schülers nach Initialdiagnostik, mit 5-Stufen-Logik.
 *
 * Hinweis: Echtes Screening-Result-Schema steht noch aus; bis dahin werden
 * Demo-Werte aus der gewählten Schüler-ID deterministisch abgeleitet.
 */
export function ScreeningResultsPage(): JSX.Element {
  const [students, setStudents] = useState<StudentWithName[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data, error: sErr } = await listStudentsWithName()
      if (cancelled) return
      if (sErr) setError(sErr)
      else {
        setStudents(data ?? [])
        if ((data ?? []).length > 0) setActiveId((data ?? [])[0].id)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const active = students.find((s) => s.id === activeId) ?? null

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <EdvanceNavbar subtitle="Screening-Ergebnisse" sticky />
      <main className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Screening-Ergebnisse</h1>
          <Link
            to="/coach"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Link>
        </div>

        {error && <p className="text-sm text-[var(--color-error-coach)]">{error}</p>}

        {loading ? (
          <LoadingPulse type="card" />
        ) : students.length === 0 ? (
          <EmptyState
            icon="🧪"
            title="Keine Screenings"
            description="Sobald die ersten Schüler die Initialdiagnostik abgeschlossen haben, erscheinen die Auswertungen hier."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
            <StudentList
              students={students}
              activeId={activeId}
              onSelect={setActiveId}
            />
            {active ? <ResultBlock student={active} /> : null}
          </div>
        )}
      </main>
    </div>
  )
}

function StudentList({
  students,
  activeId,
  onSelect,
}: {
  students: StudentWithName[]
  activeId: string | null
  onSelect: (id: string) => void
}): JSX.Element {
  return (
    <aside className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
        Schüler
      </h2>
      {students.map((s) => {
        const isActive = s.id === activeId
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`flex items-start justify-between gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-left transition-colors ${
              isActive
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-primary-light)]'
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{s.full_name ?? 'Unbenannt'}</p>
              {s.class_level && (
                <p className="text-xs text-[var(--color-text-tertiary)]">Klasse {s.class_level}</p>
              )}
            </div>
          </button>
        )
      })}
    </aside>
  )
}

function ResultBlock({ student }: { student: StudentWithName }): JSX.Element {
  const subjects = mockResults(student.id)
  return (
    <EdvanceCard variant="hero-parent" className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
        Mastery-Übersicht
      </h3>
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Initialdiagnostik vom {new Date().toLocaleDateString('de-DE')}
      </p>
      <div className="mt-2 flex flex-col gap-3">
        {subjects.map((s) => (
          <div key={s.subject} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-sm text-[var(--color-text-secondary)]">{s.subject}</span>
            <div className="flex-1">
              <MasteryBar score={s.score} showLabel size="sm" />
            </div>
            <StageBadge stage={masteryStage(s.score)} />
          </div>
        ))}
      </div>
    </EdvanceCard>
  )
}

function StageBadge({ stage }: { stage: MasteryStage }): JSX.Element {
  const map: Record<
    MasteryStage,
    'mastery-introduced' | 'mastery-developing' | 'mastery-progressing' | 'mastery-proficient' | 'mastery-mastered'
  > = {
    introduced:  'mastery-introduced',
    developing:  'mastery-developing',
    progressing: 'mastery-progressing',
    proficient:  'mastery-proficient',
    mastered:    'mastery-mastered',
  }
  const labels: Record<MasteryStage, string> = {
    introduced:  'Einführung',
    developing:  'In Entwicklung',
    progressing: 'Fortschreitend',
    proficient:  'Geübt',
    mastered:    'Gemeistert',
  }
  return <EdvanceBadge variant={map[stage]}>{labels[stage]}</EdvanceBadge>
}

function mockResults(studentId: string): Array<{ subject: string; score: number }> {
  // Deterministischer Hash → Demo-Werte
  let h = 0
  for (let i = 0; i < studentId.length; i++) {
    h = (h * 31 + studentId.charCodeAt(i)) & 0xffff
  }
  return [
    { subject: 'Mathematik',  score: 30 + (h % 60) },
    { subject: 'Deutsch',     score: 40 + ((h >> 4) % 50) },
    { subject: 'Englisch',    score: 50 + ((h >> 8) % 40) },
    { subject: 'Naturwiss.',  score: 30 + ((h >> 12) % 55) },
  ]
}
