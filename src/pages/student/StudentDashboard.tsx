import { useEffect, useMemo, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, FileText, FlaskConical, PlayCircle, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { getClustersBySubject, getSubjects, getTasksByCluster } from '@/lib/supabase/tasks'
import type { SkillCluster, Subject, Task } from '@/types'

type ContentType = Task['content_type']
type TypeFilter = 'all' | ContentType

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'exercise', label: 'Aufgaben' },
  { value: 'article', label: 'Artikel' },
  { value: 'video', label: 'Videos' },
]

export function StudentDashboard(): JSX.Element {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [clusters, setClusters] = useState<SkillCluster[]>([])
  const [loadingClusters, setLoadingClusters] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [allTasks, setAllTasks] = useState<Task[] | null>(null)
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false)

  const lowerSearch = search.trim().toLowerCase()
  const isFiltering = lowerSearch.length > 0 || typeFilter !== 'all'

  // Subjects beim Mount.
  useEffect(() => {
    let cancelled = false
    void getSubjects().then(({ data, error: e }) => {
      if (cancelled) return
      if (e) {
        setError(e)
        return
      }
      const list = data ?? []
      setSubjects(list)
      if (list.length > 0) setSelectedSubjectId(list[0].id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Cluster bei Subject-Wechsel.
  useEffect(() => {
    if (!selectedSubjectId) return
    let cancelled = false
    setLoadingClusters(true)
    setAllTasks(null)
    void getClustersBySubject(selectedSubjectId).then(({ data, error: e }) => {
      if (cancelled) return
      setLoadingClusters(false)
      if (e) {
        setError(e)
        return
      }
      setClusters(data ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [selectedSubjectId])

  // Tasks lazy laden, sobald Filter erstmals aktiv wird.
  useEffect(() => {
    if (!isFiltering || allTasks !== null || clusters.length === 0) return
    let cancelled = false
    setLoadingTasks(true)
    void Promise.all(clusters.map((c) => getTasksByCluster(c.id))).then((results) => {
      if (cancelled) return
      const flat: Task[] = []
      for (const r of results) {
        if (r.data) flat.push(...r.data)
      }
      setAllTasks(flat)
      setLoadingTasks(false)
    })
    return () => {
      cancelled = true
    }
  }, [isFiltering, allTasks, clusters])

  const clusterNameById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of clusters) m[c.id] = c.name
    return m
  }, [clusters])

  const filteredTasks = useMemo(() => {
    if (!allTasks) return []
    return allTasks.filter((t) => {
      if (typeFilter !== 'all' && t.content_type !== typeFilter) return false
      if (lowerSearch.length === 0) return true
      const inTitle = t.title?.toLowerCase().includes(lowerSearch) ?? false
      const inQuestion = t.question?.toLowerCase().includes(lowerSearch) ?? false
      return inTitle || inQuestion
    })
  }, [allTasks, typeFilter, lowerSearch])

  const clearFilters = (): void => {
    setSearch('')
    setTypeFilter('all')
  }

  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Mein Lernplan" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground">Mein Lernplan</h1>
        <p className="mt-1 text-sm text-muted">
          Waehle ein Thema oder suche direkt nach einer Aufgabe.
        </p>

        {error && (
          <Card className="mt-6">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Search + Filters */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Aufgabe, Video, Artikel …"
              className="h-11 w-full rounded-xl border-2 border-border bg-card pl-10 pr-10 text-sm focus:border-primary focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Suche leeren"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-background hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {TYPE_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={typeFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
            {isFiltering && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs font-semibold text-muted hover:text-foreground"
              >
                Filter zuruecksetzen
              </button>
            )}
          </div>
        </div>

        {/* Subject Tabs (nur wenn >1) */}
        {subjects.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={s.id === selectedSubjectId ? 'default' : 'outline'}
                onClick={() => setSelectedSubjectId(s.id)}
              >
                {s.name}
              </Button>
            ))}
          </div>
        )}

        {/* Body */}
        {isFiltering ? (
          <FilterResults
            loading={loadingTasks}
            tasks={filteredTasks}
            clusterNameById={clusterNameById}
          />
        ) : loadingClusters ? (
          <p className="mt-6 text-sm text-muted">Lade Themen …</p>
        ) : clusters.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="pt-6 text-center text-sm text-muted">
              Noch keine Themen verfuegbar. Frag deinen Coach.
            </CardContent>
          </Card>
        ) : (
          <ClusterGrid clusters={clusters} />
        )}
      </main>
    </div>
  )
}

function ClusterGrid({ clusters }: { clusters: SkillCluster[] }): JSX.Element {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {clusters.map((c) => (
        <Link
          key={c.id}
          to={`/student/cluster/${c.id}`}
          className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex min-h-[72px] items-center gap-3 p-5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                <BookOpen className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted">
                  Klasse {c.class_level_min}
                  {c.class_level_min !== c.class_level_max && ` – ${c.class_level_max}`}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-primary" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function FilterResults({
  loading,
  tasks,
  clusterNameById,
}: {
  loading: boolean
  tasks: Task[]
  clusterNameById: Record<string, string>
}): JSX.Element {
  if (loading) {
    return <p className="mt-6 text-sm text-muted">Suche …</p>
  }
  if (tasks.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 text-center text-sm text-muted">
          Keine Treffer.
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="mt-6 flex flex-col gap-1.5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
        {tasks.length} Treffer
      </p>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {tasks.slice(0, 50).map((t) => (
              <li key={t.id}>
                <Link
                  to={`/student/task/${t.id}`}
                  className="flex min-h-[56px] items-center gap-3 px-4 py-3 transition-colors hover:bg-background"
                >
                  <RowIcon type={t.content_type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t.title ?? t.question?.slice(0, 80) ?? `serlo:${t.serlo_uuid ?? '?'}`}
                    </p>
                    {t.cluster_id && clusterNameById[t.cluster_id] && (
                      <p className="text-xs text-muted">{clusterNameById[t.cluster_id]}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
            {tasks.length > 50 && (
              <li className="px-4 py-2 text-xs text-muted">
                … und {tasks.length - 50} weitere – Suche praeziser, um sie zu sehen.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function RowIcon({ type }: { type: ContentType }): JSX.Element {
  if (type === 'video') return <PlayCircle className="h-5 w-5 shrink-0 text-warning" />
  if (type === 'article') return <FileText className="h-5 w-5 shrink-0 text-success" />
  if (type === 'exercise_group' || type === 'course')
    return <FlaskConical className="h-5 w-5 shrink-0 text-primary" />
  return <BookOpen className="h-5 w-5 shrink-0 text-primary" />
}
