import { useEffect, useState, type JSX } from 'react'
import { Flame, Sparkles } from 'lucide-react'
import { Modal } from '../Modal'

interface StreakRepairFlowProps {
  open: boolean
  /** Tokens, die der Schüler aktuell besitzt (aus streak_repair_inventory). */
  tokens: number
  /** Wird aufgerufen, wenn der Schüler bewusst auf "Token einsetzen" klickt. */
  onUseToken: () => void
  /** Wird aufgerufen, wenn der Schüler abbricht oder das Modal schließt. */
  onCancel: () => void
}

/**
 * StreakRepairFlow — Hard Rule §5:
 * Streak-Verlust kurz in `--color-moment-streak-red` (~2 Sek), dann direkt
 * Übergang zu `--color-repair-surface` (Lila-Surface) mit Lila-Akzenten.
 *
 * Zwei-Phasen-Komposit:
 *  Phase 1 (loss):    ~1.8 Sek Rot-Flackern mit Flame-Icon
 *  Phase 2 (offer):   Lila-Repair-Angebot, Token einsetzen oder ablehnen
 */
export function StreakRepairFlow({
  open,
  tokens,
  onUseToken,
  onCancel,
}: StreakRepairFlowProps): JSX.Element | null {
  const [phase, setPhase] = useState<'loss' | 'offer'>('loss')

  useEffect(() => {
    if (!open) {
      setPhase('loss')
      return
    }
    const id = setTimeout(() => setPhase('offer'), 1800)
    return () => clearTimeout(id)
  }, [open])

  if (!open) return null

  if (phase === 'loss') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in"
        style={{ backgroundColor: 'rgba(20, 33, 61, 0.55)' }}
        role="alert"
        aria-live="assertive"
      >
        <div
          className="w-full max-w-md rounded-[var(--radius-xl)] p-8 text-center animate-scale-in"
          style={{
            backgroundColor: 'var(--color-moment-streak-red)',
            color: 'var(--color-bg-surface)',
          }}
        >
          <Flame className="h-16 w-16 mx-auto" aria-hidden="true" />
          <h2 className="text-2xl font-bold mt-3">Streak unterbrochen</h2>
          <p className="mt-2 text-sm opacity-80">
            Diese Woche fehlt eine Präsenz-Session.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Modal open onClose={onCancel} size="md" title="">
      <div
        className="-m-6 p-6 rounded-[var(--radius-xl)]"
        style={{ backgroundColor: 'var(--color-repair-surface)' }}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <Sparkles
            className="h-12 w-12"
            style={{ color: 'var(--color-repair)' }}
            aria-hidden="true"
          />
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-repair)' }}>
            Streak retten?
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
            Setze 1 Repair-Token ein, um deine Streak weiterlaufen zu lassen.
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Du hast {tokens} Token{tokens === 1 ? '' : 's'} übrig.
          </p>

          <div className="mt-3 flex gap-2 w-full">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]"
            >
              Nicht jetzt
            </button>
            <button
              type="button"
              disabled={tokens <= 0}
              onClick={onUseToken}
              className="flex-1 rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-repair)',
                color: 'var(--color-bg-surface)',
              }}
            >
              Token einsetzen
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
