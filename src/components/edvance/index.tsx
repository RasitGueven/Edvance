import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export { ToastBanner } from './ToastBanner'
export { LoadingPulse } from './LoadingPulse'
export { AvatarInitials } from './AvatarInitials'

// ─── EdvanceCard ──────────────────────────────────────────────────────────────

interface EdvanceCardProps {
  children: React.ReactNode
  variant?: 'default' | 'raised' | 'navy' | 'blue-pale' | 'hero' | 'glass' | 'premium'
  accent?: 'none' | 'left-primary' | 'left-success' | 'left-warning' | 'left-destructive'
  className?: string
  onClick?: () => void
}

export function EdvanceCard({
  children,
  variant = 'default',
  accent = 'none',
  className,
  onClick,
}: EdvanceCardProps) {
  const variantStyles: Record<string, string> = {
    default:    'bg-[var(--surface)] border border-[var(--border)] shadow-premium-sm',
    raised:     'bg-[var(--surface-raised)] border border-[var(--border)] shadow-premium-md',
    navy:       'bg-[var(--brand-navy)] text-[var(--text-inverse)] border border-[var(--brand-navy)] shadow-premium-md',
    'blue-pale':'bg-[var(--primary-pale)] border border-[var(--primary-light)]',
    hero:       'bg-gradient-hero text-white border-0 shadow-premium-xl noise-overlay',
    glass:      'glass-light shadow-premium-md',
    premium:    'bg-gradient-surface border border-[var(--border)] shadow-premium-md',
  }

  const accentStyles: Record<string, string> = {
    none:               '',
    'left-primary':     'border-l-4 border-l-[var(--primary)]',
    'left-success':     'border-l-4 border-l-[var(--success)]',
    'left-warning':     'border-l-4 border-l-[var(--warning)]',
    'left-destructive': 'border-l-4 border-l-[var(--destructive)]',
  }

  const isInteractive = !!onClick
  const isDark = variant === 'navy' || variant === 'hero'

  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] p-6',
        variantStyles[variant],
        accentStyles[accent],
        !isDark && 'transition-all duration-300 hover:shadow-premium-lg',
        isInteractive && 'cursor-pointer hover-lift',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ─── EdvanceBadge ─────────────────────────────────────────────────────────────

interface EdvanceBadgeProps {
  children: React.ReactNode
  variant?:
    | 'primary'
    | 'success'
    | 'warning'
    | 'destructive'
    | 'muted'
    | 'xp'
    | 'streak'
    | 'levelup'
    | 'repair'
  className?: string
}

export function EdvanceBadge({
  children,
  variant = 'primary',
  className,
}: EdvanceBadgeProps) {
  const variantStyles: Record<string, string> = {
    primary:
      'bg-[var(--primary-pale)] text-[var(--primary)] border border-[var(--primary-light)]',
    success:
      'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]',
    warning:
      'bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]',
    destructive:
      'bg-[var(--destructive-light)] text-[var(--destructive)] border border-[var(--destructive)]',
    muted:
      'bg-[var(--border)] text-[var(--text-muted)] border border-[var(--border-strong)]',
    xp:
      'bg-[var(--xp-gold)] text-[var(--brand-navy)] border border-[var(--xp-gold)] font-bold',
    streak:
      'bg-[var(--streak-orange)] text-white border border-[var(--streak-orange)]',
    levelup:
      'bg-[var(--color-levelup)] text-[var(--color-levelup-on)] border border-[var(--color-levelup)] font-bold',
    repair:
      'bg-[var(--color-moment-repair)] text-[var(--color-moment-repair-on)] border border-[var(--color-moment-repair)] font-bold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-full)] px-3 py-1',
        'text-xs font-semibold uppercase tracking-wider',
        variantStyles[variant],
        className,
      )}
    >
      {variant === 'streak' && '🔥'}
      {children}
    </span>
  )
}

// ─── MasteryBar ───────────────────────────────────────────────────────────────

interface MasteryBarProps {
  level: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function getMasteryColor(level: number): string {
  if (level <= 3) return 'var(--destructive)'
  if (level <= 5) return 'var(--warning)'
  if (level <= 7) return 'var(--xp-gold)'
  return 'var(--success)'
}

function getMasteryLabel(level: number): string {
  if (level <= 3) return 'Lücke'
  if (level <= 5) return 'Erkennbar'
  if (level <= 7) return 'Sicher'
  return 'Exzellent'
}

export function MasteryBar({ level, showLabel = false, size = 'md' }: MasteryBarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const clamped = Math.min(10, Math.max(1, level))
  const pct = (clamped / 10) * 100
  const color = getMasteryColor(clamped)
  const label = getMasteryLabel(clamped)

  const trackHeights: Record<string, string> = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className="flex flex-col gap-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Niveau {clamped}/10
          </span>
          <span className="text-xs font-bold" style={{ color }}>
            {label}
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-[var(--radius-full)] overflow-hidden bg-[var(--border)]',
          trackHeights[size],
        )}
      >
        <div
          className="mastery-bar-fill h-full rounded-[var(--radius-full)]"
          style={{
            width: mounted ? `${pct}%` : '0%',
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

// ─── XPBar ────────────────────────────────────────────────────────────────────

interface XPBarProps {
  current: number
  max: number
  level: number
  levelName: string
}

export function XPBar({ current, max, level, levelName }: XPBarProps) {
  const [mounted, setMounted] = useState(false)
  const [pulse, setPulse] = useState(false)
  const pct = Math.min(100, (current / max) * 100)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 500)
    return () => clearTimeout(t)
  }, [current])

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex-none flex items-center justify-center w-10 h-10',
          'rounded-[var(--radius-full)] text-sm font-bold text-[var(--brand-navy)]',
          'bg-[var(--xp-gold)] shadow-elevation-sm',
          pulse && 'animate-bounce-pop',
        )}
      >
        {level}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[var(--text-muted)]">{levelName}</span>
          <span
            className={cn(
              'text-xs font-bold text-[var(--xp-gold)]',
              pulse && 'animate-xp-pulse',
            )}
          >
            {current.toLocaleString('de-DE')} / {max.toLocaleString('de-DE')} XP
          </span>
        </div>
        <div className="h-2.5 w-full rounded-[var(--radius-full)] overflow-hidden bg-[var(--xp-gold-light)]">
          <div
            className="xp-bar-fill h-full rounded-[var(--radius-full)]"
            style={{ width: mounted ? `${pct}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string | number
  label: string
  icon: string
  trend?: string | null
  color?: string
}

export function StatCard({
  value,
  label,
  icon,
  trend = null,
  color = 'var(--primary)',
}: StatCardProps) {
  const isPositive = trend?.startsWith('+')

  return (
    <EdvanceCard className="group flex items-start gap-4 hover:-translate-y-0.5 transition-transform duration-200">
      <div
        className="flex-none flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] text-xl shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, white)` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-3xl font-bold leading-none" style={{ color }}>
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold rounded-[var(--radius-full)] px-2 py-0.5 shrink-0',
                isPositive
                  ? 'bg-[var(--success-light)] text-[var(--success)]'
                  : 'bg-[var(--destructive-light)] text-[var(--destructive)]',
              )}
            >
              {trend}
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">{label}</p>
      </div>
    </EdvanceCard>
  )
}

// ─── ProgressStep ─────────────────────────────────────────────────────────────

interface ProgressStepProps {
  steps: string[]
  current: number
}

export function ProgressStep({ steps, current }: ProgressStepProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, idx) => {
        const isPast   = idx < current
        const isActive = idx === current
        const isLast   = idx === steps.length - 1

        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center',
                  'text-xs font-bold border-2 transition-all duration-200',
                  isPast   && 'bg-[var(--success)] border-[var(--success)] text-white',
                  isActive && 'bg-[var(--primary)] border-[var(--primary)] text-white scale-110 shadow-elevation-sm',
                  !isPast && !isActive && 'bg-transparent border-[var(--border-strong)] text-[var(--text-muted)]',
                )}
              >
                {isPast ? '✓' : idx + 1}
              </div>
              <span
                className={cn(
                  'text-xs max-w-[64px] text-center leading-tight',
                  isActive && 'font-semibold text-[var(--primary)]',
                  isPast   && 'text-[var(--success)]',
                  !isPast && !isActive && 'text-[var(--text-muted)]',
                )}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mb-5 mx-1 transition-colors duration-300',
                  isPast ? 'bg-[var(--success)]' : 'bg-[var(--border)]',
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-4 animate-fade-in">
      <div className="text-5xl leading-none select-none">{icon}</div>
      <div className="flex flex-col gap-2 max-w-xs">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

