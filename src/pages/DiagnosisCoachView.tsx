// CoachView for DiagnosisSession – extracted to stay within 400-line limit.
import { Link, useNavigate } from 'react-router-dom'
import { useDiagnosis } from '@/context/DiagnosisContext'
import { useAuth } from '@/hooks/useAuth'
import { createScreeningRating } from '@/lib/supabase/screeningRatings'
import { Button } from '@/components/ui/button'
import { Lightbulb, Clock, Pencil, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { ProgressBar } from './DiagnosisSession'

const RATINGS: { rating: 1 | 2 | 3 | 4; label: string; sub: string; color: string; dark: string }[] = [
  {
    rating: 4,
    label: 'Korrekt & selbständig',
    sub: 'L4',
    color: 'var(--success)',
    dark: 'var(--success-dark)',
  },
  {
    rating: 3,
    label: 'Korrekt mit Zögern',
    sub: 'L3',
    color: 'var(--primary)',
    dark: 'var(--primary-shadow)',
  },
  {
    rating: 2,
    label: 'Ansatz gut, Fehler',
    sub: 'L3-4',
    color: 'var(--warning)',
    dark: 'var(--warning-dark)',
  },
  {
    rating: 1,
    label: 'Falsch / kein Ansatz',
    sub: 'L1-2',
    color: 'var(--destructive)',
    dark: 'var(--destructive-dark)',
  },
]

function CoachInfoBox({
  icon,
  title,
  color,
  bg,
  text,
}: {
  icon: React.ReactNode
  title: string
  color: string
  bg: string
  text: string
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: bg, border: `2px solid color-mix(in srgb, ${color} 25%, transparent)` }}
    >
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">{text}</p>
    </div>
  )
}

function BehaviorBadge({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        color: 'var(--foreground)',
      }}
    >
      {icon}
      {label}
    </span>
  )
}

export function CoachView() {
  const { state, setCoachRating, resetSession } = useDiagnosis()
  const { user } = useAuth()
  const navigate = useNavigate()
  const task = state.tasks[state.currentIndex]
  const currentSnapshot = state.snapshots[state.currentIndex]

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

      {/* Coach Helper Boxes */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <CoachInfoBox
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="Musterlösung"
          color="var(--success)"
          bg="color-mix(in srgb, var(--success) 8%, transparent)"
          text={task.solution}
        />
        <CoachInfoBox
          icon={<AlertCircle className="h-4 w-4" />}
          title="Typische Fehler"
          color="var(--warning-dark)"
          bg="color-mix(in srgb, var(--warning) 8%, transparent)"
          text={task.common_errors}
        />
        <CoachInfoBox
          icon={<Lightbulb className="h-4 w-4" />}
          title="Coach-Hinweis"
          color="var(--primary)"
          bg="color-mix(in srgb, var(--primary) 8%, transparent)"
          text={task.coach_hint}
        />
      </div>

      {/* Schülerantwort */}
      <div
        className="rounded-3xl bg-card p-6 mb-4"
        style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Antwort des Schülers</p>
        {currentSnapshot ? (
          <>
            <pre
              className="whitespace-pre-wrap font-mono text-sm font-medium text-foreground bg-background rounded-xl p-4"
              style={{ border: '2px solid var(--border)' }}
            >
              {currentSnapshot.answer_text}
            </pre>

            {/* Live-Verhaltensdaten */}
            <div className="mt-4 flex flex-wrap gap-2">
              <BehaviorBadge
                icon={<Clock className="h-3 w-3" />}
                label={`Bedenkzeit ${(currentSnapshot.thinking_time_ms / 1000).toFixed(1)}s`}
              />
              <BehaviorBadge
                icon={<Clock className="h-3 w-3" />}
                label={`Dauer ${(currentSnapshot.task_duration_ms / 1000).toFixed(1)}s`}
              />
              <BehaviorBadge
                icon={<Pencil className="h-3 w-3" />}
                label={`${currentSnapshot.revision_count} Revisionen`}
              />
              {currentSnapshot.rewrite_count > 0 && (
                <BehaviorBadge label={`${currentSnapshot.rewrite_count} Rewrites`} />
              )}
              {currentSnapshot.hint_used && (
                <BehaviorBadge icon={<Lightbulb className="h-3 w-3" />} label="Hint genutzt" />
              )}
              <BehaviorBadge label={`${currentSnapshot.answer_length} Zeichen`} />
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-background p-6 text-center" style={{ border: '2px dashed var(--border)' }}>
            <p className="text-sm font-semibold text-muted">Schüler arbeitet noch …</p>
          </div>
        )}
      </div>

      {/* Bewertung */}
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
