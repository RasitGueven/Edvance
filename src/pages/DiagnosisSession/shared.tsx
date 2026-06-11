// Shared sub-components for DiagnosisSession views.

import { Clock, Lightbulb, Pencil } from 'lucide-react'

// ── Header ────────────────────────────────────────────────────────────────────

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

// ── Progress Bar ──────────────────────────────────────────────────────────────

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

// ── Behavior Badge ────────────────────────────────────────────────────────────

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

// ── Coach Info Box ────────────────────────────────────────────────────────────

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

// Re-export icons used across views to avoid duplicate imports in each file.
export { Clock, Lightbulb, Pencil }
