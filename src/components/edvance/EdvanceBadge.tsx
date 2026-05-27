import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EdvanceBadgeProps {
  children: ReactNode
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
