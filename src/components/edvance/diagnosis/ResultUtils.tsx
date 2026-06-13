// Shared constants, helpers, and small presentational atoms for DiagnosisResult.

import type { BehaviorAnalysis } from '@/types/diagnosis'

export const DIAGNOSIS_TO_COMPETENCY: Record<string, string> = {
  'Rationale Zahlen': 'Zahl & Rechnen',
  'Terme & Gleichungen': 'Algebra & Funktionen',
  'Proportionalität': 'Sachrechnen & Modellieren',
  'Prozentrechnung': 'Zahl & Rechnen',
  'Lineare Funktionen': 'Algebra & Funktionen',
}

export const SIGNAL_LABELS: Record<
  BehaviorAnalysis['mastery_signal'],
  { label: string; color: string; emoji: string }
> = {
  secure:     { label: 'Sicher',         color: 'var(--success)',     emoji: '✓' },
  developing: { label: 'In Entwicklung', color: 'var(--primary)',     emoji: '↗' },
  gap:        { label: 'Lücke',          color: 'var(--destructive)', emoji: '✗' },
  guessing:   { label: 'Geraten',        color: 'var(--warning)',     emoji: '?' },
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDuration(ms: number) {
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min === 0) return `${sec}s`
  return `${min}m ${sec}s`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Small presentational atoms ────────────────────────────────────────────────

export function FlagTag({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'warning' | 'success' }) {
  const colors = {
    primary: { bg: 'var(--primary)', tag: 'color-mix(in srgb, var(--primary) 12%, transparent)' },
    warning: { bg: 'var(--warning)', tag: 'color-mix(in srgb, var(--warning) 12%, transparent)' },
    success: { bg: 'var(--success)', tag: 'color-mix(in srgb, var(--success) 12%, transparent)' },
  }[tone]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{
        background: colors.tag,
        color: colors.bg,
        border: `1.5px solid color-mix(in srgb, ${colors.bg} 25%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: colors.bg }} />
      {label}
    </span>
  )
}

export function SmallBadge({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-muted"
      style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
    >
      {icon}
      {text}
    </span>
  )
}

export function KV({ k, v }: { k: string; v: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg bg-card px-2.5 py-1.5"
      style={{ border: '1px solid var(--border)' }}
    >
      <span className="text-muted">{k}</span>
      <span className="text-foreground font-black">{v}</span>
    </div>
  )
}

export function MiniMetric({
  label,
  value,
  color,
  inverted = false,
}: {
  label: string
  value: number
  color: string
  inverted?: boolean
}) {
  const display = inverted
    ? value > 60 ? 'var(--destructive)' : value > 30 ? 'var(--warning)' : 'var(--success)'
    : value > 65 ? color : value > 35 ? 'var(--warning)' : 'var(--destructive)'
  return (
    <div className="rounded-lg bg-card p-2 text-center" style={{ border: '1px solid var(--border)' }}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-base font-black" style={{ color: display }}>
        {value}
      </p>
    </div>
  )
}

export function SectionHeader({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode
  label: string
  description?: string
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary"
        style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
      >
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-foreground">{label}</h2>
        {description && <p className="text-xs font-semibold text-muted mt-0.5">{description}</p>}
      </div>
    </div>
  )
}
