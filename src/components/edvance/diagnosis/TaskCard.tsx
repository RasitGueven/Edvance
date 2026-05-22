import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Pencil, Lightbulb } from 'lucide-react'
import type { BehaviorAnalysis, BehaviorSnapshot } from '@/types/diagnosis'
import type { RunTask } from '@/types'
import {
  SIGNAL_LABELS,
  FlagTag,
  KV,
  MiniMetric,
  SmallBadge,
  formatDuration,
} from './shared'

export function TaskCard({
  index,
  task,
  snapshot,
  analysis,
}: {
  index: number
  task: RunTask | undefined
  snapshot: BehaviorSnapshot | undefined
  analysis: BehaviorAnalysis | undefined
}) {
  const [open, setOpen] = useState(false)
  if (!task) return null

  const signal = analysis ? SIGNAL_LABELS[analysis.mastery_signal] : null
  const ratingNum = snapshot?.coach_rating ?? null
  const ratingColor = ratingNum
    ? ratingNum >= 3
      ? 'var(--success)'
      : ratingNum === 2
      ? 'var(--warning)'
      : 'var(--destructive)'
    : 'var(--muted)'
  const ratingDark = ratingNum
    ? ratingNum >= 3
      ? 'var(--success-dark)'
      : ratingNum === 2
      ? 'var(--warning-dark)'
      : 'var(--destructive-dark)'
    : 'var(--border-strong)'

  return (
    <div
      className="rounded-2xl bg-card overflow-hidden transition-all"
      style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-background transition-colors"
      >
        {/* Index & Rating Medal */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Aufg. {index + 1}</span>
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white"
            style={{
              background: ratingColor,
              borderBottom: `3px solid ${ratingDark}`,
            }}
          >
            {ratingNum ? `L${ratingNum}` : '–'}
          </span>
        </div>

        {/* Center: Skill + Question */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted">{task.skill_id}</span>
            {signal && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide text-white"
                style={{ background: signal.color }}
              >
                {signal.label}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-foreground leading-snug truncate">{task.question}</p>
          {snapshot && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <SmallBadge icon={<Clock className="h-2.5 w-2.5" />} text={formatDuration(snapshot.task_duration_ms)} />
              <SmallBadge icon={<Pencil className="h-2.5 w-2.5" />} text={`${snapshot.revision_count} Rev.`} />
              {snapshot.hint_used && <SmallBadge icon={<Lightbulb className="h-2.5 w-2.5" />} text="Hint" />}
              <SmallBadge text={`${snapshot.answer_length} Zch`} />
            </div>
          )}
        </div>

        <span className="ml-2 shrink-0 text-muted">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>

      {open && snapshot && analysis && (
        <div
          className="border-t-2 border-border p-5"
          style={{ background: 'var(--background)' }}
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            {/* Antwort */}
            <div className="lg:col-span-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Schülerantwort</p>
              <pre
                className="whitespace-pre-wrap font-mono text-sm bg-card rounded-xl p-4 leading-relaxed"
                style={{ border: '2px solid var(--border)' }}
              >
                {snapshot.answer_text}
              </pre>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted mb-2">Musterlösung</p>
              <pre
                className="whitespace-pre-wrap font-mono text-sm rounded-xl p-4 leading-relaxed"
                style={{
                  background: 'color-mix(in srgb, var(--success) 6%, transparent)',
                  border: '2px solid color-mix(in srgb, var(--success) 25%, transparent)',
                }}
              >
                {task.solution}
              </pre>
            </div>

            {/* Verhaltensdaten */}
            <div className="lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Verhalten</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold mb-3">
                <KV k="Bedenkzeit" v={`${(snapshot.thinking_time_ms / 1000).toFixed(1)}s`} />
                <KV k="Dauer" v={formatDuration(snapshot.task_duration_ms)} />
                <KV k="Revisionen" v={String(snapshot.revision_count)} />
                <KV k="Rewrites" v={String(snapshot.rewrite_count)} />
                <KV k="Antwort-Länge" v={`${snapshot.answer_length} Zch`} />
                <KV k="Nach-Check" v={`${(snapshot.time_after_completion_ms / 1000).toFixed(1)}s`} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <MiniMetric label="Conf" value={analysis.confidence_score} color="var(--success)" />
                <MiniMetric label="Effort" value={analysis.effort_score} color="var(--primary)" />
                <MiniMetric label="Frust" value={analysis.frustration_index} color="var(--warning)" inverted />
              </div>

              {analysis.flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.flags.map(f => (
                    <FlagTag key={f} label={f} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
