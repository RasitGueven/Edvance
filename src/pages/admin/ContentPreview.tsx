import { useEffect, useMemo, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, ExternalLink, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import {
  getClustersBySubject,
  getMicroskillsByCluster,
  getSubjects,
  getTasksByCluster,
  getUnmappedTasks,
} from '@/lib/supabase/tasks'
import type { Microskill, SkillCluster, Subject, Task } from '@/types'

type ContentType = Task['content_type']
type TypeFilter = 'all' | ContentType

type ClusterDetails = {
  microskills: Microskill[]
  tasks: Task[]
  loading: boolean
  error: string | null
}

const MAX_TASKS_VISIBLE = 50

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'exercise', label: 'Aufgaben' },
  { value: 'article', label: 'Artikel' },
  { value: 'video', label: 'Videos' },
  { value: 'exercise_group', label: 'Mini-Tests' },
  { value: 'course', label: 'Kurse' },
]

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

function matches(text: string | null | undefined, search: string): boolean {
  if (!text) return false
  return text.toLowerCase().includes(search)
}

function taskMatches(t: Task, search: string, type: TypeFilter): boolean {
  if (type !== 'all' && t.content_type !== type) return false
  if (search.length === 0) return true
  return matches(t.title, search) || matches(t.question, search) || matches(t.solution, search)
}

function microskillMatches(s: Microskill, search: string): boolean {
  if (search.length === 0) return true
  return matches(s.code, search) || matches(s.name, search) || matches(s.description, search)
}

export function ContentPreview(): JSX.Element {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [clusters, setClusters] = useState<SkillCluster[]>([])
  const [loadingClusters, setLoadingClusters] = useState<boolean>(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, ClusterDetails | undefined>>({})
  const [unmapped, setUnmapped] = useState<Task[]>([])

  const [search, setSearch] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const lowerSearch = search.trim().toLowerCase()
  const isFiltering = lowerSearch.length > 0 || typeFilter !== 'all'

  // Subjects beim Mount laden + Unmapped Tasks parallel.
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
    void getUnmappedTasks().then(({ data }) => {
      if (cancelled) return
      setUnmapped(data ?? [])
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

  const loadClusterDetails = async (clusterId: string): Promise<void> => {
    setExpanded((prev) => ({
      ...prev,
      [clusterId]: { microskills: [], tasks: [], loading: true, error: null },
    }))
    const [skillsResult, tasksResult] = await Promise.all([
      getMicroskillsByCluster(clusterId),
      getTasksByCluster(clusterId),
    ])
    setExpanded((prev) => ({
      ...prev,
      [clusterId]: {
        microskills: skillsResult.data ?? [],
        tasks: tasksResult.data ?? [],
        loading: false,
        error: skillsResult.error ?? tasksResult.error,
      },
    }))
  }

  // Bei aktivem Filter: alle nicht geladenen Cluster auto-laden.
  useEffect(() => {
    if (!isFiltering) return
    for (const c of clusters) {
      if (expanded[c.id] === undefined) void loadClusterDetails(c.id)
    }
    // expanded absichtlich nicht in deps — wir wollen nur reagieren, wenn
    // sich Filter-Status oder Cluster-Liste aendert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFiltering, clusters])

  const toggleCluster = (clusterId: string): void => {
    if (expanded[clusterId]) {
      setExpanded((prev) => {
        const next = { ...prev }
        delete next[clusterId]
        return next
      })
      return
    }
    void loadClusterDetails(clusterId)
  }

  const clearFilters = (): void => {
    setSearch('')
    setTypeFilter('all')
  }

  const filteredUnmapped = useMemo(
    () => unmapped.filter((t) => taskMatches(t, lowerSearch, typeFilter)),
    [unmapped, lowerSearch, typeFilter],
  )

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

        {/* Search + Filters */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche in Cluster, Mikroskills, Aufgaben …"
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

        {/* Subject Tabs */}
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

        {/* Cluster List */}
        {loadingClusters ? (
          <p className="text-sm text-muted">Lade Cluster …</p>
        ) : clusters.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted">
              Noch keine Cluster importiert. Fuehre die Seed-Scripts aus
              (<code>npm run seed:clusters</code> bzw. <code>npm run seed:serlo</code>).
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {clusters.map((cluster) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                details={expanded[cluster.id]}
                isFiltering={isFiltering}
                lowerSearch={lowerSearch}
                typeFilter={typeFilter}
                onToggle={() => toggleCluster(cluster.id)}
              />
            ))}
            <UnmappedSection
              tasks={filteredUnmapped}
              total={unmapped.length}
              isFiltering={isFiltering}
            />
          </div>
        )}
      </main>
    </div>
  )
}

function ClusterCard({
  cluster,
  details,
  isFiltering,
  lowerSearch,
  typeFilter,
  onToggle,
}: {
  cluster: SkillCluster
  details: ClusterDetails | undefined
  isFiltering: boolean
  lowerSearch: string
  typeFilter: TypeFilter
  onToggle: () => void
}): JSX.Element | null {
  const clusterNameMatches = matches(cluster.name, lowerSearch)
  const filteredMicroskills = useMemo(
    () => (details?.microskills ?? []).filter((s) => microskillMatches(s, lowerSearch)),
    [details?.microskills, lowerSearch],
  )
  const filteredTasks = useMemo(
    () => (details?.tasks ?? []).filter((t) => taskMatches(t, lowerSearch, typeFilter)),
    [details?.tasks, lowerSearch, typeFilter],
  )

  // Beim Filtern: Cluster nur zeigen wenn er selbst matcht ODER irgendwas drin matcht.
  if (isFiltering) {
    const nothingMatches =
      !clusterNameMatches &&
      filteredMicroskills.length === 0 &&
      filteredTasks.length === 0 &&
      !details?.loading
    if (nothingMatches && details !== undefined) return null
  }

  // Beim Filtern: Karte automatisch als expandiert anzeigen (sobald Daten da).
  const showAsExpanded = isFiltering ? details !== undefined : details !== undefined

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={onToggle}
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
          {showAsExpanded ? (
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
            <ClusterBody
              microskills={isFiltering ? filteredMicroskills : details.microskills}
              microskillsTotal={details.microskills.length}
              tasks={isFiltering ? filteredTasks : details.tasks}
              tasksTotal={details.tasks.length}
              isFiltering={isFiltering}
            />
          )}
        </CardContent>
      )}
    </Card>
  )
}

function ClusterBody({
  microskills,
  microskillsTotal,
  tasks,
  tasksTotal,
  isFiltering,
}: {
  microskills: Microskill[]
  microskillsTotal: number
  tasks: Task[]
  tasksTotal: number
  isFiltering: boolean
}): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
          Mikroskills{' '}
          {isFiltering && microskills.length !== microskillsTotal
            ? `(${microskills.length} von ${microskillsTotal})`
            : `(${microskillsTotal})`}
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
          Aufgaben{' '}
          {isFiltering && tasks.length !== tasksTotal
            ? `(${tasks.length} von ${tasksTotal})`
            : `(${tasksTotal})`}
        </p>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted">– keine –</p>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </section>
    </div>
  )
}

function UnmappedSection({
  tasks,
  total,
  isFiltering,
}: {
  tasks: Task[]
  total: number
  isFiltering: boolean
}): JSX.Element | null {
  const [open, setOpen] = useState<boolean>(false)

  // Wenn beim Filtern nichts in unmapped matcht und es ueberhaupt unmapped gibt: trotzdem zeigen
  // damit User sieht "0 Treffer in unmapped". Wenn keine unmapped existieren: gar nicht rendern.
  if (total === 0) return null

  const showOpen = isFiltering ? true : open

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-base font-semibold text-foreground">Ohne Cluster</p>
            <p className="text-xs text-muted">
              Tasks deren Keyword-Mapping nicht gegriffen hat.{' '}
              {isFiltering && tasks.length !== total
                ? `(${tasks.length} von ${total})`
                : `(${total})`}
            </p>
          </div>
          {showOpen ? (
            <ChevronDown className="h-5 w-5 text-muted" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted" />
          )}
        </button>
      </CardHeader>
      {showOpen && (
        <CardContent className="border-t border-border pt-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted">– keine Treffer –</p>
          ) : (
            <TaskList tasks={tasks} />
          )}
        </CardContent>
      )}
    </Card>
  )
}

function TaskList({ tasks }: { tasks: Task[] }): JSX.Element {
  return (
    <ul className="flex flex-col gap-1.5">
      {tasks.slice(0, MAX_TASKS_VISIBLE).map((t) => (
        <li key={t.id} className="flex items-center gap-3 text-sm">
          <ContentTypeBadge type={t.content_type} />
          <Link
            to={`/admin/task-preview/${t.id}`}
            className="min-w-0 flex-1 truncate text-foreground hover:text-primary hover:underline"
          >
            {t.title ?? t.question?.slice(0, 80) ?? `serlo:${t.serlo_uuid ?? '?'}`}
          </Link>
          {t.serlo_url && (
            <a
              href={t.serlo_url}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1 text-xs text-muted hover:text-primary hover:underline"
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
