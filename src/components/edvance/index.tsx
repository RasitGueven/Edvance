import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

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
    default:    'bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-xs',
    raised:     'bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-md',
    navy:       'bg-[var(--color-primary)] text-[var(--color-bg-surface)] border border-[var(--color-primary)] shadow-md',
    'blue-pale':'bg-[var(--color-primary-light)] border border-[var(--color-primary-light)]',
    hero:       'student-hero text-white border-0 shadow-xl ',
    glass:      'glass-card shadow-md',
    premium:    'bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-md',
  }

  const accentStyles: Record<string, string> = {
    none:               '',
    'left-primary':     'border-l-4 border-l-[var(--color-primary)]',
    'left-success':     'border-l-4 border-l-[var(--color-success)]',
    'left-warning':     'border-l-4 border-l-[var(--color-gold-warning)]',
    'left-destructive': 'border-l-4 border-l-[var(--color-error-exam)]',
  }

  const isInteractive = !!onClick
  const isDark = variant === 'navy' || variant === 'hero'

  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] p-6',
        variantStyles[variant],
        accentStyles[accent],
        !isDark && 'transition-all duration-300 hover:shadow-lg',
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
      'bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary-light)]',
    success:
      'bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success)]',
    warning:
      'bg-[var(--color-gold-warning-light)] text-[var(--color-gold-warning)] border border-[var(--color-gold-warning)]',
    destructive:
      'bg-[var(--color-error-exam-light)] text-[var(--color-error-exam)] border border-[var(--color-error-exam)]',
    muted:
      'bg-[var(--color-border)] text-[var(--color-text-tertiary)] border border-[var(--color-neutral-unknown)]',
    xp:
      'bg-[var(--color-accent)] text-[var(--color-primary)] border border-[var(--color-accent)] font-bold',
    streak:
      'bg-[var(--color-accent-streak)] text-white border border-[var(--color-accent-streak)]',
    levelup:
      'bg-[var(--color-primary)] text-[var(--color-bg-surface)] border border-[var(--color-primary)] font-bold',
    repair:
      'bg-[var(--color-moment-repair-purple)] text-[var(--color-bg-surface)] border border-[var(--color-moment-repair-purple)] font-bold',
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
  if (level <= 3) return 'var(--color-error-exam)'
  if (level <= 5) return 'var(--color-gold-warning)'
  if (level <= 7) return 'var(--color-accent)'
  return 'var(--color-success)'
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
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Niveau {clamped}/10
          </span>
          <span className="text-xs font-bold" style={{ color }}>
            {label}
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-[var(--radius-full)] overflow-hidden bg-[var(--color-border)]',
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
          'rounded-[var(--radius-full)] text-sm font-bold text-[var(--color-primary)]',
          'bg-[var(--color-accent)] shadow-xs',
          pulse && 'animate-xp-float',
        )}
      >
        {level}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">{levelName}</span>
          <span
            className={cn(
              'text-xs font-bold text-[var(--color-accent)]',
              pulse && 'animate-xp-float',
            )}
          >
            {current.toLocaleString('de-DE')} / {max.toLocaleString('de-DE')} XP
          </span>
        </div>
        <div className="h-2.5 w-full rounded-[var(--radius-full)] overflow-hidden bg-[var(--color-accent-streak-light)]">
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
  color = 'var(--color-primary)',
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
                  ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                  : 'bg-[var(--color-error-exam-light)] text-[var(--color-error-exam)]',
              )}
            >
              {trend}
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1 leading-relaxed">{label}</p>
      </div>
    </EdvanceCard>
  )
}

// ─── AvatarInitials ───────────────────────────────────────────────────────────

interface AvatarInitialsProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'auto' | string
}

const AVATAR_PALETTE = [
  '#2D6A9F', '#0F6E56', '#D97706', '#7C3AED',
  '#EA580C', '#0E7490', '#BE185D', '#065F46',
]

function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function AvatarInitials({ name, size = 'md', color = 'auto' }: AvatarInitialsProps) {
  const bg = color === 'auto' ? nameToColor(name) : color

  const sizeStyles: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  }

  return (
    <div
      className={cn(
        'flex-none flex items-center justify-center rounded-[var(--radius-full)] font-bold text-white select-none',
        sizeStyles[size],
      )}
      style={{ backgroundColor: bg }}
      title={name}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
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
                  isPast   && 'bg-[var(--color-success)] border-[var(--color-success)] text-white',
                  isActive && 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white scale-110 shadow-xs',
                  !isPast && !isActive && 'bg-transparent border-[var(--color-neutral-unknown)] text-[var(--color-text-tertiary)]',
                )}
              >
                {isPast ? '✓' : idx + 1}
              </div>
              <span
                className={cn(
                  'text-xs max-w-[64px] text-center leading-tight',
                  isActive && 'font-semibold text-[var(--color-primary)]',
                  isPast   && 'text-[var(--color-success)]',
                  !isPast && !isActive && 'text-[var(--color-text-tertiary)]',
                )}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mb-5 mx-1 transition-colors duration-300',
                  isPast ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]',
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
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--color-text-tertiary)]">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─── LoadingPulse ─────────────────────────────────────────────────────────────

interface LoadingPulseProps {
  lines?: number
  type?: 'card' | 'list' | 'stat'
}

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn('rounded-[var(--radius-md)] bg-[var(--color-border)] animate-skeleton', className)}
      style={style}
    />
  )
}

export function LoadingPulse({ lines = 3, type = 'list' }: LoadingPulseProps) {
  if (type === 'card') {
    return (
      <div className="rounded-[var(--radius-xl)] p-6 border border-[var(--color-border)] shadow-card bg-[var(--color-bg-surface)]">
        <SkeletonBlock className="h-5 w-1/2 mb-4" />
        <SkeletonBlock className="h-4 w-full mb-2" />
        <SkeletonBlock className="h-4 w-3/4 mb-2" />
        <SkeletonBlock className="h-4 w-5/6" />
      </div>
    )
  }

  if (type === 'stat') {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-xl)] p-6 border border-[var(--color-border)] shadow-card bg-[var(--color-bg-surface)] flex items-start gap-3"
          >
            <SkeletonBlock className="w-12 h-12 rounded-[var(--radius-lg)] flex-none" />
            <div className="flex-1 flex flex-col gap-2">
              <SkeletonBlock className="h-8 w-16" />
              <SkeletonBlock className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBlock className="w-10 h-10 rounded-[var(--radius-full)] flex-none" />
          <div className="flex-1 flex flex-col gap-1.5">
            <SkeletonBlock
              className="h-3.5"
              style={{ width: `${70 + (i % 3) * 10}%` } as React.CSSProperties}
            />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ToastBanner ──────────────────────────────────────────────────────────────

interface ToastBannerProps {
  type: 'success' | 'xp' | 'levelup' | 'warning' | 'error'
  message: string
  xpAmount?: number
  onClose?: () => void
}

const TOAST_CLASS: Record<string, string> = {
  success: 'toast-success',
  xp:      'toast-xp',
  levelup: 'toast-levelup',
  warning: 'toast-warning',
  error:   'toast-error',
}

const TOAST_ICON: Record<string, string> = {
  success: '✓',
  xp:      '🎉',
  levelup: '⬆️',
  warning: '⚠️',
  error:   '✕',
}

export function ToastBanner({ type, message, xpAmount, onClose }: ToastBannerProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const hideTimer = setTimeout(() => setExiting(true), 2700)
    return () => clearTimeout(hideTimer)
  }, [])

  useEffect(() => {
    if (!exiting) return
    const closeTimer = setTimeout(() => onClose?.(), 200)
    return () => clearTimeout(closeTimer)
  }, [exiting, onClose])

  return (
    <div
      className={cn(
        'fixed top-6 left-1/2 z-50',
        'flex items-center gap-3 px-5 py-3',
        'rounded-[var(--radius-lg)] font-semibold border-[1.5px]',
        '-translate-x-1/2 min-w-[280px] max-w-[480px]',
        'shadow-lg',
        TOAST_CLASS[type],
        exiting ? 'animate-toast-out' : 'animate-toast-in',
      )}
      role="alert"
    >
      <span className={cn('text-xl leading-none', type === 'xp' && 'text-2xl')}>
        {TOAST_ICON[type]}
      </span>

      <span className="flex-1 text-sm">{message}</span>

      {type === 'xp' && xpAmount !== undefined && (
        <span className="text-xl font-bold leading-none animate-xp-float">
          +{xpAmount} XP
        </span>
      )}
    </div>
  )
}
