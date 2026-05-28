import { useState } from 'react'
import { useDiagnosis, type DiagnosisState } from '@/context/DiagnosisContext'
import { useAuth } from '@/hooks/useAuth'
import { buildRunTasks, rebuildRunTasks } from '@/lib/screening/runtime'
import { getStudentByProfile } from '@/lib/supabase/students'
import {
  createScreeningTest,
  getActiveScreeningTest,
  getScreeningSnapshots,
} from '@/lib/supabase/screening'
import { getRatingsForTest } from '@/lib/supabase/screeningRatings'
import { Button } from '@/components/ui/button'
import type { OnboardingData } from '@/types'
import type { BehaviorSnapshot } from '@/types/diagnosis'

const SUBJECT_OPTIONS: { label: string; code: OnboardingData['subject'] }[] = [
  { label: 'Mathematik', code: 'MATH' },
  { label: 'Deutsch', code: 'GERMAN' },
  { label: 'Englisch', code: 'ENGLISH' },
]
const GRADES = Array.from({ length: 9 }, (_, i) => i + 5)
const NO_TASKS_MSG =
  'Keine diagnostischen Aufgaben in der Datenbank. Bitte Diagnostik-Content seeden.'

export function SetupScreen({
  view,
  screening = false,
}: {
  view: 'student' | 'coach'
  screening?: boolean
}) {
  const { startSession, startScreening, hydrate } = useDiagnosis()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [subject, setSubject] = useState<OnboardingData['subject']>('MATH')
  const [grade, setGrade] = useState<number>(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    const label =
      SUBJECT_OPTIONS.find(s => s.code === subject)?.label ?? 'Mathematik'

    if (!screening) {
      const { tasks, warnings } = await buildRunTasks({ grade, subject })
      setLoading(false)
      if (tasks.length === 0) {
        setError(warnings[0] ?? NO_TASKS_MSG)
        return
      }
      startSession({ studentName: name || 'Schüler', subject: label, tasks })
      return
    }

    if (!user) {
      setLoading(false)
      setError('Nicht eingeloggt.')
      return
    }
    const { data: student } = await getStudentByProfile(user.id)
    if (!student) {
      setLoading(false)
      setError('Kein Schülerprofil gefunden.')
      return
    }

    const { data: active } = await getActiveScreeningTest(student.id, label)
    if (active && active.generated_test) {
      const tasks = await rebuildRunTasks(active.generated_test)
      const { data: snaps } = await getScreeningSnapshots(active.id)
      const { data: ratings } = await getRatingsForTest(active.id)
      setLoading(false)
      if (tasks.length === 0) {
        setError('Screening hat keine Aufgaben.')
        return
      }
      const ratingBySnap = new Map(
        (ratings ?? []).map(r => [r.behavior_snapshot_id, r.rating]),
      )
      const snapshots: BehaviorSnapshot[] = []
      const snapshotIds: (string | null)[] = []
      ;(snaps ?? []).forEach((s, i) => {
        snapshots[i] = {
          ...(s as Omit<BehaviorSnapshot, 'coach_rating'>),
          coach_rating:
            (ratingBySnap.get(s.id) ?? null) as BehaviorSnapshot['coach_rating'],
        }
        snapshotIds[i] = s.id
      })
      const ratedCount = snapshots.filter(s => s.coach_rating != null).length
      const isFinished = ratedCount >= tasks.length
      const next: DiagnosisState = {
        studentName: name || 'Schüler',
        subject: label,
        date: active.created_at,
        currentIndex: isFinished ? tasks.length - 1 : ratedCount,
        awaitingCoachRating: snapshots.length > ratedCount && !isFinished,
        snapshots,
        tasks,
        coachNote: active.coach_note ?? '',
        finished: isFinished,
        startedAt: active.started_at,
        mode: 'db',
        screeningTestId: active.id,
        snapshotIds,
      }
      hydrate(next)
      return
    }

    const { tasks, test, warnings } = await buildRunTasks({
      grade: student.class_level ?? grade,
      subject,
    })
    if (tasks.length === 0 || !test) {
      setLoading(false)
      setError(warnings[0] ?? NO_TASKS_MSG)
      return
    }
    const { data: created, error: cErr } = await createScreeningTest({
      student_id: student.id,
      subject: label,
      generated_test: test,
      estimated_total_minutes: test.estimated_total_minutes,
    })
    setLoading(false)
    if (cErr || !created) {
      setError(cErr ?? 'Screening konnte nicht gestartet werden.')
      return
    }
    startScreening({
      studentName: name || 'Schüler',
      subject: label,
      tasks,
      screeningTestId: created.id,
    })
  }

  if (view === 'coach') {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <div
          className="rounded-3xl bg-card p-8"
          style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
        >
          <h1 className="text-2xl font-black text-foreground tracking-tight">Diagnose-Session</h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            Warte bis der Schüler die Diagnose startet. Dann erscheint die erste Aufgabe hier.
          </p>
          <div
            className="mt-6 rounded-2xl px-4 py-3 text-sm font-medium"
            style={{
              background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
              border: '2px solid color-mix(in srgb, var(--primary) 25%, transparent)',
              color: 'var(--primary)',
            }}
          >
            💡 Tipp: Schüler-Tablet öffnet <code>/diagnosis?view=student</code>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div
        className="rounded-3xl bg-card p-8"
        style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
      >
        <div className="flex justify-center mb-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-3xl text-3xl"
            style={{
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              border: '2px solid var(--border)',
              borderBottomWidth: '4px',
            }}
          >
            🎯
          </div>
        </div>
        <h1 className="text-center text-2xl font-black text-foreground tracking-tight">
          Bereit für die Diagnose?
        </h1>
        <p className="mt-2 text-center text-sm font-semibold text-muted">
          Du hast genug Zeit, Rechenweg ist erlaubt.
        </p>

        <label htmlFor="name" className="mt-6 block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
          Wie heißt du?
        </label>
        <input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Dein Vorname"
          className="w-full h-12 rounded-xl border-2 border-border bg-card px-4 text-base font-semibold text-foreground focus:border-primary focus:outline-none"
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Fach
            </label>
            <select
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value as OnboardingData['subject'])}
              className="w-full h-12 rounded-xl border-2 border-border bg-card px-3 text-base font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              {SUBJECT_OPTIONS.map(s => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="grade" className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Klasse
            </label>
            <select
              id="grade"
              value={grade}
              onChange={e => setGrade(Number(e.target.value))}
              className="w-full h-12 rounded-xl border-2 border-border bg-card px-3 text-base font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              {GRADES.map(g => (
                <option key={g} value={g}>
                  {g}. Klasse
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm font-semibold text-destructive">{error}</p>
        )}

        <Button
          onClick={start}
          disabled={!name.trim() || loading}
          size="lg"
          className="mt-5 w-full"
        >
          {loading ? 'Test wird erstellt …' : "Los geht's →"}
        </Button>
      </div>
    </main>
  )
}
