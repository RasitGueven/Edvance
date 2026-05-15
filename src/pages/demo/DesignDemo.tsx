import { useState, type JSX, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ScenarioStudent } from './ScenarioStudent'
import { ScenarioCoach } from './ScenarioCoach'
import { ScenarioCelebration } from './ScenarioCelebration'
import { ScenarioSessionEnd } from './ScenarioSessionEnd'
import { ScenarioUIKit } from './ScenarioUIKit'

type TabId = 'student' | 'coach' | 'celebration' | 'session' | 'uikit'

type Tab = {
  id: TabId
  label: string
  sublabel: string
  component: () => JSX.Element
}

const TABS: Tab[] = [
  { id: 'student',     label: 'A',      sublabel: 'Schüler',       component: ScenarioStudent     },
  { id: 'coach',       label: 'B',      sublabel: 'Coach-Ansicht', component: ScenarioCoach       },
  { id: 'celebration', label: 'C',      sublabel: 'Level-Up',      component: ScenarioCelebration },
  { id: 'session',     label: 'D',      sublabel: 'Session-Ende',  component: ScenarioSessionEnd  },
  { id: 'uikit',       label: 'UI-Kit', sublabel: 'Komponenten',   component: ScenarioUIKit       },
]

function TabBar({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}): JSX.Element {
  return (
    <div className="flex overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
      {TABS.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-5 py-3 text-xs transition-colors shrink-0',
              'border-b-2 -mb-px',
              isActive
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
            )}
          >
            <span className={cn('font-bold', isActive ? 'text-sm' : 'text-sm')}>{tab.label}</span>
            <span className="text-[10px] uppercase tracking-wider">{tab.sublabel}</span>
          </button>
        )
      })}
    </div>
  )
}

function ScenarioShell({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] px-1">
        {label}
      </p>
      {children}
    </div>
  )
}

export function DesignDemo(): JSX.Element {
  const [active, setActive] = useState<TabId>('student')
  const tab = TABS.find((t) => t.id === active)!

  const LABELS: Record<TabId, string> = {
    student:     'Szenario A — Schüler löst eine MC-Aufgabe, sammelt XP und steigt im Niveau',
    coach:       'Szenario B — Coach beobachtet 4 Schüler live und kann eingreifen',
    celebration: 'Szenario C — Level-Up-Moment (max. 1× pro Session, moment-bg)',
    session:     'Szenario D — Session-Abschluss mit Fortschritt-Rückblick',
    uikit:       'Alle Basis-Komponenten auf einen Blick — Button, Badge, Card, Tokens',
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Premium Page-Header mit Gradient */}
      <div className="relative overflow-hidden bg-gradient-hero noise-overlay">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: 'var(--color-moment-gold)' }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-7 text-white">
          <p className="text-eyebrow opacity-70">Edvance · Demo</p>
          <h1 className="text-display text-2xl mt-1.5 leading-none">Design-System &amp; Szenarien</h1>
          <p className="mt-2 text-sm opacity-70 max-w-lg">
            5 Live-Szenarien plus UI-Kit — zeigt wie Pädagogik, Gamification und Design ineinandergreifen.
          </p>
        </div>
      </div>

      {/* Tab-Navigation */}
      <div className="mx-auto max-w-3xl glass-light">
        <TabBar active={active} onChange={setActive} />
      </div>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <ScenarioShell label={LABELS[active]}>
          <tab.component />
        </ScenarioShell>
      </main>
    </div>
  )
}
