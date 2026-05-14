import type { JSX } from 'react'
import { EdvanceBadge, EdvanceCard } from '@/components/edvance'
import { AssetList } from '@/lib/render/AssetList'
import { TaskAssetEditor } from './TaskAssetEditor'
import { TaskMetaRow } from './TaskMetaRow'
import { TaskPedagogyAccordion } from './TaskPedagogyAccordion'
import { TaskQuestionBlock } from './TaskQuestionBlock'
import type { ContentType, Task } from '@/types'

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  exercise: 'Übung',
  exercise_group: 'Übungsgruppe',
  article: 'Artikel',
  video: 'Video',
  course: 'Kurs',
}

export function TaskPreviewCard({
  task,
  microskillName,
  onTaskUpdated,
}: {
  task: Task
  microskillName?: string | null
  onTaskUpdated?: (updated: Task) => void
}): JSX.Element {
  return (
    <EdvanceCard className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[var(--text-muted)]">
          {task.source_ref && <span>{task.source_ref}</span>}
          {task.source_ref && task.curriculum_ref && <span aria-hidden="true">·</span>}
          {task.curriculum_ref && <span>{task.curriculum_ref}</span>}
        </div>
        <EdvanceBadge variant="muted">
          {CONTENT_TYPE_LABELS[task.content_type] ?? task.content_type}
        </EdvanceBadge>
      </header>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold leading-tight text-[var(--text-primary)]">
          {task.title ?? 'Ohne Titel'}
        </h2>
        {microskillName && (
          <div className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-full)] bg-[var(--primary-pale)] px-3 py-1 text-xs text-[var(--primary)]">
            <span className="uppercase tracking-widest text-[var(--text-muted)]">Microskill</span>
            <span className="font-semibold">{microskillName}</span>
          </div>
        )}
        <TaskMetaRow task={task} />
      </div>

      {task.assets && task.assets.length > 0 && <AssetList assets={task.assets} />}

      {onTaskUpdated && <TaskAssetEditor task={task} onUpdated={onTaskUpdated} />}

      <TaskQuestionBlock task={task} />

      <TaskPedagogyAccordion task={task} />
    </EdvanceCard>
  )
}
