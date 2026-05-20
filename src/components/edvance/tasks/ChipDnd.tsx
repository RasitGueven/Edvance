// Geteilte Drag-Primitive für Cloze-DnD und Tabellen-Beschriftung.
// dnd-kit deckt Maus und Touch sauber ab; zusätzlich Tap-Fallback für
// Schüler:innen ohne Drag-Geste (iPad in Hülle, Maus-User).
//
// Datenmodell: ein Chip-Pool (id → label) und Slot-Targets. Eltern-
// komponente besitzt das Mapping `slotId → chipId | null`.

import { useState, type JSX } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'

export type ChipItem = { id: string; label: string }

export type ChipDndProps = {
  chips: ChipItem[]
  // slotId → chipId | null. Eltern hält den Zustand, damit das Widget
  // stateless bleibt und der Grader denselben State sieht.
  assignments: Record<string, string | null>
  onAssign: (slotId: string, chipId: string | null) => void
  children: (helpers: ChipDndHelpers) => JSX.Element
  disabled?: boolean
}

export type ChipDndHelpers = {
  renderChipPool: () => JSX.Element
  renderSlot: (slotId: string, placeholder?: string) => JSX.Element
}

export function ChipDnd({
  chips,
  assignments,
  onAssign,
  children,
  disabled,
}: ChipDndProps): JSX.Element {
  const [armed, setArmed] = useState<string | null>(null) // tap-fallback: armierter Chip

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  )

  const usedChipIds = new Set(
    Object.values(assignments).filter((v): v is string => v !== null),
  )

  function handleDragEnd(e: DragEndEvent): void {
    const chipId = String(e.active.id)
    const slotId = e.over ? String(e.over.id) : null
    if (slotId === null) {
      // Drop ausserhalb → Chip aus eventuellem Slot lösen
      const prev = Object.entries(assignments).find(([, v]) => v === chipId)?.[0]
      if (prev) onAssign(prev, null)
      return
    }
    placeChip(slotId, chipId)
  }

  function placeChip(slotId: string, chipId: string): void {
    // Wenn Chip woanders steckt → dort lösen
    const prevSlot = Object.entries(assignments).find(([, v]) => v === chipId)?.[0]
    if (prevSlot && prevSlot !== slotId) onAssign(prevSlot, null)
    // Wenn Ziel-Slot belegt war → freigeben (Chip kommt zurück in Pool)
    onAssign(slotId, chipId)
  }

  function tapChip(chipId: string): void {
    if (disabled) return
    setArmed((prev) => (prev === chipId ? null : chipId))
  }

  function tapSlot(slotId: string): void {
    if (disabled) return
    if (armed) {
      placeChip(slotId, armed)
      setArmed(null)
      return
    }
    // Slot leeren beim Tap auf belegten Slot
    if (assignments[slotId]) onAssign(slotId, null)
  }

  const renderChipPool = (): JSX.Element => (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => {
        const used = usedChipIds.has(c.id)
        if (used) return null
        return (
          <DraggableChip
            key={c.id}
            chip={c}
            armed={armed === c.id}
            onTap={() => tapChip(c.id)}
            disabled={disabled ?? false}
          />
        )
      })}
      {chips.every((c) => usedChipIds.has(c.id)) && (
        <span className="text-xs text-[var(--color-text-tertiary)]">
          Alle Karten platziert. Tippe einen Slot an, um wieder freizugeben.
        </span>
      )}
    </div>
  )

  const renderSlot = (slotId: string, placeholder?: string): JSX.Element => {
    const chipId = assignments[slotId] ?? null
    const chip = chipId ? chips.find((c) => c.id === chipId) ?? null : null
    return (
      <DropSlot
        slotId={slotId}
        chip={chip}
        placeholder={placeholder ?? '…'}
        armed={armed !== null}
        onTap={() => tapSlot(slotId)}
      />
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {children({ renderChipPool, renderSlot })}
    </DndContext>
  )
}

function DraggableChip({
  chip,
  armed,
  onTap,
  disabled,
}: {
  chip: ChipItem
  armed: boolean
  onTap: () => void
  disabled: boolean
}): JSX.Element {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: chip.id,
    disabled,
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onTap}
      {...listeners}
      {...attributes}
      className={`inline-flex h-11 select-none items-center rounded-[var(--radius-md)] border px-3 text-sm font-medium transition-shadow ${
        armed
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-md'
          : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm hover:shadow-md'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      {chip.label}
    </button>
  )
}

function DropSlot({
  slotId,
  chip,
  placeholder,
  armed,
  onTap,
}: {
  slotId: string
  chip: ChipItem | null
  placeholder: string
  armed: boolean
  onTap: () => void
}): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: slotId })
  const filled = chip !== null
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onTap}
      className={`inline-flex min-h-11 min-w-[5.5rem] items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed px-3 text-sm transition-colors ${
        isOver || armed
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
          : filled
            ? 'border-[var(--color-primary)] bg-[var(--color-bg-surface)]'
            : 'border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)]'
      }`}
    >
      {filled ? chip.label : placeholder}
    </button>
  )
}
