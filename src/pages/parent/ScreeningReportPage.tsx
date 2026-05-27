import { useEffect, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, AlertTriangle, Sparkles } from 'lucide-react'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import {
  EdvanceCard,
  EdvanceBadge,
  EmptyState,
  LoadingPulse,
  MasteryBar,
} from '@/components/edvance'
import { useAuth } from '@/hooks/useAuth'
import { listStudentsWithName } from '@/lib/supabase/students'
import { masteryStage, type MasteryStage } from '@/lib/mastery'
import type { StudentWithName } from '@/types'

/**
 * Screening-Report — Eltern-Sicht.
 * - Mastery-Stufen: 5-Stufen-Logik via masteryStage()
 * - Stärken-Sektion: accent="strength" Cards (lebendiges Grün)
 * - Lücken-Sektion: accent="gap" Cards (leises Rot — informativ, nicht alarmierend)
 * - Coach-Einschätzung als Zitat-Block ohne Box-Schatten
 *
 * Datenquelle: Sobald Screening-Resultate ein einheitliches Output-Schema haben
 * (Mastery pro Mikro-Skill mit `score: 0-100`), wird der MOCK-Block durch einen
 * echten `getScreeningResultsForStudent()`-Aufruf ersetzt.
 */
export function ScreeningReportPage(): JSX.Element {
  const { user } = useAuth()
  const [children, setChildren] = useState<StudentWithName[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void (async () => {
      const { data, error: sErr } = await listStudentsWithName()
      if (cancelled) return
      if (sErr) setError(sErr)
      else setChildren(data ?? [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <EdvanceNavbar subtitle="Screening-Report" sticky />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Screening-Report</h1>
          <Link
            to="/parent"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Link>
        </div>

        {error && <p className="text-sm text-[var(--color-error-gap)]">{error}</p>}

        {loading ? (
          <LoadingPulse type="card" />
        ) : children.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Noch kein Screening"
            description="Sobald die Initialdiagnostik abgeschlossen ist, erscheint hier der Bericht."
          />
        ) : (
          children.map((child) => <ScreeningChildBlock key={child.id} student={child} />)
        )}
      </main>
    </div>
  )
}

function ScreeningChildBlock({ student }: { student: StudentWithName }): JSX.Element {
  // MOCK: Bis Screening-Ergebnis-Schema steht, werden Stärken/Lücken hier
  // demonstrativ aufgebaut. Phase 5 baut nur die Visualisierung.
  const sample = mockScreeningResult(student.id)

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {student.full_name ?? 'Unbenannt'}
          {student.class_level ? ` · Klasse ${student.class_level}` : ''}
        </h2>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
          Initialdiagnostik vom {sample.dateDe}
        </p>
      </header>

      {/* Mastery-Übersicht — 5 Stufen */}
      <EdvanceCard variant="hero-parent">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
          Mastery-Übersicht
        </h3>
        <div className="flex flex-col gap-3">
          {sample.subjects.map((s) => (
            <div key={s.subject} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-[var(--color-text-secondary)]">{s.subject}</span>
              <div className="flex-1">
                <MasteryBar score={s.score} showLabel size="sm" />
              </div>
              <StageBadge stage={masteryStage(s.score)} />
            </div>
          ))}
        </div>
      </EdvanceCard>

      {/* Stärken */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-success-eltern)] mb-2 inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Stärken
        </h3>
        <div className="flex flex-col gap-2">
          {sample.strengths.map((s, idx) => (
            <EdvanceCard key={idx} accent="strength" className="py-4">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{s.title}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{s.detail}</p>
            </EdvanceCard>
          ))}
        </div>
      </div>

      {/* Lücken (leise) */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-error-gap)] mb-2 inline-flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" /> Lücken
        </h3>
        <div className="flex flex-col gap-2">
          {sample.gaps.map((g, idx) => (
            <EdvanceCard key={idx} accent="gap" className="py-4">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{g.title}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{g.detail}</p>
            </EdvanceCard>
          ))}
        </div>
      </div>

      {/* Coach-Einschätzung als Zitat-Block ohne Box-Schatten */}
      {sample.coachNote && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2 inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Coach-Einschätzung
          </h3>
          <blockquote className="border-l-4 border-l-[var(--color-primary)] pl-4 py-1">
            <p className="text-sm italic leading-relaxed text-[var(--color-text-secondary)]">
              {sample.coachNote.quote}
            </p>
            <footer className="mt-2 text-xs text-[var(--color-text-tertiary)]">— {sample.coachNote.author}</footer>
          </blockquote>
        </div>
      )}
    </section>
  )
}

function StageBadge({ stage }: { stage: MasteryStage }): JSX.Element {
  const variant: Record<MasteryStage, 'mastery-introduced' | 'mastery-developing' | 'mastery-progressing' | 'mastery-proficient' | 'mastery-mastered'> = {
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
  return <EdvanceBadge variant={variant[stage]}>{labels[stage]}</EdvanceBadge>
}

function mockScreeningResult(studentId: string): {
  dateDe: string
  subjects: Array<{ subject: string; score: number }>
  strengths: Array<{ title: string; detail: string }>
  gaps: Array<{ title: string; detail: string }>
  coachNote: { quote: string; author: string } | null
} {
  void studentId
  return {
    dateDe: new Date().toLocaleDateString('de-DE'),
    subjects: [
      { subject: 'Mathematik', score: 72 },
      { subject: 'Deutsch',    score: 58 },
      { subject: 'Englisch',   score: 85 },
    ],
    strengths: [
      { title: 'Bruchrechnen sicher', detail: 'Erweitern, Kürzen, Vergleichen auf Klasse-7-Niveau routiniert.' },
      { title: 'Textverständnis Englisch', detail: 'Sinnentnahme aus mittelschweren Texten ohne Lücken.' },
    ],
    gaps: [
      { title: 'Lineare Funktionen', detail: 'Schwierigkeiten bei Steigung & y-Achsen-Abschnitt aus Tabelle.' },
      { title: 'Rechtschreibung Komposita', detail: 'Zusammen-/Getrenntschreibung mit 38 % korrekt.' },
    ],
    coachNote: {
      quote:
        'Wir setzen den Fokus die kommenden 4 Wochen auf lineare Funktionen — ein klar abgegrenzter Block, der schnell sichtbare Erfolge bringt.',
      author: 'Sarah K., Coach',
    },
  }
}
