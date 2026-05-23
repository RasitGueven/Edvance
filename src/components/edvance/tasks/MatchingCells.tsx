// LeftCell and RightCell sub-components for MatchingWidget.
// Extracted to keep MatchingWidget.tsx within the 400-line limit.

import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { JSX } from 'react'

export const CELL_BASE =
  'flex min-h-[48px] w-full select-none items-center gap-2 rounded-[var(--radius-md)] border-2 px-3 py-2 text-sm leading-snug text-[var(--color-text-primary)] transition-colors duration-fast'

export const LEFT_PREFIX = 'L:'
export const RIGHT_PREFIX = 'R:'

export function LeftCell({
  idx,
  label,
  tint,
  isArmed,
  disabled,
  onTap,
  register,
}: {
  idx: number
  label: string
  tint: { line: string; tintVar: string } | null
  isArmed: boolean
  disabled: boolean
  onTap: () => void
  register: (idx: number, el: HTMLDivElement | null) => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${LEFT_PREFIX}${idx}`,
    disabled,
  })
  const style: React.CSSProperties = { touchAction: 'none' }
  if (tint && !isArmed) {
    style.borderColor = tint.line
    style.background = tint.tintVar
  }
  const composedRef = (el: HTMLDivElement | null): void => {
    setNodeRef(el)
    register(idx, el)
  }
  return (
    <div
      ref={composedRef}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTap()
        }
      }}
      {...listeners}
      {...attributes}
      style={style}
      className={`${CELL_BASE} cursor-grab active:cursor-grabbing ${
        isArmed
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-md'
          : !tint
            ? 'border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-primary)]'
            : ''
      } ${isDragging ? 'invisible' : ''}`}
    >
      {tint && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: tint.line }}
        />
      )}
      <span className="flex-1">{label}</span>
    </div>
  )
}

export function RightCell({
  idx,
  label,
  tint,
  showDropHint,
  onTap,
  register,
}: {
  idx: number
  label: string
  tint: { line: string; tintVar: string } | null
  showDropHint: boolean
  onTap: () => void
  register: (idx: number, el: HTMLDivElement | null) => void
}): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: `${RIGHT_PREFIX}${idx}` })
  const style: React.CSSProperties = {}
  if (tint) {
    style.borderColor = tint.line
    style.background = tint.tintVar
  }
  const composedRef = (el: HTMLDivElement | null): void => {
    setNodeRef(el)
    register(idx, el)
  }
  return (
    <div
      ref={composedRef}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTap()
        }
      }}
      style={style}
      className={`${CELL_BASE} cursor-pointer ${
        isOver
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-md'
          : tint
            ? ''
            : showDropHint
              ? 'border-dashed border-[var(--color-primary)] bg-[var(--color-primary-light)]'
              : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-primary)]'
      }`}
    >
      {tint && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: tint.line }}
        />
      )}
      <span className="flex-1">{label}</span>
    </div>
  )
}
