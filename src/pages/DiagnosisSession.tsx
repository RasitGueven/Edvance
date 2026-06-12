import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDiagnosis } from '@/context/DiagnosisContext'
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker'
import { useAuth } from '@/hooks/useAuth'
import { persistBehaviorSnapshot } from '@/lib/supabase/behavior'
import { Button } from '@/components/ui/button'
import type { BehaviorSnapshot } from '@/types/diagnosis'
import { Lightbulb } from 'lucide-react'
import { SetupScreen } from './DiagnosisSetupScreen'
import { CoachView } from './DiagnosisCoachView'

// ── Header ────────────────────────────────────────────────────────────────────

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

// ── Progress bar ──────────────────────────────────────────────────────────────

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Aufgabe {current + 1} von {total}
        </p>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">{Math.round(pct)} %</p>
      </div>
      <div className="h-3 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%)',
          }}
        />
      </div>
    </div>
  )
}

// ── Student View ──────────────────────────────────────────────────────────────

function StudentView() {
  const { state, submitAnswer, recordSnapshotId } = useDiagnosis()
  const { user } = useAuth()
  const tracker = useBehaviorTracker()
  const [answer, setAnswer] = useState('')
  const [hintRequested, setHintRequested] = useState(false)
  const startedTaskRef = useRef<number | null>(null)

  const task = state.tasks[state.currentIndex]

  // Start tracking exactly once per task — wenn die Aufgabe wechselt UND nicht gerade auf Coach gewartet wird
  useEffect(() => {
    if (state.finished) return
    if (state.awaitingCoachRating) return
    if (startedTaskRef.current === state.currentIndex) return
    startedTaskRef.current = state.currentIndex
    setAnswer('')
    setHintRequested(false)
    tracker.startTracking()
  }, [state.currentIndex, state.awaitingCoachRating, state.finished, tracker])

  // ── Finished screen ─────────────────────────────────────────
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

  // ── Transition-Screen während Coach bewertet ────────────────
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
    // DB-Modus (Screening): Snapshot sofort persistieren (append-only)
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
            💡 Lies die Aufgabe nochmal in Ruhe durch. Schreib auf, was du schon weißt.
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
