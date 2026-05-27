import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface XPBarProps {
  current: number
  max: number
  level: number
  levelName: string
  className?: string
}

/**
 * v2-XPBar — Altgold→Champagner-Verlauf via `.xp-bar-fill`-Klasse.
 * Streak-Anzeige ist NICHT mehr in XPBar — dafür `StreakPill`.
 * Beim XP-Zuwachs läuft ein einmaliger `animate-xp-float` (kein Endlos-Shimmer).
 */
export function XPBar({ current, max, level, levelName, className }: XPBarProps) {
  const [mounted, setMounted] = useState(false)
  const [floatKey, setFloatKey] = useState(0)
  const pct = Math.min(100, (current / max) * 100)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    setFloatKey((k) => k + 1)
  }, [current])

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex-none flex items-center justify-center w-10 h-10',
          'rounded-[var(--radius-full)] text-sm font-bold text-[var(--color-primary)]',
          'bg-[var(--color-gold-altgold)] shadow-xs',
        )}
      >
        {level}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5 relative">
          <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">{levelName}</span>
          <span className="text-xs font-bold text-[var(--color-text-secondary)]">
            {current.toLocaleString('de-DE')} / {max.toLocaleString('de-DE')} XP
          </span>
          {/* Einmaliger XP-Float beim Zuwachs (Re-Key triggert Animation neu) */}
          <span
            key={floatKey}
            className="pointer-events-none absolute right-0 -top-3 text-xs font-bold text-[var(--color-accent)] animate-xp-float"
            aria-hidden="true"
          />
        </div>
        <div className="h-2.5 w-full rounded-[var(--radius-full)] overflow-hidden bg-[var(--color-bg-subtle)]">
          <div
            className="xp-bar-fill h-full rounded-[var(--radius-full)]"
            style={{ width: mounted ? `${pct}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  )
}
