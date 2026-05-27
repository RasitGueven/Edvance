import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type EdvanceBadgeVariant =
  /* Standard */
  | 'primary'
  | 'warning'
  /* Rot-Familie (5 Kontexte) */
  | 'gap'
  | 'exam'
  | 'streak-lost'
  | 'coach-emergency'
  | 'answer-wrong'
  /* Grün-Familie (4 Kontexte für Badges) */
  | 'strength'
  | 'answer-right'
  | 'mastered'
  | 'skilltree'
  /* XP & Streak */
  | 'xp-day'
  | 'xp-levelup'
  | 'streak-presence'
  | 'streak-home'
  /* Mastery 5 Stufen */
  | 'mastery-introduced'
  | 'mastery-developing'
  | 'mastery-progressing'
  | 'mastery-proficient'
  | 'mastery-mastered'
  /* Neutral (für inaktive Filter-Pills, Tags ohne Status-Bedeutung) */
  | 'muted'

interface EdvanceBadgeProps {
  children: ReactNode
  variant?: EdvanceBadgeVariant
  className?: string
  icon?: ReactNode
}

const VARIANT_STYLES: Record<EdvanceBadgeVariant, string> = {
  primary:
    'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]',
  warning:
    'bg-[var(--color-gold-warning-light)] text-[var(--color-gold-warning)] border-[var(--color-gold-warning)]',
  /* Rot */
  gap:
    'bg-[var(--color-error-gap-light)] text-[var(--color-error-gap)] border-[var(--color-error-gap)]',
  exam:
    'bg-[var(--color-error-exam-light)] text-[var(--color-error-exam)] border-[var(--color-error-exam)]',
  'streak-lost':
    'bg-[var(--color-error-streak-light)] text-[var(--color-error-streak)] border-[var(--color-error-streak)]',
  'coach-emergency':
    'bg-[var(--color-error-coach-light)] text-[var(--color-error-coach)] border-[var(--color-error-coach)]',
  'answer-wrong':
    'bg-[var(--color-error-answer-light)] text-[var(--color-error-answer)] border-[var(--color-error-answer)]',
  /* Grün */
  strength:
    'bg-[var(--color-success-eltern-light)] text-[var(--color-success-eltern)] border-[var(--color-success-eltern)]',
  'answer-right':
    'bg-[var(--color-success-answer-light)] text-[var(--color-success-answer)] border-[var(--color-success-answer)]',
  mastered:
    'bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]',
  skilltree:
    'bg-[var(--color-success-skilltree-light)] text-[var(--color-success-skilltree)] border-[var(--color-success-skilltree)]',
  /* XP & Streak */
  'xp-day':
    'bg-[var(--color-gold-altgold)] text-[var(--color-primary)] border-[var(--color-gold-altgold)] font-bold',
  'xp-levelup':
    'bg-[var(--color-primary)] text-[var(--color-gold-altgold)] border-[var(--color-primary)] font-bold',
  'streak-presence':
    'bg-[var(--color-accent-streak-light)] text-[var(--color-accent-streak)] border-[var(--color-accent-streak)]',
  'streak-home':
    'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]',
  /* Mastery */
  'mastery-introduced':
    'bg-[var(--color-bg-subtle)] text-[var(--color-mastery-introduced)] border-[var(--color-mastery-introduced)]',
  'mastery-developing':
    'bg-[var(--color-gold-warning-light)] text-[var(--color-mastery-developing)] border-[var(--color-mastery-developing)]',
  'mastery-progressing':
    'bg-[var(--color-mastery-progressing-bg)] text-[var(--color-mastery-progressing)] border-[var(--color-mastery-progressing)]',
  'mastery-proficient':
    'bg-[var(--color-success-answer-light)] text-[var(--color-mastery-proficient)] border-[var(--color-mastery-proficient)]',
  'mastery-mastered':
    'bg-[var(--color-success-light)] text-[var(--color-mastery-mastered)] border-[var(--color-mastery-mastered)]',
  muted:
    'bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] border-[var(--color-neutral-unknown)]',
}

export function EdvanceBadge({
  children,
  variant = 'primary',
  className,
  icon,
}: EdvanceBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-3 py-1',
        'text-xs font-semibold uppercase tracking-wider',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
