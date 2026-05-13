import { useEffect, useMemo, useState, type JSX } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { MathContent } from '@/lib/render/MathContent'
import { getTasksBySource } from '@/lib/supabase/tasks'
import type { Task } from '@/types'

const SOURCE = 'mathebuch_lambacher_8_nrw'

type Filter = 'all' | 'exercise' | 'exercise_group' | 'article' | 'video' | 'course'

function DifficultyDots({ value }: { value: number | null }): JSX.Element {
  const v = value ?? 0
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Schwierigkeit ${v}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={
            i <= v
              ? 'h-1.5 w-1.5 rounded-full bg-primary'
              : 'h-1.5 w-1.5 rounded-full bg-muted-foreground/20'
          }
        />
      ))}
    </span>
  )
}

function MetaRow({ task }: { task: Task }): JSX.Element {
  const chips = [
    task.source_ref,
    task.curriculum_ref,
    task.cognitive_type,
    task.estimated_minutes ? `${task.estimated_minutes} Min` : null,
    task.class_level ? `Klasse ${task.class_level}` : null,
  ].filter(Boolean) as string[]
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <DifficultyDots value={task.difficulty} />
      {chips.map((c) => (
        <span key={c} className="rounded-md bg-secondary px-2 py-0.5 font-mono">
          {c}
        </span>
      ))}
    </div>
  )
}

function TaskCard({ task }: { task: Task }): JSX.Element {
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {task.title ?? 'Ohne Titel'}
          </h2>
          <MetaRow task={task} />
        </div>
        <MathContent text={task.question} />
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {task.hint && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHint((v) => !v)}
            >
              {showHint ? 'Hinweis ausblenden' : 'Hinweis zeigen'}
            </Button>
          )}
          {task.solution && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSolution((v) => !v)}
            >
              {showSolution ? 'Lösung ausblenden' : 'Lösung zeigen'}
            </Button>
          )}
        </div>
        {showHint && task.hint && (
          <div className="rounded-md bg-secondary p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hinweis
            </p>
            <MathContent text={task.hint} />
          </div>
        )}
        {showSolution && task.solution && (
          <div className="rounded-md bg-secondary p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lösung
            </p>
            <MathContent text={task.solution} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function LambacherPreview(): JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void getTasksBySource(SOURCE).then((result) => {
      if (cancelled) return
      if (result.error) setError(result.error)
      else setTasks(result.data ?? [])
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return tasks
    return tasks.filter((t) => t.content_type === filter)
  }, [tasks, filter])

  const counts = useMemo(() => {
    const byType: Record<string, number> = {}
    for (const t of tasks) byType[t.content_type] = (byType[t.content_type] ?? 0) + 1
    return byType
  }, [tasks])

  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Lambacher 8 NRW – Vorschau" />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Mathebuch-Import: Vorschau
          </h1>
          <p className="text-sm text-muted-foreground">
            Quelle: <code className="font-mono">{SOURCE}</code> · {tasks.length} Aufgaben in der DB
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Alle ({tasks.length})
          </Button>
          {(['exercise', 'exercise_group', 'article', 'video', 'course'] as Filter[]).map((t) =>
            counts[t] ? (
              <Button
                key={t}
                variant={filter === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(t)}
              >
                {t} ({counts[t]})
              </Button>
            ) : null,
          )}
        </div>

        {loading && <p className="text-sm text-muted-foreground">Lade Aufgaben …</p>}

        {error && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-destructive">Fehler beim Laden</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Keine Aufgaben gefunden für diese Quelle.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      </main>
    </div>
  )
}
