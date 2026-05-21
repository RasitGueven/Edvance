// Lückentext mit Wort-Pool. Schüler:in zieht (oder tippt) Chips aus dem
// Pool in die Lücken. Distraktoren im Pool erhöhen die AFB.
//
// Payload-Shape (item.payload):
//   {
//     type: 'cloze-dnd',
//     segments: [{kind:'text',text:'…'} | {kind:'blank',id:'b1'}],
//     chips:    [{id, label}],
//   }
//
// Antwort: { slots: { b1: 'chipId' | … } }

import type { JSX } from 'react'
import { ChipDnd } from './ChipDnd'

export type ClozeDndPayload = {
  type: 'cloze-dnd'
  segments: Array<
    { kind: 'text'; text: string } | { kind: 'blank'; id: string; placeholder?: string }
  >
  chips: Array<{ id: string; label: string }>
}

export function isClozeDndPayload(p: unknown): p is ClozeDndPayload {
  return (
    typeof p === 'object' &&
    p !== null &&
    (p as { type?: unknown }).type === 'cloze-dnd' &&
    Array.isArray((p as ClozeDndPayload).segments) &&
    Array.isArray((p as ClozeDndPayload).chips)
  )
}

export function ClozeDndWidget({
  payload,
  assignments,
  onChange,
  disabled,
}: {
  payload: ClozeDndPayload
  assignments: Record<string, string | null>
  onChange: (slotId: string, chipId: string | null) => void
  disabled?: boolean
}): JSX.Element {
  return (
    <ChipDnd
      chips={payload.chips}
      assignments={assignments}
      onAssign={onChange}
      disabled={disabled}
    >
      {({ renderChipPool, renderSlot }) => (
        <div className="flex flex-col gap-5">
          <p className="flex flex-wrap items-center gap-x-1 gap-y-2 text-base leading-loose text-[var(--color-text-primary)]">
            {payload.segments.map((seg, i) =>
              seg.kind === 'text' ? (
                <span key={i}>{seg.text}</span>
              ) : (
                <span key={i} className="inline-flex">
                  {renderSlot(seg.id, seg.placeholder)}
                </span>
              ),
            )}
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Wörter zum Einsetzen
            </p>
            {renderChipPool()}
          </div>
        </div>
      )}
    </ChipDnd>
  )
}
