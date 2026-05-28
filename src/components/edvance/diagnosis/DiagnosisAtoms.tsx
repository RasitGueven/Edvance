import React from 'react'

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
