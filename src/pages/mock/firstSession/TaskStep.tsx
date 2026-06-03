import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { EdvanceCard, EdvanceBadge, ToastBanner } from '@/components/edvance'
import { cn } from '@/lib/utils'
import type { MockTask } from '@/lib/mocks/firstSession'

interface TaskStepProps {
  tasks: MockTask[]
  taskIndex: number
  onSubmit: (correct: boolean, xpEarned: number) => void
  onAdvance: () => void
}

export function TaskStep({
  tasks,
  taskIndex,
  onSubmit,
  onAdvance,
}: TaskStepProps): JSX.Element {
  const { t } = useTranslation('student')
  const task: MockTask = tasks[taskIndex]
  const isLast = taskIndex === tasks.length - 1

  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [toastOpen, setToastOpen] = useState<boolean>(false)

  const isCorrect = submitted && selected === task.correctIndex

  const handleSubmit = (): void => {
    if (selected === null || submitted) return
    setSubmitted(true)
    const correct = selected === task.correctIndex
    if (correct) {
      setToastOpen(true)
      onSubmit(true, task.xp)
    } else {
      onSubmit(false, 0)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fly-in">
      {toastOpen && (
        <ToastBanner
          type="xp"
          message={t('firstSession.task.xpToast')}
          xpAmount={task.xp}
          onClose={() => setToastOpen(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <EdvanceBadge variant="primary">
          {t('firstSession.task.progress', {
            current: taskIndex + 1,
            total: tasks.length,
          })}
        </EdvanceBadge>
        <EdvanceBadge variant="muted">AFB {task.difficulty}</EdvanceBadge>
      </div>

      <EdvanceCard>
        <div className="flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {task.clusterName}
          </p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {task.question}
          </p>

          <div className="flex flex-col gap-2">
            {task.options.map((opt, idx) => {
              const isSelected = selected === idx
              const isCorrectAnswer = submitted && idx === task.correctIndex
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !submitted && setSelected(idx)}
                  disabled={submitted}
                  className={cn(
                    'min-h-[44px] rounded-[var(--radius-md)] border-2 px-4 py-3',
                    'text-left text-sm font-medium transition-all duration-base ease-bounce',
                    'disabled:cursor-default',
                    isCorrectAnswer
                      ? 'border-[var(--color-success-answer)] bg-[var(--color-success-answer-light)] text-[var(--color-success-answer)]'
                      : isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:-translate-y-0.5 hover:shadow-md',
                  )}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {submitted && (
            <div
              className={cn(
                'rounded-[var(--radius-md)] p-4 text-sm font-medium animate-fly-in',
                isCorrect
                  ? 'bg-[var(--color-success-answer-light)] text-[var(--color-success-answer)]'
                  : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]',
              )}
            >
              {isCorrect
                ? t('firstSession.task.feedbackRight')
                : t('firstSession.task.feedbackTryAgain')}
            </div>
          )}
        </div>
      </EdvanceCard>

      <button
        type="button"
        onClick={submitted ? onAdvance : handleSubmit}
        disabled={!submitted && selected === null}
        className={cn(
          'min-h-[44px] w-full rounded-[var(--radius-lg)] px-6 py-3',
          'text-sm font-semibold text-white shadow-md transition-all duration-base',
          'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {!submitted
          ? t('firstSession.task.submit')
          : isLast
            ? t('firstSession.task.finish')
            : t('firstSession.task.next')}
      </button>
    </div>
  )
}
