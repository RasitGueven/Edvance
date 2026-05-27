import type { JSX } from 'react'
import { GraduationCap, CalendarDays, MessageSquare, Sparkles, AlertTriangle } from 'lucide-react'
import {
  EdvanceCard,
  EdvanceBadge,
  MasteryBar,
  StreakPill,
} from '@/components/edvance'

/**
 * V2Parent — Demo des Eltern-Erlebnisses.
 * Eltern-Energie: ruhig, kein Glas, kein Verlauf, kein Bounce.
 */
export function V2Parent(): JSX.Element {
  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <main className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mein Kind · Lena</h1>

        {/* Hero-Parent: flach, kein Verlauf */}
        <EdvanceCard variant="hero-parent" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-[var(--color-text-primary)]">Lena Fischer</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Klasse 8 · Gymnasium</p>
            </div>
            <EdvanceBadge variant="primary">Level 6</EdvanceBadge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StreakPill variant="presence" count={5} multiplier={1.2} />
            <StreakPill variant="home" count={12} />
            <span className="ml-auto text-sm font-semibold text-[var(--color-text-secondary)]">2.870 XP</span>
          </div>
        </EdvanceCard>

        {/* Lernfortschritt */}
        <EdvanceCard>
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Lernfortschritt
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { subject: 'Mathematik', score: 72 },
              { subject: 'Deutsch',    score: 58 },
              { subject: 'Englisch',   score: 85 },
            ].map((s) => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm">{s.subject}</span>
                <div className="flex-1"><MasteryBar score={s.score} showLabel size="sm" /></div>
              </div>
            ))}
          </div>
        </EdvanceCard>

        {/* Stärken */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-success-eltern)] mb-2 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Stärken
          </h3>
          <EdvanceCard accent="strength" className="py-4">
            <p className="text-sm font-semibold">Bruchrechnen sicher</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Erweitern, Kürzen, Vergleichen auf Klasse-7-Niveau routiniert.
            </p>
          </EdvanceCard>
        </div>

        {/* Lücken (leise) */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-error-gap)] mb-2 inline-flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Lücken
          </h3>
          <EdvanceCard accent="gap" className="py-4">
            <p className="text-sm font-semibold">Lineare Funktionen</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Schwierigkeiten bei Steigung & y-Achsen-Abschnitt aus Tabelle.
            </p>
          </EdvanceCard>
        </div>

        {/* Coach-Note als Zitat-Block */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2 inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Coach-Einschätzung
          </h3>
          <blockquote className="border-l-4 border-l-[var(--color-primary)] pl-4 py-1">
            <p className="text-sm italic leading-relaxed text-[var(--color-text-secondary)]">
              Wir setzen den Fokus die kommenden 4 Wochen auf lineare Funktionen — ein klar
              abgegrenzter Block, der schnell sichtbare Erfolge bringt.
            </p>
            <footer className="mt-2 text-xs text-[var(--color-text-tertiary)]">— Sarah K., Coach</footer>
          </blockquote>
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)] text-center">
          <CalendarDays className="inline h-3 w-3 mr-1" />
          Nächste Session: Dienstag 16:30 Uhr · Raum A2
        </p>
      </main>
    </div>
  )
}
