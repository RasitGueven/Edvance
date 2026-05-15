/**
 * Badge — Semantische Status- und Kategorie-Kennzeichnung.
 *
 * Design-Regeln:
 * - accent und celebration nie als Textfarbe auf weißem Hintergrund (WCAG nicht erfüllt).
 *   Deshalb werden --color-accent-on / --color-accent-celebration-on als Textfarbe verwendet.
 * - moment-* Farben niemals für Badge-Varianten — nur in Animationen (≤ 3 s).
 * - Level-Up- und Boss-Challenge-Screens max. 1× pro Session triggern.
 *
 * Verwendung:
 * - Semantische Varianten (success/warning/error/info/accent/celebration): children übergeben.
 * - Status-Varianten (active/done/upcoming): kein children nötig, Label wird automatisch gesetzt.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { BadgeProps, BadgeVariant } from '@/types'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  /* ── Semantisch ── */
  success:     'bg-success-light text-success',
  warning:     'bg-warning-light text-warning',
  error:       'bg-error-light text-error',
  info:        'bg-info-light text-info',
  accent:      'bg-accent text-accent-on',
  celebration: 'bg-accent-celebration text-accent-celebration-on',
  /* ── Status (Rückwärts-kompatibel) ── */
  active:   'bg-success-light text-success border border-success/30',
  done:     'bg-bg-subtle text-text-tertiary border border-border',
  upcoming: 'bg-primary-light text-primary border border-primary/30',
}

const STATUS_LABELS: Partial<Record<BadgeVariant, string>> = {
  active:   'Aktiv',
  done:     'Abgeschlossen',
  upcoming: 'Geplant',
}

type Props = BadgeProps & { children?: ReactNode }

export function Badge({ variant, className, children }: Props): JSX.Element {
  const label = children ?? STATUS_LABELS[variant]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {label}
    </span>
  )
}
