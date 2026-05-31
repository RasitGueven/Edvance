import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EdvanceCard, EdvanceBadge } from '@/components/edvance'
import {
  createDiagnosticTask,
  getMicroskillsByCluster,
  updateTaskDiagnostic,
} from '@/lib/supabase/tasks'
import type {
  CognitiveType,
  DiagnosticTaskInput,
  InputType,
  Microskill,
  SkillCluster,
  Task,
} from '@/types'

const INPUT_TYPES: InputType[] = ['MC', 'FREE_INPUT', 'STEPS', 'MATCHING', 'DRAW']
const COG_TYPES: CognitiveType[] = ['FACT', 'TRANSFER', 'ANALYSIS']
const DIFFICULTIES = [1, 2, 3, 4, 5]

export const SELECT_CLASS =
  'h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 text-sm'

type Edit = {
  is_diagnostic: boolean
  difficulty: number | null
  input_type: InputType | null
  cognitive_type: CognitiveType | null
}

export function NewTaskForm({
  clusters,
  onCreated,
}: {
  clusters: SkillCluster[]
  onCreated: () => void
}): JSX.Element {
  const [clusterId, setClusterId] = useState('')
  const [microskills, setMicroskills] = useState<Microskill[]>([])
  const [form, setForm] = useState<DiagnosticTaskInput>({ question: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clusterId) {
      setMicroskills([])
      return
    }
    getMicroskillsByCluster(clusterId).then(({ data }) => setMicroskills(data ?? []))
  }, [clusterId])

  const submit = async (): Promise<void> => {
    if (form.question.trim() === '') {
      setError('Frage erforderlich.')
      return
    }
    setBusy(true)
    setError(null)
    const { error: err } = await createDiagnosticTask({
      ...form,
      question: form.question.trim(),
      cluster_id: clusterId || null,
    })
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    setForm({ question: '' })
    onCreated()
  }

  return (
    <EdvanceCard className="flex flex-col gap-4 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        Neue Diagnose-Aufgabe
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Cluster</Label>
          <select
            className={SELECT_CLASS}
            value={clusterId}
            onChange={(e) => setClusterId(e.target.value)}
          >
            <option value="">– Cluster –</option>
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Microskill</Label>
          <select
            className={SELECT_CLASS}
            value={form.microskill_id ?? ''}
            onChange={(e) => setForm({ ...form, microskill_id: e.target.value || null })}
          >
            <option value="">– optional –</option>
            {microskills.map((m) => (
              <option key={m.id} value={m.id}>{m.code} · {m.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Schwierigkeit</Label>
          <select
            className={SELECT_CLASS}
            value={form.difficulty ?? ''}
            onChange={(e) =>
              setForm({ ...form, difficulty: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">–</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Input-Typ</Label>
          <select
            className={SELECT_CLASS}
            value={form.input_type ?? ''}
            onChange={(e) =>
              setForm({ ...form, input_type: (e.target.value || null) as InputType | null })
            }
          >
            <option value="">–</option>
            {INPUT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Kognitiver Typ</Label>
          <select
            className={SELECT_CLASS}
            value={form.cognitive_type ?? ''}
            onChange={(e) =>
              setForm({ ...form, cognitive_type: (e.target.value || null) as CognitiveType | null })
            }
          >
            <option value="">–</option>
            {COG_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="d-class">Klassenstufe</Label>
          <Input
            id="d-class"
            value={form.class_level ?? ''}
            onChange={(e) =>
              setForm({ ...form, class_level: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="d-q">Frage</Label>
        <textarea
          id="d-q"
          className="min-h-[80px] rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="d-s">Lösung</Label>
        <textarea
          id="d-s"
          className="min-h-[60px] rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          value={form.solution ?? ''}
          onChange={(e) => setForm({ ...form, solution: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
      <div>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Speichert …' : 'Diagnose-Aufgabe anlegen'}
        </Button>
      </div>
    </EdvanceCard>
  )
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
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>Diff {d}</option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={edit.input_type ?? ''}
          onChange={(e) =>
            setEdit({ ...edit, input_type: (e.target.value || null) as InputType | null })
          }
        >
          <option value="">Input –</option>
          {INPUT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={edit.cognitive_type ?? ''}
          onChange={(e) =>
            setEdit({ ...edit, cognitive_type: (e.target.value || null) as CognitiveType | null })
          }
        >
          <option value="">Kog –</option>
          {COG_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? '…' : 'Speichern'}
        </Button>
      </div>
      {err && <p className="text-sm text-[var(--destructive)]">{err}</p>}
    </EdvanceCard>
  )
}
