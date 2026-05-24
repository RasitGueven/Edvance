import { useId, type JSX } from 'react'

export type PlotFn = {
  fn: (x: number) => number
  color: string
  label: string
}

type Props = {
  functions: PlotFn[]
  size?: number
}

const RANGE = 10 // sichtbarer Bereich: -RANGE … +RANGE
const STEP = 0.05 // Abtastschritt für glatte Kurven

export function CoordinateSystem({ functions, size = 420 }: Props): JSX.Element {
  const clipId = useId()
  const span = RANGE * 2

  // Mathe-Koordinate -> SVG-Pixel
  const sx = (x: number): number => ((x + RANGE) / span) * size
  const sy = (y: number): number => ((RANGE - y) / span) * size

  const ticks: number[] = []
  for (let t = -RANGE; t <= RANGE; t += 1) ticks.push(t)

  const buildPoints = (fn: (x: number) => number): string => {
    const pts: string[] = []
    for (let x = -RANGE; x <= RANGE + 1e-9; x += STEP) {
      const y = fn(x)
      if (!Number.isFinite(y)) continue
      pts.push(`${sx(x).toFixed(2)},${sy(y).toFixed(2)}`)
    }
    return pts.join(' ')
  }

  return (
    <div className="flex flex-col gap-4">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full rounded-xl border border-[var(--border)] bg-card"
        role="img"
        aria-label="Koordinatensystem mit eingezeichneten Funktionen"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={size} height={size} />
          </clipPath>
        </defs>

        {/* 1er-Gitter */}
        {ticks.map((t) => (
          <g key={`grid-${t}`}>
            <line
              x1={sx(t)}
              y1={0}
              x2={sx(t)}
              y2={size}
              stroke="var(--border)"
              strokeWidth={t === 0 ? 0 : 1}
            />
            <line
              x1={0}
              y1={sy(t)}
              x2={size}
              y2={sy(t)}
              stroke="var(--border)"
              strokeWidth={t === 0 ? 0 : 1}
            />
          </g>
        ))}

        {/* Achsen */}
        <line x1={sx(-RANGE)} y1={sy(0)} x2={sx(RANGE)} y2={sy(0)} stroke="var(--text-muted)" strokeWidth={2} />
        <line x1={sx(0)} y1={sy(-RANGE)} x2={sx(0)} y2={sy(RANGE)} stroke="var(--text-muted)" strokeWidth={2} />

        {/* Achsenbeschriftung (jede 2. Einheit, ohne 0) */}
        {ticks
          .filter((t) => t !== 0 && t % 2 === 0)
          .map((t) => (
            <g key={`lbl-${t}`} fill="var(--text-muted)" fontSize="11">
              <text x={sx(t)} y={sy(0) + 14} textAnchor="middle">
                {t}
              </text>
              <text x={sx(0) - 8} y={sy(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}

        {/* Funktionsgraphen */}
        <g clipPath={`url(#${clipId})`}>
          {functions.map((f, i) => (
            <polyline
              key={`fn-${i}`}
              points={buildPoints(f.fn)}
              fill="none"
              stroke={f.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>

      {functions.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {functions.map((f, i) => (
            <span key={`leg-${i}`} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-6 rounded-full"
                style={{ background: f.color }}
              />
              <span className="text-[var(--text-secondary)]">{f.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
