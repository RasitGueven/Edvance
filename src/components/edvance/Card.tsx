import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type EdvanceCardVariant = 'default' | 'subtle' | 'hero-student' | 'hero-parent'

/**
 * EdvanceCard Accent-Prop — semantische Bedeutung:
 * - `primary`            Primärer Fokus / empfohlener Cluster
 * - `gap` / `exam` / `answer-wrong` / `streak-lost` / `coach-emergency`   Rot-Familie (5 Kontexte)
 * - `strength` / `answer-right` / `mastered` / `skilltree`                Grün-Familie (4 Kontexte)
 * - `none`               kein Akzent-Streifen
 */
export type EdvanceCardAccent =
  | 'primary'
  | 'gap'
  | 'exam'
  | 'answer-wrong'
  | 'streak-lost'
  | 'coach-emergency'
  | 'strength'
  | 'answer-right'
  | 'mastered'
  | 'skilltree'
  | 'none'

interface EdvanceCardProps {
  children: ReactNode
  variant?: EdvanceCardVariant
  accent?: EdvanceCardAccent
  className?: string
  onClick?: () => void
}

const VARIANT_STYLES: Record<EdvanceCardVariant, string> = {
  default:        'bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-xs rounded-[var(--radius-lg)] p-6',
  subtle:         'bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6',
  /* Hero-Student nutzt Light-Source + Glas-fähigen dunklen Verlauf */
  'hero-student': 'student-hero light-source text-white border-0 rounded-[var(--radius-xl)] p-6 shadow-xl',
  /* Hero-Parent: flach, ohne Verlauf, ohne Glas (Eltern-Energie) */
  'hero-parent':  'bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 shadow-md',
}

const ACCENT_STYLES: Record<EdvanceCardAccent, string> = {
  primary:           'border-l-4 border-l-[var(--color-primary)]',
  gap:               'border-l-4 border-l-[var(--color-error-gap)]',
  exam:              'border-l-4 border-l-[var(--color-error-exam)]',
  'answer-wrong':    'border-l-4 border-l-[var(--color-error-answer)]',
  'streak-lost':     'border-l-4 border-l-[var(--color-error-streak)]',
  'coach-emergency': 'border-l-4 border-l-[var(--color-error-coach)]',
  strength:          'border-l-4 border-l-[var(--color-success-eltern)]',
  'answer-right':    'border-l-4 border-l-[var(--color-success-answer)]',
  mastered:          'border-l-4 border-l-[var(--color-mastery-mastered)]',
  skilltree:         'border-l-4 border-l-[var(--color-success-skilltree)]',
  none:              '',
}

export function EdvanceCard({
  children,
  variant = 'default',
  accent = 'none',
  className,
  onClick,
}: EdvanceCardProps) {
  const isInteractive = !!onClick
  const isDark = variant === 'hero-student'

  return (
    <div
      className={cn(
        VARIANT_STYLES[variant],
        ACCENT_STYLES[accent],
        !isDark && 'transition-shadow duration-200 hover:shadow-md',
        isInteractive && 'cursor-pointer hover-lift',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
