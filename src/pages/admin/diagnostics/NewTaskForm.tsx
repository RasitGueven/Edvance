import { useEffect, useState, type JSX } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EdvanceCard } from '@/components/edvance'
import {
  COGNITIVE_TYPE_LABELS,
  DIFFICULTY_OPTIONS,
  INPUT_TYPE_LABELS,
} from '@/lib/taskLabels'
import { createDiagnosticTask, getMicroskillsByCluster } from '@/lib/supabase/tasks'
import type {
  DiagnosticTaskInput,
  InputType,
  Microskill,
  CognitiveType,
  SkillCluster,
} from '@/types'
import { COG_TYPES, INPUT_TYPES, SELECT_CLASS } from './shared'

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
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
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
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Microskill</Label>
          <select
            className={SELECT_CLASS}
            value={form.microskill_id ?? ''}
            onChange={(e) =>
              setForm({ ...form, microskill_id: e.target.value || null })
            }
          >
            <option value="">– optional –</option>
            {microskills.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} · {m.name}
              </option>
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
            <option value="">Bitte wählen</option>
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Antwortformat</Label>
          <select
            className={SELECT_CLASS}
            value={form.input_type ?? ''}
            onChange={(e) =>
              setForm({ ...form, input_type: (e.target.value || null) as InputType | null })
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
        <div className="flex flex-col gap-2">
          <Label>Aufgaben-Anspruch</Label>
          <select
            className={SELECT_CLASS}
            value={form.cognitive_type ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
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
          className="min-h-[80px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="d-s">Lösung</Label>
        <textarea
          id="d-s"
          className="min-h-[60px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm"
          value={form.solution ?? ''}
          onChange={(e) => setForm({ ...form, solution: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-[var(--color-error-exam)]">{error}</p>}
      <div>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Speichert …' : 'Diagnose-Aufgabe anlegen'}
        </Button>
      </div>
    </EdvanceCard>
  )
}
