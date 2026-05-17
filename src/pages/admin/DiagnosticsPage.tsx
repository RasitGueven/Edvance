import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EmptyState, LoadingPulse } from '@/components/edvance'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import {
  getClustersBySubject,
  getSubjects,
  getTasksByCluster,
} from '@/lib/supabase/tasks'
import type { SkillCluster, Subject, Task } from '@/types'
import { NewTaskForm } from './diagnostics/NewTaskForm'
import { TaskRow } from './diagnostics/TaskRow'
import { SELECT_CLASS } from './diagnostics/shared'

export function DiagnosticsPage(): JSX.Element {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [clusters, setClusters] = useState<SkillCluster[]>([])
  const [clusterId, setClusterId] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSubjects().then(({ data }) => {
      setSubjects(data ?? [])
      if (data && data.length > 0) setSubjectId(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!subjectId) return
    getClustersBySubject(subjectId).then(({ data }) => {
      setClusters(data ?? [])
      setClusterId('')
      setTasks([])
    })
  }, [subjectId])

  const loadTasks = (cid: string): void => {
    setClusterId(cid)
    if (!cid) {
      setTasks([])
      return
    }
    setLoading(true)
    getTasksByCluster(cid).then(({ data, error: err }) => {
      setTasks(data ?? [])
      setError(err)
      setLoading(false)
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Diagnostik-Verwaltung" sticky />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <div>
          <Link
            to="/admin"
            className="mb-2 flex items-center gap-1 text-sm text-[var(--text-muted)]"
          >
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Diagnose-Aufgaben verwalten
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Aufgaben ansehen, Schwierigkeit/Format anpassen und festlegen,
            welche im Diagnose-Test erscheinen.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            className={SELECT_CLASS}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className={SELECT_CLASS}
            value={clusterId}
            onChange={(e) => loadTasks(e.target.value)}
          >
            <option value="">– Cluster wählen –</option>
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <NewTaskForm
          clusters={clusters}
          onCreated={() => clusterId && loadTasks(clusterId)}
        />

        {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

        {loading ? (
          <LoadingPulse type="list" lines={4} />
        ) : !clusterId ? (
          <EmptyState
            icon="🧪"
            title="Cluster wählen"
            description="Wähle ein Cluster, um dessen Aufgaben anzusehen und zu justieren."
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Keine Aufgaben"
            description="In diesem Cluster gibt es noch keine Aufgaben."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onSaved={() => clusterId && loadTasks(clusterId)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
