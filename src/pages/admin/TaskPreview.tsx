import { useEffect, useState, type JSX, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import {
  getClusterById,
  getTaskById,
  getTaskCoachMetadata,
} from '@/lib/supabase/tasks'
import { SerloRenderer } from '@/lib/serlo/contentRenderer'
import { SerloVideoRenderer } from '@/lib/serlo/videoRenderer'
import type { SkillCluster, Task, TaskCoachMetadata } from '@/types'

type ContentType = Task['content_type']

const TYPE_LABEL: Record<ContentType, string> = {
  exercise: 'Aufgabe',
  exercise_group: 'Mini-Test',
  article: 'Artikel',
  video: 'Video',
  course: 'Kurs',
}

const TYPE_BADGE: Record<ContentType, { bg: string; fg: string }> = {
  exercise: { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', fg: 'var(--primary)' },
  exercise_group: { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', fg: 'var(--primary)' },
  article: { bg: 'color-mix(in srgb, var(--success) 12%, transparent)', fg: 'var(--success)' },
  video: { bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', fg: 'var(--warning)' },
  course: { bg: 'color-mix(in srgb, var(--level-purple) 12%, transparent)', fg: 'var(--level-purple)' },
}

export function TaskPreview(): JSX.Element {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()

  const [task, setTask] = useState<Task | null>(null)
  const [cluster, setCluster] = useState<SkillCluster | null>(null)
  const [meta, setMeta] = useState<TaskCoachMetadata | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState<boolean>(false)

  useEffect(() => {
    if (!taskId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      const taskResult = await getTaskById(taskId)
      if (cancelled) return
      if (taskResult.error) {
        setError(taskResult.error)
        setLoading(false)
        return
      }
      const t = taskResult.data
      if (!t) {
        setError('Aufgabe nicht gefunden.')
        setLoading(false)
        return
      }
      setTask(t)

      const followUp: Promise<unknown>[] = [
        getTaskCoachMetadata(t.id).then(({ data }) => {
          if (!cancelled) setMeta(data ?? null)
        }),
      ]
      if (t.cluster_id) {
        followUp.push(
          getClusterById(t.cluster_id).then(({ data }) => {
            if (!cancelled) setCluster(data)
          }),
        )
      }
      await Promise.all(followUp)
      if (!cancelled) setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [taskId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <EdvanceNavbar subtitle="Task Preview" />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-sm text-muted">Lade Aufgabe …</p>
        </main>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-background">
        <EdvanceNavbar subtitle="Task Preview" />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-sm text-destructive">
              {error ?? 'Unbekannter Fehler'}
            </CardContent>
          </Card>
          <Button variant="outline" onClick={() => navigate('/admin/content')} className="mt-4">
            <ArrowLeft className="mr-1 h-4 w-4" /> Zurueck zur Uebersicht
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Task Preview (Admin)" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <button
          type="button"
          onClick={() => navigate('/admin/content')}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Zurueck zur Uebersicht
        </button>

        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <TypeBadge type={task.content_type} />
          {task.difficulty != null && (
            <span className="text-xs font-semibold text-muted">Difficulty {task.difficulty}/5</span>
          )}
          {cluster && (
            <span className="text-xs font-semibold text-muted">· {cluster.name}</span>
          )}
          {task.serlo_url && (
            <a
              href={task.serlo_url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Auf Serlo <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {task.title && (
          <h1 className="mb-3 text-xl font-bold text-foreground">{task.title}</h1>
        )}

        {/* Hauptbereich */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            {task.content_type === 'video' ? (
              task.question ? (
                <SerloVideoRenderer url={task.question} title={task.title ?? undefined} />
              ) : (
                <p className="text-sm text-muted">– kein Video-Link –</p>
              )
            ) : (
              <SerloRenderer content={task.question} />
            )}
          </CardContent>
        </Card>

        {/* Loesung (falls vorhanden) */}
        {task.solution && (
          <DebugSection label="Loesung">
            <SerloRenderer content={task.solution} />
          </DebugSection>
        )}

        {/* Coach-Metadaten */}
        {(meta ?? task.coach_note ?? task.common_errors) && (
          <DebugSection label="Coach-Metadaten">
            {task.coach_note && (
              <MetaRow label="coach_note (task)" value={task.coach_note} />
            )}
            {task.common_errors && (
              <MetaRow label="common_errors (task)" value={task.common_errors} />
            )}
            {meta?.typical_errors && (
              <MetaRow label="typical_errors" value={meta.typical_errors} />
            )}
            {meta?.observation_hints && (
              <MetaRow label="observation_hints" value={meta.observation_hints} />
            )}
            {meta?.intervention_triggers && (
              <MetaRow label="intervention_triggers" value={meta.intervention_triggers} />
            )}
          </DebugSection>
        )}

        {/* Raw JSON Debug */}
        <Card className="mb-4">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => setShowRaw((s) => !s)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted hover:bg-background"
            >
              {showRaw ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Raw JSON (task row + serlo_content)
            </button>
            {showRaw && (
              <pre className="overflow-x-auto border-t border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground">
                {JSON.stringify(task, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function TypeBadge({ type }: { type: ContentType }): JSX.Element {
  const { bg, fg } = TYPE_BADGE[type]
  return (
    <span
      className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: bg, color: fg }}
    >
      {TYPE_LABEL[type]}
    </span>
  )
}

function DebugSection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}): JSX.Element {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        <div className="flex flex-col gap-3">{children}</div>
      </CardContent>
    </Card>
  )
}

function MetaRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p className="text-xs font-mono text-muted">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{value}</p>
    </div>
  )
}
