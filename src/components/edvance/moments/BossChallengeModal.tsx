import { useEffect, type JSX } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BossChallengeModalProps {
  open: boolean
  onClose: () => void
  /** Schatten-Variante: alle Farben entsättigt + gedimmt — identische Struktur. */
  variant?: 'default' | 'shadow'
  /** Auto-Dismiss in ms (max 3000 per Hard Rule §2). */
  autoDismissMs?: number
}

const DEFAULT_DISMISS_MS = 2800

/**
 * BossChallengeModal — Hard Rule §2/§4:
 * - Max. 3 Sekunden Sichtbarkeit
 * - Max. 1× pro Session (Caller-Verantwortung)
 *
 * Hintergrund-Verlauf-Animation 4s-Zyklus zwischen `--color-moment-boss-bg-start`
 * und `--color-moment-boss-bg-end`. Schatten-Variante nutzt `--color-moment-boss-shadow-*`.
 */
export function BossChallengeModal({
  open,
  onClose,
  variant = 'default',
  autoDismissMs = DEFAULT_DISMISS_MS,
}: BossChallengeModalProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return
    const id = setTimeout(onClose, Math.min(autoDismissMs, 3000))
    return () => clearTimeout(id)
  }, [open, onClose, autoDismissMs])

  if (!open) return null

  const isShadow = variant === 'shadow'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in"
      style={{ backgroundColor: 'var(--color-overlay)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-xl)] p-8 shadow-xl animate-scale-in text-center relative overflow-hidden"
        style={{
          background: isShadow
            ? 'linear-gradient(120deg, var(--color-moment-boss-shadow-start), var(--color-moment-boss-shadow-end))'
            : 'linear-gradient(120deg, var(--color-moment-boss-bg-start), var(--color-moment-boss-bg-end))',
          backgroundSize: '200% 200%',
          animation: 'boss-shift 4s ease-in-out infinite',
          color: isShadow ? 'rgba(255,255,255,0.6)' : 'var(--color-bg-surface)',
          filter: isShadow ? 'saturate(0.4)' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Stars />
        <p
          className="text-xs font-semibold uppercase tracking-widest opacity-80 relative z-10"
          style={{ color: isShadow ? undefined : 'var(--color-moment-boss-green)' }}
        >
          Boss-Challenge
        </p>
        <h2
          className="text-3xl font-bold mt-2 leading-tight relative z-10"
          style={{ color: isShadow ? undefined : 'var(--color-moment-boss-green)' }}
        >
          80 % geschafft!
        </h2>
        <p className="mt-3 text-sm opacity-80 relative z-10">
          Du hast in dieser Session überdurchschnittlich gut abgeschnitten.
        </p>

        <style>{`
          @keyframes boss-shift {
            0%, 100% { background-position: 0% 50%; }
            50%      { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    </div>
  )
}

function Stars(): JSX.Element {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {[
        { top: '12%', left: '15%', size: 14, delay: 0 },
        { top: '20%', left: '78%', size: 18, delay: 150 },
        { top: '70%', left: '20%', size: 16, delay: 300 },
        { top: '78%', left: '82%', size: 12, delay: 450 },
      ].map((s, i) => (
        <Star
          key={i}
          className={cn('absolute animate-fly-in')}
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            color: 'var(--color-gold-altgold)',
            animationDelay: `${s.delay}ms`,
            filter: 'drop-shadow(0 0 6px rgba(212, 168, 67, 0.4))',
          }}
          fill="currentColor"
        />
      ))}
    </div>
  )
}
