import { useState } from 'react'
import type { JSX } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { EdvanceCard, EdvanceBadge } from '@/components/edvance'
import { TaskPreviewCard } from '@/components/edvance/tasks/TaskPreviewCard'
import {
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
  INPUT_TYPE_LABELS,
} from '@/lib/taskLabels'
import { updateTaskDiagnostic } from '@/lib/supabase/tasks'
import type { CognitiveType, InputType, Task } from '@/types'
import { COG_TYPES, INPUT_TYPES, SELECT_CLASS, type Edit } from './shared'

export function TaskRow({
  task,
  onSaved,
}: {
  task: Task
  onSaved: () => void
}): JSX.Element {
  const [edit, setEdit] = useState<Edit>({
    is_diagnostic: task.is_diagnostic,
    difficulty: task.difficulty,
    input_type: task.input_type,
    cognitive_type: task.cognitive_type,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const save = async (): Promise<void> => {
    setBusy(true)
    setErr(null)
    const { error } = await updateTaskDiagnostic(task.id, edit)
    setBusy(false)
    if (error) {
      setErr(error)
      return
    }
    onSaved()
  }

  return (
    <EdvanceCard className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-[var(--text-primary)] line-clamp-2">
          {task.title ?? task.question ?? `Aufgabe ${task.id.slice(0, 8)}`}
        </p>
        <EdvanceBadge variant={edit.is_diagnostic ? 'mastered' : 'muted'}>
          {edit.is_diagnostic ? 'In Diagnose aktiv' : 'Nicht in Diagnose'}
        </EdvanceBadge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-[var(--text-muted)]">Schwierigkeit</Label>
          <select
            className={SELECT_CLASS}
            value={edit.difficulty ?? ''}
            onChange={(e) =>
              setEdit({ ...edit, difficulty: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">Bitte wählen</option>
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-[var(--text-muted)]">Antwortformat</Label>
          <select
            className={SELECT_CLASS}
            value={edit.input_type ?? ''}
            onChange={(e) =>
              setEdit({ ...edit, input_type: (e.target.value || null) as InputType | null })
            }
          >
            <option value="">Bitte wählen</option>
            {INPUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {INPUT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-[var(--text-muted)]">Aufgaben-Anspruch</Label>
          <select
            className={SELECT_CLASS}
            value={edit.cognitive_type ?? ''}
            onChange={(e) =>
              setEdit({
                ...edit,
                cognitive_type: (e.target.value || null) as CognitiveType | null,
              })
            }
          >
            <option value="">Bitte wählen</option>
            {COG_TYPES.map((t) => (
              <option key={t} value={t}>
                {COGNITIVE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={edit.is_diagnostic}
          onChange={(e) => setEdit({ ...edit, is_diagnostic: e.target.checked })}
        />
        Diese Aufgabe im Diagnose-Test verwenden
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4" /> Vorschau schließen
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" /> Aufgabe ansehen
            </>
          )}
        </Button>
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? 'Speichert …' : 'Speichern'}
        </Button>
      </div>

      {showPreview && (
        <div className="animate-fade-in border-t border-[var(--border)] pt-4">
          <TaskPreviewCard task={task} />
        </div>
      )}

      {err && <p className="text-sm text-[var(--destructive)]">{err}</p>}
    </EdvanceCard>
  )
}
