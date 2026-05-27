import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { masteryStage, type MasteryStage } from '@/lib/mastery'

export interface MasteryBarProps {
  /** Score 0-100 (bevorzugt). Wird verwendet, wenn gesetzt. */
  score?: number
  /** Legacy Level 1-10 (für bestehende Aufrufe). Wird intern zu score = level * 10 umgerechnet. */
  level?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const STAGE_COLOR: Record<MasteryStage, string> = {
  introduced:  'var(--color-mastery-introduced)',
  developing:  'var(--color-mastery-developing)',
  progressing: 'var(--color-mastery-progressing)',
  proficient:  'var(--color-mastery-proficient)',
  mastered:    'var(--color-mastery-mastered)',
}

const STAGE_LABEL: Record<MasteryStage, string> = {
  introduced:  'Einführung',
  developing:  'In Entwicklung',
  progressing: 'Fortschreitend',
  proficient:  'Geübt',
  mastered:    'Gemeistert',
}

const TRACK_HEIGHT: Record<NonNullable<MasteryBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function MasteryBar({
  score,
  level,
  showLabel = false,
  size = 'md',
  className,
}: MasteryBarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const effectiveScore = (() => {
    if (typeof score === 'number') return Math.min(100, Math.max(0, score))
    if (typeof level === 'number') return Math.min(100, Math.max(0, level * 10))
    return 0
  })()
  const stage = masteryStage(effectiveScore)
  const color = STAGE_COLOR[stage]
  const label = STAGE_LABEL[stage]

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {label}
          </span>
          <span className="text-xs font-bold" style={{ color }}>
            {Math.round(effectiveScore)} %
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-[var(--radius-full)] overflow-hidden bg-[var(--color-bg-subtle)]',
          TRACK_HEIGHT[size],
        )}
      >
        <div
          className="mastery-bar-fill h-full rounded-[var(--radius-full)]"
          style={{
            width: mounted ? `${effectiveScore}%` : '0%',
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}
