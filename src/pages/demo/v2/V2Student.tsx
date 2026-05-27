import { useState, type JSX } from 'react'
import {
  EdvanceCard,
  EdvanceBadge,
  XPBar,
  StreakPill,
  MasteryBar,
} from '@/components/edvance'
import { LevelUpModal, BossChallengeModal, StreakRepairFlow } from '@/components/edvance/moments'

/**
 * V2Student — Demo des Schüler-Erlebnisses inkl. aller Effekt-Momente.
 * Buttons triggern die Moments manuell, damit Design + Timing prüfbar sind.
 */
export function V2Student(): JSX.Element {
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showBoss, setShowBoss] = useState(false)
  const [showBossShadow, setShowBossShadow] = useState(false)
  const [showRepair, setShowRepair] = useState(false)
  const [repairTokens, setRepairTokens] = useState(2)

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      {/* Schüler-Hero mit Glaseffekt-Streaks */}
      <header className="student-hero light-source px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-eyebrow opacity-70">Edvance · v2 Showcase</p>
          <h1 className="text-display text-3xl mt-1 leading-none">Hi Lena 👋</h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <StreakPill variant="presence" count={5} multiplier={1.2} />
            <StreakPill variant="home" count={12} />
          </div>

          <div className="glass-card mt-5 p-4">
            <XPBar current={320} max={500} level={6} levelName="Level 6" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-6">
        {/* Trigger-Buttons für Moments */}
        <EdvanceCard className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowLevelUp(true)}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg-surface)] hover:bg-[var(--color-primary-hover)]"
          >
            Level-Up Trigger
          </button>
          <button
            type="button"
            onClick={() => setShowBoss(true)}
            className="rounded-[var(--radius-md)] bg-[var(--color-success-celebration)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg-surface)]"
          >
            Boss-Challenge
          </button>
          <button
            type="button"
            onClick={() => setShowBossShadow(true)}
            className="rounded-[var(--radius-md)] bg-[var(--color-neutral-disabled)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)]"
          >
            Boss-Challenge (Schatten-Variante)
          </button>
          <button
            type="button"
            onClick={() => setShowRepair(true)}
            className="rounded-[var(--radius-md)] bg-[var(--color-repair)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg-surface)]"
          >
            Streak-Repair Flow
          </button>
        </EdvanceCard>

        {/* Empfohlener Cluster */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
            Empfohlen für dich
          </h2>
          <EdvanceCard accent="primary">
            <p className="text-base font-bold text-[var(--color-text-primary)]">Lineare Funktionen</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Klasse 8 · Schwerpunkt aus dem Screening
            </p>
            <div className="mt-3">
              <MasteryBar score={45} showLabel size="md" />
            </div>
          </EdvanceCard>
        </div>

        {/* Andere Cluster */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
            Mein Lernpfad
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <EdvanceCard accent="skilltree">
              <p className="text-sm font-bold">Bruchrechnen</p>
              <EdvanceBadge variant="mastery-proficient" className="mt-2">Geübt</EdvanceBadge>
            </EdvanceCard>
            <EdvanceCard accent="mastered">
              <p className="text-sm font-bold">Wahrscheinlichkeit</p>
              <EdvanceBadge variant="mastery-mastered" className="mt-2">Gemeistert</EdvanceBadge>
            </EdvanceCard>
          </div>
        </div>
      </main>

      <LevelUpModal open={showLevelUp} onClose={() => setShowLevelUp(false)} level={6} xpReward={50} />
      <BossChallengeModal open={showBoss} onClose={() => setShowBoss(false)} />
      <BossChallengeModal open={showBossShadow} onClose={() => setShowBossShadow(false)} variant="shadow" />
      <StreakRepairFlow
        open={showRepair}
        tokens={repairTokens}
        onUseToken={() => {
          setRepairTokens((t) => Math.max(0, t - 1))
          setShowRepair(false)
        }}
        onCancel={() => setShowRepair(false)}
      />
    </div>
  )
}
