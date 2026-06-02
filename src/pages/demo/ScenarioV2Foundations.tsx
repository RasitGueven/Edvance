import { useState, useEffect, type JSX } from 'react'
import { EdvanceCard } from '@/components/edvance'

/**
 * Phase-2-Verifikation: zeigt alle v2-Animation-Utilities (animate-fly-in,
 * animate-xp-float, animate-count-up, animate-bar-grow) sowie die
 * Glass-Foundations (glass-pill, glass-card, glass-button) korrekt **nur**
 * auf der dunklen .student-hero-Bühne. Auch die .light-source-Lichtquelle.
 */
export function ScenarioV2Foundations(): JSX.Element {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-6">
      {/* ── Light-Source + Glass auf dunkler Bühne ─────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
          1. Student-Hero + Light-Source + Glass-Foundations
        </h3>
        <div className="student-hero light-source rounded-[var(--radius-xl)] p-6 overflow-hidden">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="glass-pill px-4 py-1.5 text-sm text-white">12 W Präsenz</span>
            <span className="glass-pill px-4 py-1.5 text-sm text-white">5 Home</span>
            <button type="button" className="glass-button px-4 py-1.5 rounded-[var(--radius-md)] text-sm">
              Glas-Button
            </button>
          </div>
          <div className="glass-card mt-4 p-4 text-white text-sm">
            <p className="opacity-80">Glaseffekt ist NUR auf dieser dunklen Bühne erlaubt.</p>
            <p className="opacity-60 text-xs mt-1">Light-Source = ::before mit radial-gradient.</p>
          </div>
        </div>
      </section>

      {/* ── v2-Animations-Utilities ─────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
          2. v2-Animationen (Trigger alle 3,5 s)
        </h3>
        <div key={tick} className="grid grid-cols-2 gap-3">
          <EdvanceCard className="p-4 animate-fly-in">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">animate-fly-in</p>
            <p className="text-sm mt-1">Fliegt von unten ein</p>
          </EdvanceCard>
          <EdvanceCard className="p-4 animate-count-up">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">animate-count-up</p>
            <p className="text-2xl font-bold mt-1 text-[var(--color-primary)]">{tick * 10}</p>
          </EdvanceCard>
          <EdvanceCard className="p-4 col-span-2 relative">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">animate-xp-float (einmalig)</p>
            <span key={`xp-${tick}`} className="absolute right-4 top-4 text-sm font-bold text-[var(--color-accent)] animate-xp-float">
              +25 XP
            </span>
            <p className="text-sm mt-2">XP-Zähler taucht nur kurz auf — kein Endlos-Shimmer</p>
          </EdvanceCard>
          <EdvanceCard className="p-4 col-span-2">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">animate-bar-grow</p>
            <div className="mt-2 h-2.5 w-full rounded-full bg-[var(--color-bg-subtle)] overflow-hidden">
              <div key={`bar-${tick}`} className="h-full xp-bar-fill animate-bar-grow w-[72%]" />
            </div>
          </EdvanceCard>
        </div>
      </section>

      {/* ── Schatten-Hierarchie ─────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
          3. Schatten (v2, blau getönt)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(['xs', 'md', 'lg', 'xl'] as const).map((s) => (
            <div key={s} className={`p-5 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] shadow-${s}`}>
              <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">--shadow-{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mastery-Stufen-Vorschau (Token-Colors direkt; Badge-Varianten kommen in Phase 3a) ── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
          4. Mastery-Stufen (5) — Token-Vorschau
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { l: 'Introduced',  c: 'mastery-introduced',  bg: 'bg-subtle' },
            { l: 'Developing',  c: 'mastery-developing',  bg: 'gold-warning-light' },
            { l: 'Progressing', c: 'mastery-progressing', bg: 'mastery-progressing-bg' },
            { l: 'Proficient',  c: 'mastery-proficient',  bg: 'success-answer-light' },
            { l: 'Mastered',    c: 'mastery-mastered',    bg: 'success-light' },
          ].map((s) => (
            <span
              key={s.l}
              className="inline-flex items-center rounded-[var(--radius-sm)] px-3 py-1 text-xs font-semibold uppercase tracking-wider border"
              style={{
                color: `var(--color-${s.c})`,
                backgroundColor: `var(--color-${s.bg})`,
                borderColor: `var(--color-${s.c})`,
              }}
            >
              {s.l}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
          Die fertige <code className="bg-[var(--color-bg-subtle)] px-1 rounded">EdvanceBadge</code> mit
          <code className="bg-[var(--color-bg-subtle)] px-1 rounded ml-1">mastery-*</code>-Varianten kommt in Phase 3a.
        </p>
      </section>
    </div>
  )
}
