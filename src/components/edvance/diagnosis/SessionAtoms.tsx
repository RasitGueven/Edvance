import { Clock, Pencil, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react'

// ── MinimalHeader ─────────────────────────────────────────────────────────────

export function MinimalHeader({ subtitle }: { subtitle: string }) {
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

// ── ProgressBar ───────────────────────────────────────────────────────────────

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

// ── CoachInfoBox ──────────────────────────────────────────────────────────────

export function CoachInfoBox({
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

// ── BehaviorBadge ─────────────────────────────────────────────────────────────

export function BehaviorBadge({ icon, label }: { icon?: React.ReactNode; label: string }) {
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

// ── CoachHelperBoxes ──────────────────────────────────────────────────────────

export function CoachHelperBoxes({
  solution,
  commonErrors,
  coachHint,
}: {
  solution: string
  commonErrors: string
  coachHint: string
}) {
  return (
    <div className="grid grid-cols-1 gap-3 mb-4">
      <CoachInfoBox
        icon={<CheckCircle2 className="h-4 w-4" />}
        title="Musterlösung"
        color="var(--success)"
        bg="color-mix(in srgb, var(--success) 8%, transparent)"
        text={solution}
      />
      <CoachInfoBox
        icon={<AlertCircle className="h-4 w-4" />}
        title="Typische Fehler"
        color="var(--warning-dark)"
        bg="color-mix(in srgb, var(--warning) 8%, transparent)"
        text={commonErrors}
      />
      <CoachInfoBox
        icon={<Lightbulb className="h-4 w-4" />}
        title="Coach-Hinweis"
        color="var(--primary)"
        bg="color-mix(in srgb, var(--primary) 8%, transparent)"
        text={coachHint}
      />
    </div>
  )
}

// ── StudentAnswerPanel ────────────────────────────────────────────────────────

import type { BehaviorSnapshot } from '@/types/diagnosis'

export function StudentAnswerPanel({ snapshot }: { snapshot: BehaviorSnapshot | undefined }) {
  return (
    <div
      className="rounded-3xl bg-card p-6 mb-4"
      style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Antwort des Schülers</p>
      {snapshot ? (
        <>
          <pre
            className="whitespace-pre-wrap font-mono text-sm font-medium text-foreground bg-background rounded-xl p-4"
            style={{ border: '2px solid var(--border)' }}
          >
            {snapshot.answer_text}
          </pre>

          <div className="mt-4 flex flex-wrap gap-2">
            <BehaviorBadge
              icon={<Clock className="h-3 w-3" />}
              label={`Bedenkzeit ${(snapshot.thinking_time_ms / 1000).toFixed(1)}s`}
            />
            <BehaviorBadge
              icon={<Clock className="h-3 w-3" />}
              label={`Dauer ${(snapshot.task_duration_ms / 1000).toFixed(1)}s`}
            />
            <BehaviorBadge
              icon={<Pencil className="h-3 w-3" />}
              label={`${snapshot.revision_count} Revisionen`}
            />
            {snapshot.rewrite_count > 0 && (
              <BehaviorBadge label={`${snapshot.rewrite_count} Rewrites`} />
            )}
            {snapshot.hint_used && (
              <BehaviorBadge icon={<Lightbulb className="h-3 w-3" />} label="Hint genutzt" />
            )}
            <BehaviorBadge label={`${snapshot.answer_length} Zeichen`} />
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-background p-6 text-center" style={{ border: '2px dashed var(--border)' }}>
          <p className="text-sm font-semibold text-muted">Schüler arbeitet noch …</p>
        </div>
      )}
    </div>
  )
}
