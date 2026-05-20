/**
 * Edvance Design-System v2 — Demo-Szene
 *
 * Einzige Stelle, an der der v2-Scope aktiv ist (data-design="v2").
 * Damit greifen tokens-demo.css und alle v2-Utility-Aliase aus
 * @theme inline. Produktive Routen bleiben unberuehrt.
 */
import { useState, type JSX } from 'react'
import { cn } from '@/lib/utils'
import { V2Kit } from './V2Kit'
import { V2Student } from './V2Student'
import { V2Parent } from './V2Parent'

type View = 'kit' | 'student' | 'parent'

const VIEWS: { id: View; label: string }[] = [
  { id: 'kit',     label: 'UI-Kit (Schritt 3+4)'    },
  { id: 'student', label: 'Schueler (Schritt 5)'    },
  { id: 'parent',  label: 'Eltern (Schritt 6)'      },
]

export function ScenarioV2(): JSX.Element {
  const [view, setView] = useState<View>('kit')

  return (
    <div data-design="v2" className="flex flex-col gap-4 -mx-1 px-1 py-1">
      <div className="inline-flex gap-1 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-md p-1 self-start shadow-xs">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md transition-colors duration-instant',
              v.id === view
                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'kit'     ? <V2Kit />     : null}
      {view === 'student' ? <V2Student /> : null}
      {view === 'parent'  ? <V2Parent />  : null}
    </div>
  )
}
