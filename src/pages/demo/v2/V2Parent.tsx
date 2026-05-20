/**
 * Edvance Design-System v2 — Eltern-App Showcase
 *
 * SCHRITT 6 — Eltern-App nutzt Stufe-1-Regeln: kein Verlauf, kein Glas,
 * keine Bounce-Animationen. Flacher Header, dezente Cards.
 * - Akzent-Gold nur als Badge, nie als Flaeche.
 * - Rot ausschliesslich --color-error-gap auf --color-error-gap-light.
 * - Gruen ausschliesslich --color-success-eltern (lebendiger).
 */
import type { JSX, ReactNode } from 'react'

function MetricBox({ label, value, hint }: { label: string; value: string; hint?: string }): JSX.Element {
  return (
    <div className="bg-[var(--color-bg-subtle)] rounded-lg p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">{label}</p>
      <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">{value}</p>
      {hint ? <p className="text-xs text-[var(--color-text-secondary)] mt-1">{hint}</p> : null}
    </div>
  )
}

function CompareRow({ label, before, after, tone }: { label: string; before: string; after: string; tone: 'up' | 'down' | 'flat' }): JSX.Element {
  const toneStyles: Record<typeof tone, string> = {
    up:   'bg-[var(--color-success-eltern-light)] text-[var(--color-success-eltern)]',
    down: 'bg-[var(--color-error-gap-light)] text-[var(--color-error-gap)]',
    flat: 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]',
  }
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--color-text-tertiary)] line-through">{before}</span>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{after}</span>
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm ${toneStyles[tone]}`}>
          {tone === 'up' ? '+' : tone === 'down' ? '−' : '·'}
        </span>
      </div>
    </div>
  )
}

function Card({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg p-5 shadow-md hover:-translate-y-0.5 hover:shadow-md transition-all duration-fast ease-out">
      {children}
    </div>
  )
}

export function V2Parent(): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Eltern-App · ruhig, faktisch. Flacher Header, dezente Hovers, Vergleichsdaten statt Status.
      </p>

      <header className="bg-[var(--color-primary)] rounded-[var(--radius-lg)] px-5 py-4 text-white shadow-md">
        <p className="text-[10px] uppercase tracking-widest text-white/70">Wochenrueckblick</p>
        <p className="text-lg font-semibold">Mia · Klasse 7b</p>
      </header>

      <Card>
        <h3 className="text-base font-semibold">Diese Woche</h3>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <MetricBox label="Lernzeit" value="4h 12m" hint="+38 min" />
          <MetricBox label="Themen" value="3" hint="abgeschlossen" />
          <MetricBox label="Streak" value="12" hint="Tage" />
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold">Vorher · Nachher</h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mt-1">
          Sachlicher Vergleich — positive Entwicklungen prominent, Luecken neutral benannt.
        </p>
        <div className="mt-3">
          <CompareRow label="Bruchrechnen — Sicherheit" before="62%" after="84%" tone="up" />
          <CompareRow label="Textaufgaben — Tempo"     before="3:20" after="2:45" tone="up" />
          <CompareRow label="Geometrie — Aufmerksamkeit" before="78%" after="71%" tone="down" />
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold">Coach-Notiz</h3>
        <blockquote className="text-sm text-[var(--color-text-secondary)] leading-relaxed mt-2 border-l-2 border-[var(--color-primary)] pl-3">
          „Mia ist diese Woche selbstbewusster geworden — sie traut sich auch an Aufgaben, die sie sonst uebersprungen hat."
        </blockquote>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-2">— Coach Yannik</p>
      </Card>
    </div>
  )
}
