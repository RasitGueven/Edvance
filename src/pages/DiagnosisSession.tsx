import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDiagnosis } from '@/context/DiagnosisContext'
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker'
import { useAuth } from '@/hooks/useAuth'
import { persistBehaviorSnapshot } from '@/lib/supabase/behavior'
import { createScreeningRating } from '@/lib/supabase/screeningRatings'
import { Button } from '@/components/ui/button'
import type { BehaviorSnapshot } from '@/types/diagnosis'
import { Lightbulb, ArrowRight } from 'lucide-react'
import {
  MinimalHeader,
  ProgressBar,
  CoachHelperBoxes,
  StudentAnswerPanel,
} from '@/components/edvance/diagnosis/SessionAtoms'
import { SetupScreen } from '@/components/edvance/diagnosis/SetupScreen'

// ── Rating config ─────────────────────────────────────────────────────────────

const RATINGS: { rating: 1 | 2 | 3 | 4; label: string; sub: string; color: string; dark: string }[] = [
  { rating: 4, label: 'Korrekt & selbständig', sub: 'L4',   color: 'var(--success)',     dark: 'var(--success-dark)' },
  { rating: 3, label: 'Korrekt mit Zögern',    sub: 'L3',   color: 'var(--primary)',     dark: 'var(--primary-shadow)' },
  { rating: 2, label: 'Ansatz gut, Fehler',     sub: 'L3-4', color: 'var(--warning)',     dark: 'var(--warning-dark)' },
  { rating: 1, label: 'Falsch / kein Ansatz',   sub: 'L1-2', color: 'var(--destructive)', dark: 'var(--destructive-dark)' },
]

// ── Student View ──────────────────────────────────────────────────────────────

function StudentView() {
  const { state, submitAnswer, recordSnapshotId } = useDiagnosis()
  const { user } = useAuth()
  const tracker = useBehaviorTracker()
  const [answer, setAnswer] = useState('')
  const [hintRequested, setHintRequested] = useState(false)
  const startedTaskRef = useRef<number | null>(null)

  const task = state.tasks[state.currentIndex]

  useEffect(() => {
    if (state.finished) return
    if (state.awaitingCoachRating) return
    if (startedTaskRef.current === state.currentIndex) return
    startedTaskRef.current = state.currentIndex
    setAnswer('')
    setHintRequested(false)
    tracker.startTracking()
  }, [state.currentIndex, state.awaitingCoachRating, state.finished, tracker])

  if (state.finished) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 flex flex-col items-center text-center">
        <div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl"
          style={{
            background: 'color-mix(in srgb, var(--success) 12%, transparent)',
            border: '2px solid var(--border)',
            borderBottomWidth: '4px',
          }}
        >
          🎉
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">Du hast es geschafft!</h1>
        <p className="mt-3 text-base font-semibold text-muted max-w-sm">
          Super Arbeit. Dein Coach geht gleich mit dir zusammen die Auswertung durch.
        </p>
      </main>
    )
  }

  if (!task) return null

  if (state.awaitingCoachRating) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 flex flex-col items-center text-center">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl animate-pulse"
          style={{
            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            border: '2px solid var(--border)',
            borderBottomWidth: '4px',
          }}
        >
          ⏳
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Danke!</h2>
        <p className="mt-2 text-base font-semibold text-muted">Gleich geht's weiter.</p>
      </main>
    )
  }

  const handleHint = () => {
    if (hintRequested) return
    setHintRequested(true)
    tracker.onHintRequested()
  }

  const handleSubmit = async () => {
    if (answer.trim().length === 0) return
    tracker.onLastKeystroke()
    const snapshot = tracker.getSnapshot(task.id, answer)
    const idx = state.currentIndex
    submitAnswer(snapshot)
    if (state.mode === 'db' && state.screeningTestId && user) {
      const { data } = await persistBehaviorSnapshot(
        task.id,
        user.id,
        snapshot,
        state.screeningTestId,
      )
      if (data) recordSnapshotId(idx, data.id)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <ProgressBar current={state.currentIndex} total={state.tasks.length} />

      <div
        className="rounded-3xl bg-card p-8"
        style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">{task.skill_cluster}</p>
        <h1 className="text-2xl font-black text-foreground tracking-tight leading-snug">
          {task.question}
        </h1>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="answer" className="text-xs font-bold uppercase tracking-wider text-muted">
            Deine Antwort
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={e => {
              setAnswer(e.target.value)
              tracker.onChange(e.target.value)
            }}
            onKeyDown={e => tracker.onKeyDown(e)}
            placeholder="Schreib hier deinen Rechenweg auf …"
            rows={6}
            className="w-full rounded-2xl border-2 border-border bg-card p-4 text-base font-medium text-foreground focus:border-primary focus:outline-none resize-none"
            style={{ borderBottomWidth: '4px', borderBottomColor: 'var(--border-strong)' }}
          />
        </div>

        {hintRequested && (
          <div
            className="mt-4 rounded-2xl px-4 py-3 text-sm font-medium"
            style={{
              background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
              border: '2px solid color-mix(in srgb, var(--warning) 30%, transparent)',
              color: 'var(--warning-dark)',
            }}
          >
            Lies die Aufgabe nochmal in Ruhe durch. Schreib auf, was du schon weißt.
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleHint}
            disabled={hintRequested}
            className="text-xs font-bold uppercase tracking-wider text-muted hover:text-warning disabled:opacity-50 flex items-center gap-1.5"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {hintRequested ? 'Hint angefordert' : 'Hint anfordern'}
          </button>
          <Button onClick={handleSubmit} disabled={answer.trim().length === 0}>
            Abschicken →
          </Button>
        </div>
      </div>
    </main>
  )
}

// ── Coach View ────────────────────────────────────────────────────────────────

function CoachView() {
  const { state, setCoachRating, resetSession } = useDiagnosis()
  const { user } = useAuth()
  const navigate = useNavigate()
  const task = state.tasks[state.currentIndex]
  const currentSnapshot = state.snapshots[state.currentIndex] as BehaviorSnapshot | undefined

  const rate = (rating: 1 | 2 | 3 | 4): void => {
    const idx = state.currentIndex
    const snapId = state.snapshotIds[idx]
    setCoachRating(rating)
    if (state.mode === 'db' && state.screeningTestId && snapId) {
      void createScreeningRating(
        snapId,
        state.screeningTestId,
        rating,
        user?.id ?? null,
      )
    }
  }

  if (state.finished) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 flex flex-col items-center text-center">
        <div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl"
          style={{
            background: 'color-mix(in srgb, var(--success) 12%, transparent)',
            border: '2px solid var(--border)',
            borderBottomWidth: '4px',
          }}
        >
          ✅
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Diagnose abgeschlossen</h1>
        <p className="mt-3 text-base font-semibold text-muted max-w-sm">
          Alle Aufgaben bewertet. Geh jetzt zur Auswertung.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate('/diagnosis/result')} size="lg">
            Auswertung öffnen →
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetSession()
              navigate('/diagnosis?view=student')
            }}
          >
            Neue Diagnose
          </Button>
        </div>
      </main>
    )
  }

  if (!task) return null

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <ProgressBar current={state.currentIndex} total={state.tasks.length} />

      <div
        className="rounded-3xl bg-card p-6 mb-4"
        style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {task.skill_cluster} · {task.skill_id}
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            ⏱ ~{task.estimated_minutes} Min
          </p>
        </div>
        <h1 className="text-xl font-black text-foreground leading-snug">{task.question}</h1>
      </div>

      <CoachHelperBoxes
        solution={task.solution}
        commonErrors={task.common_errors}
        coachHint={task.coach_hint}
      />

      <StudentAnswerPanel snapshot={currentSnapshot} />

      <div
        className="rounded-3xl bg-card p-6"
        style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Bewertung</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RATINGS.map(r => (
            <button
              key={r.rating}
              type="button"
              disabled={!currentSnapshot}
              onClick={() => rate(r.rating)}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-white font-bold transition-all active:translate-y-[2px] disabled:opacity-40 disabled:pointer-events-none"
              style={{
                background: r.color,
                borderBottom: `4px solid ${r.dark}`,
              }}
            >
              <span className="text-sm">{r.label}</span>
              <span className="text-xs font-black opacity-80">{r.sub}</span>
            </button>
          ))}
        </div>
        {!currentSnapshot && (
          <p className="mt-3 text-xs font-semibold text-muted">
            Warte bis der Schüler die Antwort abgeschickt hat.
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Link to="/diagnosis/result" className="text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground flex items-center gap-1">
          Auswertung anzeigen <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </main>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

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
