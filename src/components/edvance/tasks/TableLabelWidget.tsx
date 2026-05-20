// Tabellen-Beschriftung. Tabelle wird ausgegeben, die Zeilen-Header sind
// leere Drop-Slots. Aus dem Label-Pool werden Begriffe wie „absolute
// Häufigkeit" / „relative Häufigkeit" zugeordnet.
//
// Payload-Shape (item.payload):
//   {
//     type: 'table-label',
//     columnHeaders: string[],
//     rows: [{ slotId: 's1', cells: string[] }, …],
//     labels: [{ id: 'L1', label: '…' }],
//   }
//
// Antwort: { slots: { s1: 'L1', … } }

import type { JSX } from 'react'
import { ChipDnd } from './ChipDnd'

export type TableLabelPayload = {
  type: 'table-label'
  columnHeaders: string[]
  rows: Array<{ slotId: string; cells: (string | number)[] }>
  labels: Array<{ id: string; label: string }>
  // Optional: erste Spalten-Header (z. B. „Häufigkeit"); leer = nichts
  firstColHeader?: string
}

export function isTableLabelPayload(p: unknown): p is TableLabelPayload {
  return (
    typeof p === 'object' &&
    p !== null &&
    (p as { type?: unknown }).type === 'table-label' &&
    Array.isArray((p as TableLabelPayload).rows) &&
    Array.isArray((p as TableLabelPayload).labels)
  )
}

export function TableLabelWidget({
  payload,
  assignments,
  onChange,
  disabled,
}: {
  payload: TableLabelPayload
  assignments: Record<string, string | null>
  onChange: (slotId: string, chipId: string | null) => void
  disabled?: boolean
}): JSX.Element {
  const chips = payload.labels.map((l) => ({ id: l.id, label: l.label }))
  return (
    <ChipDnd
      chips={chips}
      assignments={assignments}
      onAssign={onChange}
      disabled={disabled}
    >
      {({ renderChipPool, renderSlot }) => (
        <div className="flex flex-col gap-5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                    {payload.firstColHeader ?? ''}
                  </th>
                  {payload.columnHeaders.map((h, i) => (
                    <th
                      key={i}
                      className="border-b border-[var(--color-border)] px-3 py-2 text-right text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.rows.map((row) => (
                  <tr key={row.slotId}>
                    <td className="border-b border-[var(--color-border)] px-2 py-2">
                      {renderSlot(row.slotId, 'Zeile benennen')}
                    </td>
                    {row.cells.map((cell, i) => (
                      <td
                        key={i}
                        className="border-b border-[var(--color-border)] px-3 py-2 text-right tabular-nums text-[var(--color-text-primary)]"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Begriffe zum Zuordnen
            </p>
            {renderChipPool()}
          </div>
        </div>
      )}
    </ChipDnd>
  )
}
