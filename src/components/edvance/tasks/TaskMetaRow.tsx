import type { JSX, ReactNode } from 'react'
import { Brain, Clock, Layers, TestTube2, Type } from 'lucide-react'
import { EdvanceBadge } from '@/components/edvance'
import type { Task } from '@/types'

function difficultyColor(value: number): string {
  if (value <= 1) return 'var(--success)'
  if (value <= 3) return 'var(--primary)'
  return 'var(--warning)'
}

function DifficultyScale({ value }: { value: number | null }): JSX.Element {
  const v = value ?? 0
  const fill = difficultyColor(v)
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Schwierigkeit ${v} von 5`}
      title={`Schwierigkeit ${v}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: i <= v ? fill : 'var(--border)' }}
        />
      ))}
    </span>
  )
}

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <span className="text-[var(--text-muted)]">{icon}</span>
      {children}
    </span>
  )
}

export function TaskMetaRow({ task }: { task: Task }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <MetaItem icon={<Layers className="h-3.5 w-3.5" />}>
        Klasse {task.class_level ?? '–'}
      </MetaItem>
      <MetaItem icon={<Clock className="h-3.5 w-3.5" />}>
        {task.estimated_minutes} Min
      </MetaItem>
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <span className="text-[var(--text-muted)]">Schwierigkeit</span>
        <DifficultyScale value={task.difficulty} />
      </span>
      {task.cognitive_type && (
        <EdvanceBadge variant="primary">
          <Brain className="h-3 w-3" />
          {task.cognitive_type}
        </EdvanceBadge>
      )}
      {task.input_type && (
        <EdvanceBadge variant="muted">
          <Type className="h-3 w-3" />
          {task.input_type}
        </EdvanceBadge>
      )}
      {task.is_diagnostic && (
        <EdvanceBadge variant="warning">
          <TestTube2 className="h-3 w-3" />
          Diagnostik
        </EdvanceBadge>
      )}
    </div>
  )
}
