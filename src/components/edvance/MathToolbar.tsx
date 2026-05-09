// Klickbare Toolbar mit haeufig genutzten Mathe-Symbolen.
// onInsert wird mit dem einzufuegenden Zeichen aufgerufen — der Aufrufer
// kuemmert sich um das tatsaechliche Einfuegen an der Cursor-Position.

import type { JSX } from 'react'

type MathToolbarProps = {
  onInsert: (symbol: string) => void
  className?: string
}

type Symbol = { label: string; insert: string; aria: string }

const SYMBOLS: Symbol[] = [
  { label: 'x²', insert: '²', aria: 'Quadrat' },
  { label: 'x³', insert: '³', aria: 'Hoch drei' },
  { label: '√', insert: '√', aria: 'Wurzel' },
  { label: 'π', insert: 'π', aria: 'Pi' },
  { label: '·', insert: '·', aria: 'Mal-Punkt' },
  { label: '×', insert: '×', aria: 'Mal-Kreuz' },
  { label: '÷', insert: '÷', aria: 'Geteilt' },
  { label: '±', insert: '±', aria: 'Plus minus' },
  { label: '½', insert: '½', aria: 'Ein halb' },
  { label: '⅓', insert: '⅓', aria: 'Ein drittel' },
  { label: '¼', insert: '¼', aria: 'Ein viertel' },
  { label: '≤', insert: '≤', aria: 'Kleiner gleich' },
  { label: '≥', insert: '≥', aria: 'Groesser gleich' },
  { label: '≠', insert: '≠', aria: 'Ungleich' },
  { label: '≈', insert: '≈', aria: 'Ungefaehr' },
  { label: '∞', insert: '∞', aria: 'Unendlich' },
]

export function MathToolbar({ onInsert, className }: MathToolbarProps): JSX.Element {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ''}`}>
      {SYMBOLS.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onInsert(s.insert)}
          aria-label={s.aria}
          title={s.aria}
          className="flex h-9 min-w-[36px] items-center justify-center rounded-lg border border-border bg-card px-2 font-mono text-sm font-semibold text-foreground transition-colors hover:bg-primary/5 hover:border-primary"
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
