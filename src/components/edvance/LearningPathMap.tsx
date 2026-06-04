import type { CSSProperties, JSX } from 'react'
import { Lock, Star, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MASTERY_STAGE_COLOR } from '@/lib/mastery'
import type { LearningPathNode } from '@/lib/mocks/lernpfad'

interface LearningPathMapProps {
  nodes: LearningPathNode[]
  /** Wird nur für freigeschaltete Knoten (done/current) aufgerufen. */
  onSelectNode: (id: string) => void
  /** i18n-Labels (Komponente bleibt sprach-agnostisch). */
  labels: { locked: string; current: string }
}

const ROW_PX = 124 // vertikaler Abstand zwischen zwei Leveln
const AMPLITUDE = 30 // Auslenkung der Serpentine in %

/** x-Position (in %) des Knotens i — sanftes Hin-und-Her wie eine Spielwelt. */
function nodeX(i: number): number {
  return 50 + AMPLITUDE * Math.sin(i * 0.9)
}
function nodeY(i: number, totalNodes: number): number {
  // Von unten nach oben: Pfad läuft aufwärts.
  return (totalNodes - 1 - i) * ROW_PX + ROW_PX / 2
}

/** Catmull-Rom → kubische Bézier: weicher, gewundener „Weg" durch alle Punkte. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`
  }
  return d
}

const champ = 'var(--color-gold-champagner)'
const altgold = 'var(--color-gold-altgold)'

export function LearningPathMap({
  nodes,
  onSelectNode,
  labels,
}: LearningPathMapProps): JSX.Element {
  const totalPx = nodes.length * ROW_PX
  const pts = nodes.map((_, i) => ({ x: nodeX(i), y: nodeY(i, nodes.length) }))

  // Grenze erreicht/gesperrt = aktueller Knoten (oder letzter freigeschalteter).
  let currentIndex = nodes.findIndex((n) => n.status === 'current')
  if (currentIndex < 0) {
    currentIndex = nodes.reduce((acc, n, i) => (n.status !== 'locked' ? i : acc), 0)
  }
  const reachedD = smoothPath(pts.slice(0, currentIndex + 1))
  const lockedD = smoothPath(pts.slice(currentIndex))

  return (
    <div className="relative mx-auto w-full max-w-md" style={{ height: totalPx }}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${totalPx}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* gesperrter Abschnitt: gedämpft, „noch nicht gegangen" */}
        <path d={lockedD} fill="none" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'color-mix(in srgb, var(--color-gold-champagner) 55%, white)' }} opacity={0.5} vectorEffect="non-scaling-stroke" />
        <path d={lockedD} fill="none" strokeWidth={4} strokeLinecap="round" strokeDasharray="0.1 7" style={{ stroke: 'var(--color-bg-surface)' }} opacity={0.7} vectorEffect="non-scaling-stroke" />

        {/* erreichter Abschnitt: voller Schotter-Weg mit Tiefe */}
        <path d={reachedD} fill="none" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'color-mix(in srgb, var(--color-navy-deep) 28%, transparent)' }} opacity={0.18} vectorEffect="non-scaling-stroke" />
        <path d={reachedD} fill="none" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: altgold }} vectorEffect="non-scaling-stroke" />
        <path d={reachedD} fill="none" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: champ }} vectorEffect="non-scaling-stroke" />
        <path d={reachedD} fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'color-mix(in srgb, var(--color-gold-champagner) 50%, white)' }} opacity={0.7} vectorEffect="non-scaling-stroke" />
      </svg>

      {nodes.map((node, i) => (
        <LevelNode
          key={node.id}
          node={node}
          index={i}
          x={nodeX(i)}
          y={nodeY(i, nodes.length)}
          isGoal={i === nodes.length - 1}
          onSelect={() => onSelectNode(node.id)}
          labels={labels}
        />
      ))}
    </div>
  )
}

interface LevelNodeProps {
  node: LearningPathNode
  index: number
  x: number
  y: number
  isGoal: boolean
  onSelect: () => void
  labels: { locked: string; current: string }
}

/** Glanz-Verlauf (Gem-Look) aus einem Farb-Ausdruck. */
function gloss(expr: string): string {
  return (
    `radial-gradient(circle at 34% 26%,` +
    ` color-mix(in srgb, ${expr} 48%, white) 0%,` +
    ` ${expr} 56%,` +
    ` color-mix(in srgb, ${expr} 72%, var(--color-navy-deep)) 100%)`
  )
}

function LevelNode({
  node,
  index,
  x,
  y,
  isGoal,
  onSelect,
  labels,
}: LevelNodeProps): JSX.Element {
  const isLocked = node.status === 'locked'
  const isCurrent = node.status === 'current'
  const isDone = node.status === 'done'

  const baseExpr = isLocked
    ? 'var(--color-bg-subtle)'
    : isCurrent
      ? 'var(--color-primary)'
      : MASTERY_STAGE_COLOR[node.stage]

  const buttonStyle: CSSProperties = {
    background: gloss(baseExpr),
    boxShadow:
      '0 7px 16px color-mix(in srgb, var(--color-navy-deep) 30%, transparent),' +
      ' inset 0 3px 4px color-mix(in srgb, white 55%, transparent),' +
      ' inset 0 -5px 7px color-mix(in srgb, var(--color-navy-deep) 22%, transparent)',
  }

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
      style={{ left: `${x}%`, top: y }}
    >
      {/* Ziel-Wimpel über dem letzten Knoten */}
      {isGoal && (
        <svg className="absolute -top-12 left-1/2 h-12 w-12 -translate-x-1/2" viewBox="0 0 48 48" aria-hidden="true">
          <rect x="22" y="6" width="3" height="38" rx="1.5" fill="color-mix(in srgb, var(--color-gold-warning) 60%, var(--color-navy-deep))" />
          <path d="M25 8 L44 15 L25 22 Z" fill="var(--color-accent)" />
          <path d="M25 8 L44 15 L35 15 Z" fill="color-mix(in srgb, var(--color-accent) 70%, var(--color-navy-deep))" />
        </svg>
      )}

      {isCurrent && (
        <span className="absolute -top-8 z-10 animate-bounce whitespace-nowrap rounded-[var(--radius-full)] bg-[var(--color-primary)] px-3 py-1 text-[10px] font-bold text-white shadow-md">
          {labels.current}
        </span>
      )}

      <button
        type="button"
        onClick={onSelect}
        disabled={isLocked}
        aria-label={`${node.clusterName}${isLocked ? ` — ${labels.locked}` : ''}`}
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)]',
          'border-4 border-[var(--color-bg-surface)] transition-all duration-base ease-bounce',
          isLocked
            ? 'cursor-not-allowed opacity-70'
            : 'hover:-translate-y-1 active:translate-y-0',
          isCurrent && 'ring-4 ring-[color-mix(in_srgb,var(--color-primary-light)_70%,transparent)] animate-pulse',
        )}
        style={buttonStyle}
      >
        {isLocked ? (
          <Lock className="h-6 w-6 text-[var(--color-text-tertiary)] drop-shadow" aria-hidden="true" />
        ) : isCurrent ? (
          <Play className="h-7 w-7 translate-x-0.5 fill-white text-white drop-shadow" aria-hidden="true" />
        ) : (
          <Star className="h-7 w-7 fill-white text-white drop-shadow" aria-hidden="true" />
        )}

        <span
          className={cn(
            'absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center',
            'rounded-[var(--radius-full)] border-2 border-[var(--color-bg-surface)] text-[11px] font-bold shadow-sm',
            isDone || isCurrent
              ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]'
              : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)]',
          )}
        >
          {index + 1}
        </span>
      </button>

      {/* Label in lesbarer Pille (Kontrast über jedem Untergrund) */}
      <span
        className={cn(
          'max-w-[8rem] truncate rounded-[var(--radius-full)] px-2.5 py-0.5 text-center text-xs font-semibold shadow-sm backdrop-blur-sm',
          isLocked
            ? 'text-[var(--color-text-secondary)]'
            : 'text-[var(--color-text-primary)]',
        )}
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-surface) 82%, transparent)' }}
      >
        {node.shortLabel}
      </span>
    </div>
  )
}
