import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import {
  getClustersBySubject,
  getMicroskillsByCluster,
  getSubjects,
  getTasksByCluster,
} from '@/lib/supabase/tasks'
import type { Microskill, SkillCluster, Subject, Task } from '@/types'

type ContentType = Task['content_type']

type ClusterDetails = {
  microskills: Microskill[]
  tasks: Task[]
  loading: boolean
  error: string | null
}

const MAX_TASKS_VISIBLE = 25

const TYPE_BADGE_BG: Record<ContentType, string> = {
  exercise: 'color-mix(in srgb, var(--primary) 12%, transparent)',
  exercise_group: 'color-mix(in srgb, var(--primary) 12%, transparent)',
  article: 'color-mix(in srgb, var(--success) 12%, transparent)',
  video: 'color-mix(in srgb, var(--warning) 12%, transparent)',
  course: 'color-mix(in srgb, var(--level-purple) 12%, transparent)',
}

const TYPE_BADGE_FG: Record<ContentType, string> = {
  exercise: 'var(--primary)',
  exercise_group: 'var(--primary)',
  article: 'var(--success)',
  video: 'var(--warning)',
  course: 'var(--level-purple)',
}

export function ContentPreview(): JSX.Element {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [clusters, setClusters] = useState<SkillCluster[]>([])
  const [loadingClusters, setLoadingClusters] = useState<boolean>(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, ClusterDetails | undefined>>({})

  // Subjects beim Mount laden.
  useEffect(() => {
    let cancelled = false
    void getSubjects().then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setGlobalError(error)
        return
      }
      const list = data ?? []
      setSubjects(list)
      if (list.length > 0) setSelectedSubjectId((current) => current ?? list[0].id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Cluster bei Subject-Wechsel laden.
  useEffect(() => {
    if (!selectedSubjectId) return
    let cancelled = false
    setLoadingClusters(true)
    setExpanded({})
    void getClustersBySubject(selectedSubjectId).then(({ data, error }) => {
      if (cancelled) return
      setLoadingClusters(false)
      if (error) {
        setGlobalError(error)
        return
      }
      setClusters(data ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [selectedSubjectId])

  const toggleCluster = async (cluster: SkillCluster): Promise<void> => {
    const current = expanded[cluster.id]
    if (current) {
      setExpanded((prev) => {
        const next = { ...prev }
        delete next[cluster.id]
        return next
      })
      return
    }
    setExpanded((prev) => ({
      ...prev,
      [cluster.id]: { microskills: [], tasks: [], loading: true, error: null },
    }))
    const [skillsResult, tasksResult] = await Promise.all([
      getMicroskillsByCluster(cluster.id),
      getTasksByCluster(cluster.id),
    ])
    setExpanded((prev) => ({
      ...prev,
      [cluster.id]: {
        microskills: skillsResult.data ?? [],
        tasks: tasksResult.data ?? [],
        loading: false,
        error: skillsResult.error ?? tasksResult.error,
      },
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Content Preview" />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Inhalte</h1>
          <p className="mt-0.5 text-sm text-muted">
            Read-only Vorschau der importierten Cluster, Mikroskills und Aufgaben.
          </p>
        </div>

        {globalError && (
          <Card className="mb-4">
            <CardContent className="pt-6 text-sm text-destructive">Fehler: {globalError}</CardContent>
          </Card>
        )}

        {subjects.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Button
                key={s.id}
                variant={s.id === selectedSubjectId ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSubjectId(s.id)}
              >
                {s.name}
              </Button>
            ))}
          </div>
        )}

        {loadingClusters ? (
          <p className="text-sm text-muted">Lade Cluster …</p>
        ) : clusters.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted">
              Noch keine Cluster importiert. Fuehre die Seed-Scripts aus
              (<code>npm run seed:serlo</code> bzw. <code>npm run seed:skills</code>).
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {clusters.map((cluster) => {
              const details = expanded[cluster.id]
              const expandedFlag = details !== undefined
              return (
                <Card key={cluster.id}>
                  <CardHeader className="pb-2">
                    <button
                      type="button"
                      onClick={() => void toggleCluster(cluster)}
                      className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left"
                    >
                      <div>
                        <p className="text-base font-semibold text-foreground">{cluster.name}</p>
                        <p className="text-xs text-muted">
                          Klasse {cluster.class_level_min}
                          {cluster.class_level_min !== cluster.class_level_max
                            ? ` – ${cluster.class_level_max}`
                            : ''}
                        </p>
                      </div>
                      {expandedFlag ? (
                        <ChevronDown className="h-5 w-5 text-muted" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted" />
                      )}
                    </button>
                  </CardHeader>
                  {details && (
                    <CardContent className="border-t border-border pt-4">
                      {details.loading ? (
                        <p className="text-sm text-muted">Lade …</p>
                      ) : details.error ? (
                        <p className="text-sm text-destructive">Fehler: {details.error}</p>
                      ) : (
                        <ClusterBody microskills={details.microskills} tasks={details.tasks} />
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function ClusterBody({
  microskills,
  tasks,
}: {
  microskills: Microskill[]
  tasks: Task[]
}): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
          Mikroskills ({microskills.length})
        </p>
        {microskills.length === 0 ? (
          <p className="text-sm text-muted">– keine –</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {microskills.map((s) => (
              <li key={s.id} className="flex items-baseline gap-3 text-sm">
                <span className="font-mono text-xs font-semibold text-primary">{s.code}</span>
                <span className="text-foreground">{s.name}</span>
                <span className="ml-auto text-xs text-muted">Klasse {s.class_level}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
          Aufgaben ({tasks.length})
        </p>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted">– keine –</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {tasks.slice(0, MAX_TASKS_VISIBLE).map((t) => (
              <li key={t.id} className="flex items-center gap-3 text-sm">
                <ContentTypeBadge type={t.content_type} />
                <span className="truncate text-foreground">
                  {t.title ?? t.question?.slice(0, 80) ?? `serlo:${t.serlo_uuid ?? '?'}`}
                </span>
                {t.serlo_url && (
                  <a
                    href={t.serlo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Serlo <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
            {tasks.length > MAX_TASKS_VISIBLE && (
              <li className="text-xs text-muted">… und {tasks.length - MAX_TASKS_VISIBLE} weitere</li>
            )}
          </ul>
        )}
      </section>
    </div>
  )
}

function ContentTypeBadge({ type }: { type: ContentType }): JSX.Element {
  return (
    <span
      className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: TYPE_BADGE_BG[type], color: TYPE_BADGE_FG[type] }}
    >
      {type}
    </span>
  )
}
