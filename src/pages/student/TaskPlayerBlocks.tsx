import type { JSX } from 'react'
import { MathContent } from '@/lib/render/MathContent'
import type { Task } from '@/types'

type ContentType = Task['content_type']

export const TYPE_LABEL: Record<ContentType, string> = {
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

export function TypeBadge({ type }: { type: ContentType }): JSX.Element {
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

export function DifficultyBadge({ difficulty }: { difficulty: number }): JSX.Element {
  const dots = [1, 2, 3, 4, 5].map((i) => (
    <span
      key={i}
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{
        background: i <= difficulty ? 'var(--primary)' : 'var(--border-strong)',
      }}
    />
  ))
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted">
      {dots}
    </span>
  )
}

export function VideoBlock({ task }: { task: Task }): JSX.Element {
  const url = task.question
  if (!url) return <p className="text-sm text-muted">– kein Video-Link –</p>
  return (
    <div className="flex flex-col gap-4">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 self-start rounded-lg border-2 border-border bg-card px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
      >
        {task.title ?? 'Video oeffnen'}
      </a>
      {task.solution && <MathContent text={task.solution} />}
    </div>
  )
}

export function UnsupportedBlock({ type }: { type: ContentType }): JSX.Element {
  return (
    <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
      <p className="text-sm font-semibold text-muted">
        Inhaltstyp <code className="rounded bg-border-strong/40 px-1.5 py-0.5">{type}</code>{' '}
        ist noch nicht unterstuetzt.
      </p>
    </div>
  )
}
