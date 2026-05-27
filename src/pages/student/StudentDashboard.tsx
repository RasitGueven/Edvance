import { useEffect, useMemo, useState, type JSX } from 'react'
import { BookOpen, FlaskConical } from 'lucide-react'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { EmptyState, LoadingPulse } from '@/components/edvance'
import { DashboardTiles } from '@/components/edvance/DashboardTiles'
import { useAuth } from '@/hooks/useAuth'
import { getClustersBySubject, getSubjects, getTasksByCluster } from '@/lib/supabase/tasks'
import { getStudentByProfile } from '@/lib/supabase/students'
import { getStudentProgress } from '@/lib/supabase/progress'
import type { SkillCluster, Subject, Task } from '@/types'
import { StudentDashboardHero } from './StudentDashboardHero'
import { StudentDashboardFilters, type TypeFilter } from './StudentDashboardFilters'
import { ClusterGrid, FilterResults } from './StudentDashboardClusters'

const XP_PER_LEVEL = 500

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
  const [presenceWeeks, setPresenceWeeks] = useState<number>(0)
  const [homeSessions, setHomeSessions] = useState<number>(0)
  const [presenceMultiplier, setPresenceMultiplier] = useState<number>(1.0)
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
      setPresenceWeeks(progress.presence_streak_weeks)
      setHomeSessions(progress.home_streak_sessions)
      setPresenceMultiplier(progress.presence_streak_multiplier)
      setLevel(progress.level)
    })()
    return () => {
      cancelled = true
    }
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
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <EdvanceNavbar subtitle="Mein Lernplan" />

      <StudentDashboardHero
        displayName={displayName}
        level={level}
        xpCurrentInLevel={xpTotal % XP_PER_LEVEL}
        xpMaxPerLevel={XP_PER_LEVEL}
        presenceWeeks={presenceWeeks}
        homeSessions={homeSessions}
        presenceMultiplier={presenceMultiplier}
      />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {error && (
          <p className="mb-6 text-sm text-[var(--color-error-answer)]">{error}</p>
        )}

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
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

        <StudentDashboardFilters
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          isFiltering={isFiltering}
          onClear={clearFilters}
          subjects={subjects}
          selectedSubjectId={selectedSubjectId}
          onSubjectChange={setSelectedSubjectId}
        />

        {isFiltering ? (
          <FilterResults
            loading={loadingTasks}
            tasks={filteredTasks}
            clusterNameById={clusterNameById}
          />
        ) : loadingClusters ? (
          <div className="mt-6">
            <LoadingPulse type="list" lines={4} />
          </div>
        ) : clusters.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon="📚"
              title="Noch keine Themen"
              description="Sobald dein Coach Themen für deine Klasse freischaltet, erscheinen sie hier."
            />
          </div>
        ) : (
          <ClusterGrid clusters={clusters} />
        )}
      </main>
    </div>
  )
}
