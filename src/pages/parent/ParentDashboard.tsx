import { useEffect, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { User, FileText, CalendarDays, MessageSquare, GraduationCap } from 'lucide-react'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import {
  EdvanceCard,
  EdvanceBadge,
  EmptyState,
  LoadingPulse,
  MasteryBar,
  StreakPill,
} from '@/components/edvance'
import { DashboardTiles } from '@/components/edvance/DashboardTiles'
import { useAuth } from '@/hooks/useAuth'
import { listStudentsWithName } from '@/lib/supabase/students'
import { getStudentProgress } from '@/lib/supabase/progress'
import { listReportsForStudent } from '@/lib/supabase/parentReports'
import type { ParentReport, StudentProgress, StudentWithName } from '@/types'

type ChildVM = {
  student: StudentWithName
  progress: StudentProgress | null
  reports: ParentReport[]
}

/**
 * Eltern-Energie (DESIGN_SYSTEM.md §5.7):
 * - Animationen: ease-out, 150 ms — KEIN Bounce
 * - Keine Glaseffekte, kein student-hero Verlauf
 * - Grün = success-eltern / success-eltern-light (lebendig, warm)
 * - Rot = error-gap / error-gap-light (leise, informativ)
 */
export function ParentDashboard(): JSX.Element {
  const { user } = useAuth()
  const [children, setChildren] = useState<ChildVM[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void (async () => {
      // RLS filtert students auf die eigenen Kinder.
      const { data: students, error: sErr } = await listStudentsWithName()
      if (cancelled) return
      if (sErr) {
        setError(sErr)
        setLoading(false)
        return
      }
      const vms: ChildVM[] = []
      for (const student of students ?? []) {
        const [{ data: progress }, { data: reports }] = await Promise.all([
          getStudentProgress(student.id),
          listReportsForStudent(student.id),
        ])
        vms.push({ student, progress, reports: reports ?? [] })
      }
      if (!cancelled) {
        setChildren(vms)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <EdvanceNavbar subtitle="Eltern-Dashboard" sticky />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mein Kind</h1>

        {error && <p className="text-sm text-[var(--color-error-gap)]">{error}</p>}

        {loading ? (
          <LoadingPulse type="list" lines={4} />
        ) : children.length === 0 ? (
          <EmptyState
            icon="👨‍👩‍👧"
            title="Noch keine Daten"
            description="Sobald dein Kind angelegt ist, erscheinen hier Fortschritt und Reports."
          />
        ) : (
          <>
            {children.length > 1 && (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  Schnellzugriff
                </h2>
                <DashboardTiles
                  tiles={children.map(({ student }) => ({
                    to: `#child-${student.id}`,
                    anchor: true,
                    icon: <User className="h-5 w-5" />,
                    title: student.full_name ?? 'Unbenannt',
                    description: 'Fortschritt & Reports ansehen',
                  }))}
                />
              </>
            )}
            {children.map((vm) => (
              <ChildSection key={vm.student.id} vm={vm} />
            ))}
          </>
        )}
      </main>
    </div>
  )
}

function ChildSection({ vm }: { vm: ChildVM }): JSX.Element {
  const { student, progress, reports } = vm
  const presenceWeeks = progress?.presence_streak_weeks ?? 0
  const homeSessions = progress?.home_streak_sessions ?? 0
  const multiplier = progress?.presence_streak_multiplier ?? 1.0

  return (
    <div id={`child-${student.id}`} className="scroll-mt-20 flex flex-col gap-4">
      {/* Header-Karte: Kind-Info + Level + Streaks */}
      <EdvanceCard variant="hero-parent" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              {student.full_name ?? 'Unbenannt'}
            </h2>
            {student.class_level && (
              <p className="text-xs text-[var(--color-text-tertiary)]">Klasse {student.class_level}</p>
            )}
          </div>
          <EdvanceBadge variant="primary">Level {progress?.level ?? 1}</EdvanceBadge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StreakPill variant="presence" count={presenceWeeks} multiplier={multiplier} />
          <StreakPill variant="home" count={homeSessions} />
          <span className="ml-auto text-sm font-semibold text-[var(--color-text-secondary)]">
            {(progress?.xp_total ?? 0).toLocaleString('de-DE')} XP
          </span>
        </div>
      </EdvanceCard>

      {/* Mastery-Übersicht: Reihe pro Fach (Platzhalter — echte Daten kommen via Screening-Lib) */}
      <EdvanceCard>
        <SectionLabel icon={<GraduationCap className="h-3.5 w-3.5" />} label="Lernfortschritt" />
        <div className="mt-4 flex flex-col gap-3">
          {SAMPLE_SUBJECTS.map((s) => (
            <div key={s.subject} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-[var(--color-text-secondary)]">{s.subject}</span>
              <div className="flex-1">
                <MasteryBar score={s.score} showLabel size="sm" />
              </div>
            </div>
          ))}
        </div>
      </EdvanceCard>

      {/* Report-Sektionen: 4 Bereiche, jede als eigene Karte */}
      <SectionLabel icon={<FileText className="h-3.5 w-3.5" />} label="Reports" wrapperClassName="mt-2" />
      {reports.length === 0 ? (
        <EdvanceCard>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Noch kein veröffentlichter Report. Der Coach erstellt monatlich einen.
          </p>
        </EdvanceCard>
      ) : (
        reports.map((r) => <ReportCard key={r.id} report={r} />)
      )}

      <Link
        to="/parent/screening"
        className="self-start text-sm font-semibold text-[var(--color-primary)] hover:underline"
      >
        → Screening-Report ansehen
      </Link>
    </div>
  )
}

function ReportCard({ report }: { report: ParentReport }): JSX.Element {
  return (
    <EdvanceCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {new Date(report.period_start).toLocaleDateString('de-DE')} –{' '}
          {new Date(report.period_end).toLocaleDateString('de-DE')}
        </p>
        <EdvanceBadge variant={report.status === 'published' ? 'strength' : 'muted'}>
          {report.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
        </EdvanceBadge>
      </div>

      <ReportSection icon={<GraduationCap className="h-3.5 w-3.5" />} label="Lernfortschritt">
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {String((report.summary as Record<string, unknown> | null)?.['learning_progress'] ?? '—')}
        </p>
      </ReportSection>

      <ReportSection icon={<CalendarDays className="h-3.5 w-3.5" />} label="Anwesenheit">
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {String((report.summary as Record<string, unknown> | null)?.['attendance'] ?? '—')}
        </p>
      </ReportSection>

      <ReportSection icon={<MessageSquare className="h-3.5 w-3.5" />} label="Eingriffe">
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {String((report.summary as Record<string, unknown> | null)?.['interventions'] ?? '—')}
        </p>
      </ReportSection>

      {report.coach_note && (
        <blockquote className="border-l-4 border-l-[var(--color-success-eltern)] pl-3 py-1">
          <p className="text-sm italic leading-relaxed text-[var(--color-text-secondary)]">
            {report.coach_note}
          </p>
        </blockquote>
      )}
    </EdvanceCard>
  )
}

function SectionLabel({
  icon,
  label,
  wrapperClassName,
}: {
  icon: JSX.Element
  label: string
  wrapperClassName?: string
}): JSX.Element {
  return (
    <div className={`flex items-center gap-2 ${wrapperClassName ?? ''}`}>
      <span className="text-[var(--color-text-tertiary)]">{icon}</span>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
        {label}
      </h3>
    </div>
  )
}

function ReportSection({
  icon,
  label,
  children,
}: {
  icon: JSX.Element
  label: string
  children: JSX.Element
}): JSX.Element {
  return (
    <div>
      <SectionLabel icon={icon} label={label} />
      <div className="mt-1">{children}</div>
    </div>
  )
}

/**
 * Placeholder — sobald Mastery pro Fach im Backend verfügbar ist, ersetzt
 * das `getMasteryBySubject(studentId)` o.ä. aus der Screening-Lib.
 */
const SAMPLE_SUBJECTS: Array<{ subject: string; score: number }> = [
  { subject: 'Mathematik',  score: 72 },
  { subject: 'Deutsch',     score: 58 },
  { subject: 'Englisch',    score: 85 },
]
