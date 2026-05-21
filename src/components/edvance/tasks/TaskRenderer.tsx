import { useMemo, type JSX } from 'react'
import type { ScreeningItem, ScreeningTeilaufgabe } from '@/types'
import type { RawAnswer } from '@/lib/screening/screeningRuntime'
import { isMcPayload } from '@/lib/screening/screeningRuntime'
import { MCWidget } from './MCWidget'
import { NumericWidget } from './NumericWidget'
import { OpenWidget } from './OpenWidget'
import { MultiStepWidget } from './MultiStepWidget'
import { ClozeDndWidget, isClozeDndPayload } from './ClozeDndWidget'
import { TableLabelWidget, isTableLabelPayload } from './TableLabelWidget'
import { TaskDrawingSlot } from './TaskDrawingSlot'
import { TaskPhotoSlot } from './TaskPhotoSlot'

export type TaskState = {
  mcIndex: number | null
  text: string
  steps: Record<string, string>
  slots: Record<string, string | null>
  drawing: string | null
  uploads: string[]
}

export const EMPTY_TASK_STATE: TaskState = {
  mcIndex: null,
  text: '',
  steps: {},
  slots: {},
  drawing: null,
  uploads: [],
}

// Drawing macht nur bei freien Antworten Sinn (Rechenweg). Bei MC und
// allen Zuordnungs-Typen klickt das Kind ohnehin nur — Skizzieren würde
// nur ablenken. STEPS_FINAL = Multi-Step zählt als frei.
function showDrawingSlot(item: ScreeningItem): boolean {
  if (resolveTeilaufgaben(item)) return true
  return item.input_type === 'NUMERIC' || item.input_type === 'OPEN'
}

type Props = {
  item: ScreeningItem
  state: TaskState
  onChange: (next: TaskState) => void
  onEnter?: () => void
  disabled?: boolean
  // Für Foto-Upload: ohne studentId kein RLS-konformer Pfad → Slot bleibt aus.
  studentId?: string | null
}

function resolveTeilaufgaben(item: ScreeningItem): ScreeningTeilaufgabe[] | null {
  const raw = item.teilaufgaben
  if (!Array.isArray(raw) || raw.length === 0) return null
  return raw
}

// Liefert den Antwort-Wert im Format, das `buildScreeningAnswer` erwartet.
function slotIds(item: ScreeningItem): string[] {
  if (item.input_type === 'CLOZE_DND' && isClozeDndPayload(item.payload)) {
    return item.payload.segments
      .filter((s): s is { kind: 'blank'; id: string } => s.kind === 'blank')
      .map((s) => s.id)
  }
  if (item.input_type === 'TABLE_LABEL' && isTableLabelPayload(item.payload)) {
    return item.payload.rows.map((r) => r.slotId)
  }
  return []
}

export function buildRawAnswer(item: ScreeningItem, s: TaskState): RawAnswer {
  const drawing = s.drawing ?? null
  const uploads = s.uploads.length > 0 ? s.uploads : undefined
  if (item.input_type === 'MC') return { kind: 'mc', index: s.mcIndex, drawing, uploads }
  if (item.input_type === 'NUMERIC') return { kind: 'numeric', value: s.text, drawing, uploads }
  if (item.input_type === 'CLOZE_DND' || item.input_type === 'TABLE_LABEL') {
    return { kind: 'slotmap', slots: s.slots, drawing, uploads }
  }
  if (resolveTeilaufgaben(item)) return { kind: 'multistep', steps: s.steps, drawing, uploads }
  return { kind: 'open', text: s.text, drawing, uploads }
}

// Ist die Antwort vollständig genug, dass „Weiter" sinnvoll ist?
// Bewusst tolerant: bei OPEN reicht nicht-leerer Text. Bei MULTI-STEP müssen
// alle Teilaufgaben befüllt sein, damit Coach/Auto-Grader vollständig
// bewerten können.
export function isAnswerReady(item: ScreeningItem, s: TaskState): boolean {
  if (item.input_type === 'MC') return s.mcIndex !== null
  const slots = slotIds(item)
  if (slots.length > 0) return slots.every((id) => !!s.slots[id])
  const tas = resolveTeilaufgaben(item)
  if (tas) return tas.every((ta) => (s.steps[ta.key] ?? '').trim().length > 0)
  return s.text.trim().length > 0
}

function renderWidget(
  item: ScreeningItem,
  state: TaskState,
  onChange: (next: TaskState) => void,
  onEnter: (() => void) | undefined,
  disabled: boolean | undefined,
  teilaufgaben: ScreeningTeilaufgabe[] | null,
): JSX.Element {
  if (item.input_type === 'CLOZE_DND' && isClozeDndPayload(item.payload)) {
    return (
      <ClozeDndWidget
        payload={item.payload}
        assignments={state.slots}
        onChange={(slotId, chipId) =>
          onChange({ ...state, slots: { ...state.slots, [slotId]: chipId } })
        }
        disabled={disabled}
      />
    )
  }
  if (item.input_type === 'TABLE_LABEL' && isTableLabelPayload(item.payload)) {
    return (
      <TableLabelWidget
        payload={item.payload}
        assignments={state.slots}
        onChange={(slotId, chipId) =>
          onChange({ ...state, slots: { ...state.slots, [slotId]: chipId } })
        }
        disabled={disabled}
      />
    )
  }
  if (item.input_type === 'MC' && isMcPayload(item.payload)) {
    return (
      <MCWidget
        options={item.payload.options}
        selected={state.mcIndex}
        onChange={(idx) => onChange({ ...state, mcIndex: idx })}
        disabled={disabled ?? false}
      />
    )
  }
  if (teilaufgaben) {
    return (
      <MultiStepWidget
        steps={teilaufgaben}
        values={state.steps}
        onChange={(key, value) =>
          onChange({ ...state, steps: { ...state.steps, [key]: value } })
        }
        kontext={item.kontext ?? null}
        disabled={disabled}
      />
    )
  }
  if (item.input_type === 'NUMERIC') {
    return (
      <NumericWidget
        value={state.text}
        onChange={(v) => onChange({ ...state, text: v })}
        onEnter={onEnter}
        disabled={disabled}
      />
    )
  }
  return (
    <OpenWidget
      value={state.text}
      onChange={(v) => onChange({ ...state, text: v })}
      kontext={item.kontext ?? null}
      disabled={disabled}
    />
  )
}

export function TaskRenderer({
  item,
  state,
  onChange,
  onEnter,
  disabled,
  studentId,
}: Props): JSX.Element {
  const teilaufgaben = useMemo(() => resolveTeilaufgaben(item), [item])
  const widget = renderWidget(item, state, onChange, onEnter, disabled, teilaufgaben)
  if (!showDrawingSlot(item)) return widget
  return (
    <div className="flex flex-col gap-4">
      {widget}
      <TaskDrawingSlot
        value={state.drawing}
        onChange={(dataUrl) => onChange({ ...state, drawing: dataUrl })}
        disabled={disabled}
      />
      <TaskPhotoSlot
        studentId={studentId ?? null}
        uploads={state.uploads}
        onChange={(uploads) => onChange({ ...state, uploads })}
        disabled={disabled}
      />
    </div>
  )
}
