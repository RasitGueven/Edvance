import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EdvanceCard, EdvanceBadge } from '@/components/edvance'
import { updateTaskDiagnostic } from '@/lib/supabase/tasks'
import type { CognitiveType, InputType, Task } from '@/types'
import { SELECT_CLASS } from './NewTaskForm'

const INPUT_TYPES: InputType[] = ['MC', 'FREE_INPUT', 'STEPS', 'MATCHING', 'DRAW']
const COG_TYPES: CognitiveType[] = ['FACT', 'TRANSFER', 'ANALYSIS']
const DIFFICULTIES = [1, 2, 3, 4, 5]

type Edit = {
  is_diagnostic: boolean
  difficulty: number | null
  input_type: InputType | null
  cognitive_type: CognitiveType | null
}

export function TaskRow({ task, onSaved }: { task: Task; onSaved: () => void }): JSX.Element {
  const [edit, setEdit] = useState<Edit>({
    is_diagnostic: task.is_diagnostic,
    difficulty: task.difficulty,
    input_type: task.input_type,
    cognitive_type: task.cognitive_type,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

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
          {task.title ?? task.question ?? `task:${task.id.slice(0, 8)}`}
        </p>
        <EdvanceBadge variant={edit.is_diagnostic ? 'success' : 'muted'}>
          {edit.is_diagnostic ? 'Diagnostisch' : 'Inaktiv'}
        </EdvanceBadge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={edit.is_diagnostic}
            onChange={(e) => setEdit({ ...edit, is_diagnostic: e.target.checked })}
          />
          is_diagnostic
        </label>
        <select
          className={SELECT_CLASS}
          value={edit.difficulty ?? ''}
          onChange={(e) =>
            setEdit({ ...edit, difficulty: e.target.value ? Number(e.target.value) : null })
          }
        >
          <option value="">Diff –</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>Diff {d}</option>)}
        </select>
        <select
          className={SELECT_CLASS}
          value={edit.input_type ?? ''}
          onChange={(e) =>
            setEdit({ ...edit, input_type: (e.target.value || null) as InputType | null })
          }
        >
          <option value="">Input –</option>
          {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className={SELECT_CLASS}
          value={edit.cognitive_type ?? ''}
          onChange={(e) =>
            setEdit({ ...edit, cognitive_type: (e.target.value || null) as CognitiveType | null })
          }
        >
          <option value="">Kog –</option>
          {COG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? '…' : 'Speichern'}
        </Button>
      </div>
      {err && <p className="text-sm text-[var(--destructive)]">{err}</p>}
    </EdvanceCard>
  )
}
