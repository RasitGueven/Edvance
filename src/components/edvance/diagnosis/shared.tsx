// Shared primitives used across diagnosis result sub-components.

import type { BehaviorAnalysis } from '@/types/diagnosis'

// ── Constants ─────────────────────────────────────────────────────────────────

export const SIGNAL_LABELS: Record<
  BehaviorAnalysis['mastery_signal'],
  { label: string; color: string; emoji: string }
> = {
  secure: { label: 'Sicher', color: 'var(--success)', emoji: '✓' },
  developing: { label: 'In Entwicklung', color: 'var(--primary)', emoji: '↗' },
  gap: { label: 'Lücke', color: 'var(--destructive)', emoji: '✗' },
  guessing: { label: 'Geraten', color: 'var(--warning)', emoji: '?' },
}

// ── Formatters ────────────────────────────────────────────────────────────────

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

// ── RadialGauge ───────────────────────────────────────────────────────────────

export function RadialGauge({
  value,
  color,
  size = 140,
  thickness = 12,
}: {
  value: number
  color: string
  size?: number
  thickness?: number
}) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--border)"
        strokeWidth={thickness}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={thickness}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ── GaugeCard ─────────────────────────────────────────────────────────────────

export function GaugeCard({
  icon,
  label,
  value,
  color,
  inverted = false,
  caption,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  inverted?: boolean
  caption: string
}) {
  const displayColor = inverted
    ? value > 60
      ? 'var(--destructive)'
      : value > 30
      ? 'var(--warning)'
      : 'var(--success)'
    : value > 65
    ? color
    : value > 35
    ? 'var(--warning)'
    : 'var(--destructive)'

  return (
    <div
      className="flex flex-col items-center rounded-3xl bg-card p-6 text-center"
      style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
    >
      <div className="relative">
        <RadialGauge value={value} color={displayColor} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ color: displayColor }} className="mb-1">
            {icon}
          </span>
          <span className="text-3xl font-black" style={{ color: displayColor }}>
            {value}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1.5 text-xs font-semibold text-muted leading-relaxed max-w-[180px]">{caption}</p>
    </div>
  )
}

// ── KpiCard ───────────────────────────────────────────────────────────────────

export function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
  bg: string
}) {
  return (
    <div
      className="rounded-2xl bg-card p-5"
      style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: bg, color }}
        >
          {icon}
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      </div>
      <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs font-semibold text-muted">{sub}</p>}
    </div>
  )
}

// ── FlagTag ───────────────────────────────────────────────────────────────────

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

// ── SkillBar ──────────────────────────────────────────────────────────────────

export function SkillBar({ cluster, level, label }: { cluster: string; level: number; label: string }) {
  const colorMap = {
    Sicher: { c: 'var(--success)', d: 'var(--success-dark)' },
    Erkennbar: { c: 'var(--primary)', d: 'var(--primary-shadow)' },
    Lücke: { c: 'var(--destructive)', d: 'var(--destructive-dark)' },
  } as const
  const { c: color, d: dark } = colorMap[label as keyof typeof colorMap]
  const pct = (level / 10) * 100

  return (
    <div className="py-3 first:pt-0 last:pb-0 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-black text-foreground">{cluster}</p>
          <p className="text-xs font-semibold text-muted">{label}</p>
        </div>
        <div
          className="flex h-10 w-12 items-center justify-center rounded-xl text-sm font-black text-white shrink-0"
          style={{ background: color, borderBottom: `3px solid ${dark}` }}
        >
          L{level}
        </div>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${dark} 100%)`,
          }}
        />
        {[10, 40, 70].map(tickPct => (
          <div
            key={tickPct}
            className="absolute top-0 bottom-0 w-px bg-card opacity-60"
            style={{ left: `${tickPct}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted">
        <span>L1</span>
        <span>L5</span>
        <span>L10</span>
      </div>
    </div>
  )
}

// ── MiniMetric ────────────────────────────────────────────────────────────────

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
    ? value > 60
      ? 'var(--destructive)'
      : value > 30
      ? 'var(--warning)'
      : 'var(--success)'
    : value > 65
    ? color
    : value > 35
    ? 'var(--warning)'
    : 'var(--destructive)'
  return (
    <div className="rounded-lg bg-card p-2 text-center" style={{ border: '1px solid var(--border)' }}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-base font-black" style={{ color: display }}>
        {value}
      </p>
    </div>
  )
}

// ── SmallBadge ────────────────────────────────────────────────────────────────

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

// ── KV ────────────────────────────────────────────────────────────────────────

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

// ── FocusPlanCard ─────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom'

export function FocusPlanCard({
  skillCluster,
  level,
  label,
  rank,
  clusterId,
}: {
  skillCluster: string
  level: number
  label: string
  rank: number
  clusterId: string | undefined
}) {
  const card = (
    <div
      className="rounded-2xl bg-card p-5 transition-shadow group-hover:shadow-md"
      style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            borderBottom: '3px solid var(--primary-shadow)',
          }}
        >
          {rank}
        </span>
        <p className="text-sm font-black text-foreground flex-1">{skillCluster}</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted">
          Aktuell L{level} ({label})
        </p>
        <span className="text-xs font-black text-primary">
          {clusterId ? '→ Lernen starten' : '→ Ziel L7+'}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${(level / 10) * 100}%`,
            background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%)',
          }}
        />
      </div>
    </div>
  )

  return clusterId ? (
    <Link to={`/student/cluster/${clusterId}`} className="group block">
      {card}
    </Link>
  ) : (
    <div>{card}</div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

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
