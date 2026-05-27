import { useEffect, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, CheckCircle2 } from 'lucide-react'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import {
  EdvanceCard,
  EdvanceBadge,
  EmptyState,
  LoadingPulse,
} from '@/components/edvance'
import { listStudentsWithName } from '@/lib/supabase/students'
import {
  listReportsForStudent,
  publishReport,
  saveReportDraft,
} from '@/lib/supabase/parentReports'
import type { ParentReport, StudentWithName } from '@/types'

/**
 * Coach-Einschätzung verfassen und freigeben.
 * Pro Schüler: Liste vorhandener Reports + Editor für neuen Entwurf.
 */
export function ReportsPage(): JSX.Element {
  const [students, setStudents] = useState<StudentWithName[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reports, setReports] = useState<ParentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    if (!activeId) return
    let cancelled = false
    void (async () => {
      const { data } = await listReportsForStudent(activeId)
      if (!cancelled) setReports(data ?? [])
    })()
    return () => {
      cancelled = true
    }
  }, [activeId])

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <EdvanceNavbar subtitle="Reports verfassen" sticky />
      <main className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reports</h1>
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
            icon="📝"
            title="Keine Schüler zugewiesen"
            description="Sobald dir Schüler zugeordnet sind, kannst du hier Reports schreiben."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
            <StudentList students={students} activeId={activeId} onSelect={setActiveId} />
            {activeId && (
              <ReportEditor
                studentId={activeId}
                existingReports={reports}
                saving={saving}
                onSubmit={async (input, publish) => {
                  setSaving(true)
                  const { data: draft, error: dErr } = await saveReportDraft(input)
                  if (dErr || !draft) {
                    setError(dErr ?? 'Speichern fehlgeschlagen')
                    setSaving(false)
                    return
                  }
                  if (publish) {
                    const { error: pErr } = await publishReport(draft.id)
                    if (pErr) {
                      setError(pErr)
                      setSaving(false)
                      return
                    }
                  }
                  const { data: list } = await listReportsForStudent(activeId)
                  setReports(list ?? [])
                  setSaving(false)
                }}
              />
            )}
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
            className={`rounded-[var(--radius-md)] border px-3 py-2 text-left transition-colors ${
              isActive
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-primary-light)]'
            }`}
          >
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{s.full_name ?? 'Unbenannt'}</p>
            {s.class_level && (
              <p className="text-xs text-[var(--color-text-tertiary)]">Klasse {s.class_level}</p>
            )}
          </button>
        )
      })}
    </aside>
  )
}

function ReportEditor({
  studentId,
  existingReports,
  saving,
  onSubmit,
}: {
  studentId: string
  existingReports: ParentReport[]
  saving: boolean
  onSubmit: (
    input: {
      student_id: string
      period_start: string
      period_end: string
      summary: Record<string, unknown>
      coach_note: string | null
    },
    publish: boolean,
  ) => Promise<void>
}): JSX.Element {
  const today = new Date()
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const periodEnd = today.toISOString().slice(0, 10)
  const [learningProgress, setLearningProgress] = useState('')
  const [attendance, setAttendance] = useState('')
  const [interventions, setInterventions] = useState('')
  const [coachNote, setCoachNote] = useState('')

  return (
    <section className="flex flex-col gap-4">
      <EdvanceCard variant="hero-parent" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            Neuer Report ({periodStart} → {periodEnd})
          </h3>
          <Pencil className="h-4 w-4 text-[var(--color-text-tertiary)]" />
        </div>

        <Field label="Lernfortschritt" value={learningProgress} onChange={setLearningProgress} />
        <Field label="Anwesenheit" value={attendance} onChange={setAttendance} />
        <Field label="Eingriffe" value={interventions} onChange={setInterventions} />
        <Field
          label="Coach-Einschätzung (persönlich, mit Namen)"
          value={coachNote}
          onChange={setCoachNote}
        />

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onSubmit(
                {
                  student_id: studentId,
                  period_start: periodStart,
                  period_end: periodEnd,
                  summary: { learning_progress: learningProgress, attendance, interventions },
                  coach_note: coachNote.trim() || null,
                },
                false,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)]"
          >
            Als Entwurf speichern
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onSubmit(
                {
                  student_id: studentId,
                  period_start: periodStart,
                  period_end: periodEnd,
                  summary: { learning_progress: learningProgress, attendance, interventions },
                  coach_note: coachNote.trim() || null,
                },
                true,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-bg-surface)] hover:bg-[var(--color-primary-hover)]"
          >
            <CheckCircle2 className="h-4 w-4" /> Freigeben
          </button>
        </div>
      </EdvanceCard>

      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mt-2">
        Bisherige Reports
      </h3>
      {existingReports.length === 0 ? (
        <p className="text-sm text-[var(--color-text-tertiary)]">Noch keine Reports vorhanden.</p>
      ) : (
        existingReports.map((r) => (
          <EdvanceCard key={r.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {new Date(r.period_start).toLocaleDateString('de-DE')} –{' '}
                {new Date(r.period_end).toLocaleDateString('de-DE')}
              </p>
              {r.published_at && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  Veröffentlicht am {new Date(r.published_at).toLocaleDateString('de-DE')}
                </p>
              )}
            </div>
            <EdvanceBadge variant={r.status === 'published' ? 'strength' : 'muted'}>
              {r.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
            </EdvanceBadge>
          </EdvanceCard>
        ))
      )}
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
      />
    </div>
  )
}
