import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, FileText, FlaskConical, PlayCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Task } from '@/types'

type ContentType = Task['content_type']

function RowIcon({ type }: { type: ContentType }) {
  if (type === 'video') return <PlayCircle className="h-5 w-5 shrink-0 text-warning" />
  if (type === 'article') return <FileText className="h-5 w-5 shrink-0 text-success" />
  if (type === 'exercise_group' || type === 'course')
    return <FlaskConical className="h-5 w-5 shrink-0 text-primary" />
  return <BookOpen className="h-5 w-5 shrink-0 text-primary" />
}

export function FilterResults({
  loading,
  tasks,
  clusterNameById,
}: {
  loading: boolean
  tasks: Task[]
  clusterNameById: Record<string, string>
}) {
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
                      {t.title ?? t.question?.slice(0, 80) ?? `task:${t.id.slice(0, 8)}`}
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
