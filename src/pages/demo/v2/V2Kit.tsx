import type { JSX, ReactNode } from 'react'
import { Star } from 'lucide-react'
import {
  EdvanceCard,
  EdvanceBadge,
  MasteryBar,
  StreakPill,
  RarityBadge,
  StatCard,
  AvatarInitials,
  ProgressStep,
  EmptyState,
  LoadingPulse,
} from '@/components/edvance'

/**
 * V2Kit — Vollständige Demonstration aller v2-Atom-Komponenten.
 * Showcase ohne Demo-Scope-Trick — direkt auf produktivem Token-Set.
 */
export function V2Kit(): JSX.Element {
  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <header className="student-hero light-source px-4 py-8 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-eyebrow opacity-70">Edvance · v2 Showcase</p>
          <h1 className="text-display text-3xl mt-1 leading-none">V2 Kit</h1>
          <p className="mt-2 text-sm opacity-80">Alle Atom-Komponenten auf einen Blick.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-8">
        <Section title="EdvanceCard">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <EdvanceCard>
              <p className="text-sm">variant="default" (Standard, Surface + Border)</p>
            </EdvanceCard>
            <EdvanceCard variant="subtle">
              <p className="text-sm">variant="subtle" (Bg-Subtle)</p>
            </EdvanceCard>
            <EdvanceCard variant="hero-parent">
              <p className="text-sm">variant="hero-parent" (flach, Eltern-Energie)</p>
            </EdvanceCard>
            <EdvanceCard variant="hero-student" className="!p-6">
              <p className="text-sm">variant="hero-student" (Verlauf + Light-Source)</p>
            </EdvanceCard>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
            10 Accent-Prop-Werte: primary, gap, exam, answer-wrong, streak-lost,
            coach-emergency, strength, answer-right, mastered, skilltree
          </p>
        </Section>

        <Section title="EdvanceBadge — Rot-Familie (5)">
          <div className="flex flex-wrap gap-2">
            <EdvanceBadge variant="gap">Lücke (Eltern)</EdvanceBadge>
            <EdvanceBadge variant="exam">Klassenarbeit</EdvanceBadge>
            <EdvanceBadge variant="streak-lost">Streak unterbrochen</EdvanceBadge>
            <EdvanceBadge variant="coach-emergency">Notfall</EdvanceBadge>
            <EdvanceBadge variant="answer-wrong">Falsch</EdvanceBadge>
          </div>
        </Section>

        <Section title="EdvanceBadge — Grün-Familie (4 für Badges)">
          <div className="flex flex-wrap gap-2">
            <EdvanceBadge variant="strength">Stärke</EdvanceBadge>
            <EdvanceBadge variant="answer-right">Richtig</EdvanceBadge>
            <EdvanceBadge variant="mastered">Gemeistert</EdvanceBadge>
            <EdvanceBadge variant="skilltree">Skill-Tree</EdvanceBadge>
          </div>
        </Section>

        <Section title="EdvanceBadge — XP & Streak (4)">
          <div className="flex flex-wrap gap-2">
            <EdvanceBadge variant="xp-day">+25 XP</EdvanceBadge>
            <EdvanceBadge variant="xp-levelup">Level Up</EdvanceBadge>
            <EdvanceBadge variant="streak-presence">3 W Präsenz</EdvanceBadge>
            <EdvanceBadge variant="streak-home">5 Home</EdvanceBadge>
          </div>
        </Section>

        <Section title="EdvanceBadge — Mastery-Stufen (5)">
          <div className="flex flex-wrap gap-2">
            <EdvanceBadge variant="mastery-introduced">Einführung</EdvanceBadge>
            <EdvanceBadge variant="mastery-developing">In Entwicklung</EdvanceBadge>
            <EdvanceBadge variant="mastery-progressing">Fortschreitend</EdvanceBadge>
            <EdvanceBadge variant="mastery-proficient">Geübt</EdvanceBadge>
            <EdvanceBadge variant="mastery-mastered">Gemeistert</EdvanceBadge>
          </div>
        </Section>

        <Section title="MasteryBar — 5 Stufen via Score 0-100">
          <div className="flex flex-col gap-3 max-w-md">
            {[10, 50, 65, 80, 92].map((score) => (
              <MasteryBar key={score} score={score} showLabel />
            ))}
          </div>
        </Section>

        <Section title="StreakPill — Presence + Home + Multiplikator">
          <div className="flex flex-wrap gap-2">
            <StreakPill variant="presence" count={1} />
            <StreakPill variant="presence" count={3} multiplier={1.1} />
            <StreakPill variant="presence" count={5} multiplier={1.2} />
            <StreakPill variant="presence" count={8} multiplier={1.3} />
            <StreakPill variant="home" count={12} />
            <StreakPill variant="home" count={5} frozen />
          </div>
        </Section>

        <Section title="RarityBadge — 4 Stufen × 2 Formen">
          <div className="flex flex-wrap items-end gap-6">
            <RarityBadge rarity="bronze" label="Bronze"><Star fill="currentColor" /></RarityBadge>
            <RarityBadge rarity="silver" label="Silber"><Star fill="currentColor" /></RarityBadge>
            <RarityBadge rarity="gold" label="Gold"><Star fill="currentColor" /></RarityBadge>
            <RarityBadge rarity="platinum" label="Platin"><Star fill="currentColor" /></RarityBadge>
            <RarityBadge rarity="platinum" form="shield" label="Klasse 10" size="lg">10</RarityBadge>
          </div>
        </Section>

        <Section title="StatCard">
          <div className="grid grid-cols-3 gap-3">
            <StatCard value="42" label="Aufgaben heute" icon="📘" color="var(--color-primary)" />
            <StatCard value="+12 %" label="Mastery Δ" icon="📈" color="var(--color-success-eltern)" trend="+12 %" />
            <StatCard value="3" label="Lücken" icon="⚠️" color="var(--color-error-gap)" trend="-1" />
          </div>
        </Section>

        <Section title="AvatarInitials">
          <div className="flex gap-3">
            {['Lena Fischer', 'Mehmet Yılmaz', 'Sophie Becker', 'Tom Hartmann'].map((n) => (
              <AvatarInitials key={n} name={n} size="lg" />
            ))}
          </div>
        </Section>

        <Section title="ProgressStep">
          <ProgressStep steps={['Daten', 'Fächer', 'Tarif', 'Coach', 'Summary']} current={2} />
        </Section>

        <Section title="EmptyState">
          <EdvanceCard>
            <EmptyState icon="🌱" title="Noch leer" description="Beispiel-Empty-State." />
          </EdvanceCard>
        </Section>

        <Section title="LoadingPulse">
          <LoadingPulse type="list" lines={3} />
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}
