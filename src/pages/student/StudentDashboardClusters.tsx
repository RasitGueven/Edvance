import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, FileText, FlaskConical, PlayCircle } from 'lucide-react'
import { EdvanceCard, EmptyState } from '@/components/edvance'
import type { SkillCluster, Task } from '@/types'

type ContentType = Task['content_type']

/**
 * Cluster-Grid — keine dekorativen Blobs mehr (v1-Premium-Stil entfernt).
 * Skilltree-Grün-Palette für Cluster-Akzente (statt hardcoded CLUSTER_TINTS).
 */
export function ClusterGrid({ clusters }: { clusters: SkillCluster[] }): JSX.Element {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {clusters.map((c) => (
        <Link
          key={c.id}
          to={`/student/cluster/${c.id}`}
          className="group block rounded-[var(--radius-lg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <EdvanceCard className="flex items-start gap-4 transition-transform duration-200 group-hover:-translate-y-0.5">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] shadow-xs"
              style={{
                backgroundColor: 'var(--color-success-skilltree-light)',
                color: 'var(--color-success-skilltree)',
              }}
            >
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
                {c.name}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                Klasse {c.class_level_min}
                {c.class_level_min !== c.class_level_max && ` – ${c.class_level_max}`}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]" />
          </EdvanceCard>
        </Link>
      ))}
    </div>
  )
}

export function FilterResults({
  loading,
  tasks,
  clusterNameById,
}: {
  loading: boolean
  tasks: Task[]
  clusterNameById: Record<string, string>
}): JSX.Element {
  if (loading) {
    return <p className="mt-6 text-sm text-[var(--color-text-tertiary)]">Suche …</p>
  }
  if (tasks.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          icon="🔍"
          title="Keine Treffer"
          description="Wechsle das Fach, lockere die Filter oder suche mit einem anderen Begriff."
        />
      </div>
    )
  }
  return (
    <div className="mt-6 flex flex-col gap-1.5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
        {tasks.length} Treffer
      </p>
      <EdvanceCard className="p-0">
        <ul className="divide-y divide-[var(--color-border)]">
          {tasks.slice(0, 50).map((t) => (
            <li key={t.id}>
              <Link
                to={`/student/task/${t.id}`}
                className="flex min-h-[56px] items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg-app)]"
              >
                <RowIcon type={t.content_type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {t.title ?? t.question?.slice(0, 80) ?? `task:${t.id.slice(0, 8)}`}
                  </p>
                  {t.cluster_id && clusterNameById[t.cluster_id] && (
                    <p className="text-xs text-[var(--color-text-tertiary)]">{clusterNameById[t.cluster_id]}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
              </Link>
            </li>
          ))}
          {tasks.length > 50 && (
            <li className="px-4 py-2 text-xs text-[var(--color-text-tertiary)]">
              … und {tasks.length - 50} weitere – Suche präziser, um sie zu sehen.
            </li>
          )}
        </ul>
      </EdvanceCard>
    </div>
  )
}

function RowIcon({ type }: { type: ContentType }): JSX.Element {
  if (type === 'video') return <PlayCircle className="h-5 w-5 shrink-0 text-[var(--color-gold-warning)]" />
  if (type === 'article') return <FileText className="h-5 w-5 shrink-0 text-[var(--color-success-eltern)]" />
  if (type === 'exercise_group' || type === 'course')
    return <FlaskConical className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
  return <BookOpen className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
}
