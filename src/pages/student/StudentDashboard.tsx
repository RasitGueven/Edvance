import { useEffect, useMemo, useState, type JSX } from 'react'
import { BookOpen, FlaskConical, Search, X, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { XPBar } from '@/components/edvance'
import { DashboardTiles } from '@/components/edvance/DashboardTiles'
import { ClusterGrid } from '@/components/edvance/student/ClusterGrid'
import { FilterResults } from '@/components/edvance/student/FilterResults'
import { useAuth } from '@/hooks/useAuth'
import { getClustersBySubject, getSubjects, getTasksByCluster } from '@/lib/supabase/tasks'
import { getStudentByProfile } from '@/lib/supabase/students'
import { getStudentProgress } from '@/lib/supabase/progress'
import type { SkillCluster, Subject, Task } from '@/types'

const XP_PER_LEVEL = 500

type ContentType = Task['content_type']
type TypeFilter = 'all' | ContentType

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all',       label: 'Alle' },
  { value: 'exercise',  label: 'Aufgaben' },
  { value: 'article',   label: 'Artikel' },
  { value: 'video',     label: 'Videos' },
]

export function StudentDashboard(): JSX.Element {
  const { user } = useAuth()
  const firstName = (user?.email?.split('@')[0] ?? 'Lernender').split('.')[0]
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [clusters, setClusters] = useState<SkillCluster[]>([])
  const [loadingClusters, setLoadingClusters] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [xpTotal, setXpTotal] = useState<number>(0)
  const [streakDays, setStreakDays] = useState<number>(0)
  const [level, setLevel] = useState<number>(1)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void (async () => {
      const { data: student } = await getStudentByProfile(user.id)
      if (cancelled || !student) return
      const { data: progress } = await getStudentProgress(student.id)
      if (cancelled || !progress) return
      setXpTotal(progress.xp_total)
      setStreakDays(progress.streak_days)
      setLevel(progress.level)
    })()
    return () => { cancelled = true }
  }, [user])

  const [search, setSearch] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [allTasks, setAllTasks] = useState<Task[] | null>(null)
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false)

  const lowerSearch = search.trim().toLowerCase()
  const isFiltering = lowerSearch.length > 0 || typeFilter !== 'all'

  useEffect(() => {
    let cancelled = false
    void getSubjects().then(({ data, error: e }) => {
      if (cancelled) return
      if (e) { setError(e); return }
      const list = data ?? []
      setSubjects(list)
      if (list.length > 0) setSelectedSubjectId(list[0].id)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedSubjectId) return
    let cancelled = false
    setLoadingClusters(true)
    setAllTasks(null)
    void getClustersBySubject(selectedSubjectId).then(({ data, error: e }) => {
      if (cancelled) return
      setLoadingClusters(false)
      if (e) { setError(e); return }
      setClusters(data ?? [])
    })
    return () => { cancelled = true }
  }, [selectedSubjectId])

  useEffect(() => {
    if (!isFiltering || allTasks !== null || clusters.length === 0) return
    let cancelled = false
    setLoadingTasks(true)
    void Promise.all(clusters.map((c) => getTasksByCluster(c.id))).then((results) => {
      if (cancelled) return
      const flat: Task[] = []
      for (const r of results) if (r.data) flat.push(...r.data)
      setAllTasks(flat)
      setLoadingTasks(false)
    })
    return () => { cancelled = true }
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
    <div className="min-h-screen bg-[var(--background)]">
      <EdvanceNavbar subtitle="Mein Lernplan" />

      <section className="relative overflow-hidden bg-gradient-hero noise-overlay">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--color-moment-gold)' }}
        />
        <div className="mx-auto max-w-3xl px-4 py-8 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <p className="text-eyebrow opacity-70">Heute · Mein Lernplan</p>
              <h1 className="text-display text-3xl mt-1.5 leading-none">Hi {displayName} 👋</h1>
              <p className="mt-2 text-sm opacity-80 max-w-md">
                Wähle ein Thema oder suche direkt nach einer Aufgabe.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold">
              <Flame className="h-3.5 w-3.5 text-[var(--color-moment-gold)]" />
              {streakDays} Tage Streak
            </div>
          </div>
          <div className="glass-dark rounded-[var(--radius-xl)] p-5">
            <XPBar current={xpTotal % XP_PER_LEVEL} max={XP_PER_LEVEL} level={level} levelName={`Level ${level}`} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {error && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Schnellzugriff
        </h2>
        <div className="mb-8">
          <DashboardTiles
            tiles={[
              {
                to: '/screening',
                icon: <FlaskConical className="h-5 w-5" />,
                title: 'Screening starten',
                description: 'Zeig, was du kannst – wir finden deinen Lernstand',
              },
              {
                to: '#lernpfad',
                anchor: true,
                icon: <BookOpen className="h-5 w-5" />,
                title: 'Lernpfad',
                description: 'Themen durchsuchen und üben',
              },
            ]}
          />
        </div>

        <div id="lernpfad" className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Aufgabe, Video, Artikel …"
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-11 text-sm shadow-premium-sm focus:border-[var(--color-primary)] focus:shadow-glow-primary focus:outline-none transition-all"
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

        {isFiltering ? (
          <FilterResults loading={loadingTasks} tasks={filteredTasks} clusterNameById={clusterNameById} />
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
