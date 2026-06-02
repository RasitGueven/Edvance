import { useEffect, type JSX } from 'react'
import { Crown } from 'lucide-react'
import { Modal } from '../Modal'

interface LevelUpModalProps {
  open: boolean
  onClose: () => void
  level: number
  /** XP-Reward für diesen Level-Up (Anzeige, optional). */
  xpReward?: number
}

const AUTO_DISMISS_MS = 3000

/**
 * LevelUpModal — Hard Rule §2/§4:
 * - Max. 3 Sekunden Sichtbarkeit (auto-dismiss)
 * - Max. 1× pro Session triggern (Caller-Verantwortung)
 *
 * Bühne: `--color-moment-levelup-bg` (#334D7A Midnight-Navy) + light-source.
 * Krone: `--color-moment-levelup-crown` (#E8D5A3 Champagner).
 * XP-Badge: `--color-moment-levelup-xp` (#D4A843 Altgold).
 * KEIN Türkis (das wurde explizit verworfen).
 */
export function LevelUpModal({ open, onClose, level, xpReward }: LevelUpModalProps): JSX.Element {
  useEffect(() => {
    if (!open) return
    const id = setTimeout(onClose, AUTO_DISMISS_MS)
    return () => clearTimeout(id)
  }, [open, onClose])

  return (
    <Modal open={open} onClose={onClose} size="md" title="">
      <div
        className="-m-2 rounded-[var(--radius-xl)] p-6 student-hero light-source text-white flex flex-col items-center text-center gap-4"
      >
        <Crown
          className="h-16 w-16 animate-fly-in text-[var(--color-moment-levelup-crown)]"
          aria-hidden="true"
        />
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
          Level erreicht
        </p>
        <p className="text-5xl font-bold leading-none">{level}</p>
        {typeof xpReward === 'number' && (
          <span
            className="inline-flex items-center rounded-[var(--radius-md)] px-3 py-1 text-sm font-bold bg-[var(--color-moment-levelup-xp)] text-[var(--color-primary)]"
          >
            +{xpReward} XP
          </span>
        )}
        <p className="text-sm opacity-80 max-w-xs">
          Stark! Du bist ein Stück weiter in der Akademie.
        </p>
      </div>
    </Modal>
  )
}
