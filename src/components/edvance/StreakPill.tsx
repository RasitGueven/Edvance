import type { ReactNode } from 'react'
import { Flame, Home, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StreakVariant = 'presence' | 'home'

interface StreakPillProps {
  variant: StreakVariant
  count: number
  frozen?: boolean
  /** Nur für `presence`: liefert Multiplikator-Suffix (×1.1/×1.2/×1.3) */
  multiplier?: number
  className?: string
}

function multiplierBadgeClasses(mult: number): string {
  if (mult >= 1.3) return 'bg-[var(--color-gold-altgold)] text-[var(--color-primary)]'
  if (mult >= 1.2) return 'bg-[var(--color-accent-streak)] text-[var(--color-bg-surface)]'
  if (mult >= 1.1) return 'bg-[var(--color-gold-warning-light)] text-[var(--color-gold-warning)]'
  return ''
}

/**
 * Zwei-Streak-Modell:
 * - `presence`: Wochen-Zähler, Amber-Flamme, optionaler Multiplikator
 * - `home`: Sessions-Zähler, Midnight-Academy-Haus, kein Multiplikator
 *
 * Ferien-Verhalten (`frozen`): Icon → Schneeflocke, opacity 0.75, kein Reset.
 */
export function StreakPill({
  variant,
  count,
  frozen = false,
  multiplier,
  className,
}: StreakPillProps) {
  const Icon: typeof Flame = frozen ? Snowflake : variant === 'presence' ? Flame : Home

  const styleByVariant =
    variant === 'presence'
      ? 'bg-[var(--color-accent-streak-light)] text-[var(--color-accent-streak)] border-[var(--color-accent-streak)]'
      : 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]'

  const label: ReactNode =
    variant === 'presence'
      ? <>{count}&nbsp;W Präsenz</>
      : <>{count}&nbsp;Sessions Home</>

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-3 py-1',
        'text-xs font-semibold',
        styleByVariant,
        frozen && 'opacity-75',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
      {variant === 'presence' && typeof multiplier === 'number' && multiplier > 1 && (
        <span
          className={cn(
            'ml-1 inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[10px] font-bold',
            multiplierBadgeClasses(multiplier),
          )}
        >
          ×{multiplier.toFixed(1).replace('.', ',')}
        </span>
      )}
    </span>
  )
}
