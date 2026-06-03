import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { EdvanceCard } from '@/components/edvance'
import { cn } from '@/lib/utils'
import type { MockMood } from '@/lib/mocks/firstSession'

export interface CheckInAnswers {
  mood: MockMood
  hasExam: boolean
  examSubject: string
  goal: string
}

interface CheckInStepProps {
  onComplete: (answers: CheckInAnswers) => void
}

type SubStep = 'mood' | 'exam' | 'goal'

const MOODS: { value: MockMood; emoji: string; labelKey: string }[] = [
  { value: 'happy', emoji: '😊', labelKey: 'firstSession.checkIn.mood.happy' },
  { value: 'neutral', emoji: '😐', labelKey: 'firstSession.checkIn.mood.neutral' },
  { value: 'low', emoji: '😟', labelKey: 'firstSession.checkIn.mood.low' },
]

export function CheckInStep({ onComplete }: CheckInStepProps): JSX.Element {
  const { t } = useTranslation('student')
  const [sub, setSub] = useState<SubStep>('mood')
  const [mood, setMood] = useState<MockMood | null>(null)
  const [hasExam, setHasExam] = useState<boolean | null>(null)
  const [examSubject, setExamSubject] = useState<string>('')
  const [goal, setGoal] = useState<string>('')

  const advance = (): void => {
    if (sub === 'mood' && mood) setSub('exam')
    else if (sub === 'exam' && hasExam !== null) setSub('goal')
    else if (sub === 'goal') {
      onComplete({
        mood: mood ?? 'neutral',
        hasExam: hasExam ?? false,
        examSubject: examSubject.trim(),
        goal: goal.trim(),
      })
    }
  }

  const canAdvance =
    (sub === 'mood' && mood !== null) ||
    (sub === 'exam' && hasExam !== null) ||
    sub === 'goal'

  return (
    <div key={sub} className="flex flex-col gap-6 animate-fly-in">
      <EdvanceCard>
        {sub === 'mood' && (
          <MoodPicker mood={mood} setMood={setMood} t={t} />
        )}
        {sub === 'exam' && (
          <ExamPicker
            hasExam={hasExam}
            setHasExam={setHasExam}
            examSubject={examSubject}
            setExamSubject={setExamSubject}
            t={t}
          />
        )}
        {sub === 'goal' && (
          <GoalPicker goal={goal} setGoal={setGoal} t={t} />
        )}
      </EdvanceCard>

      <button
        type="button"
        onClick={advance}
        disabled={!canAdvance}
        className={cn(
          'min-h-[44px] w-full rounded-[var(--radius-lg)] px-6 py-3',
          'text-sm font-semibold text-white shadow-md transition-all duration-base',
          'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {sub === 'goal'
          ? t('firstSession.checkIn.start')
          : t('firstSession.checkIn.next')}
      </button>
    </div>
  )
}

interface MoodProps {
  mood: MockMood | null
  setMood: (m: MockMood) => void
  t: (key: string) => string
}
function MoodPicker({ mood, setMood, t }: MoodProps): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        {t('firstSession.checkIn.mood.question')}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMood(m.value)}
            className={cn(
              'flex flex-col items-center justify-center gap-2 min-h-[96px]',
              'rounded-[var(--radius-lg)] border-2 p-4 transition-all duration-base ease-bounce',
              mood === m.value
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:-translate-y-0.5 hover:shadow-md',
            )}
          >
            <span className="text-4xl leading-none" aria-hidden="true">
              {m.emoji}
            </span>
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {t(m.labelKey)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface ExamProps {
  hasExam: boolean | null
  setHasExam: (v: boolean) => void
  examSubject: string
  setExamSubject: (v: string) => void
  t: (key: string) => string
}
function ExamPicker({
  hasExam,
  setHasExam,
  examSubject,
  setExamSubject,
  t,
}: ExamProps): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        {t('firstSession.checkIn.exam.question')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: true, labelKey: 'firstSession.checkIn.exam.yes' },
          { value: false, labelKey: 'firstSession.checkIn.exam.no' },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => setHasExam(opt.value)}
            className={cn(
              'min-h-[56px] rounded-[var(--radius-lg)] border-2 p-4',
              'text-sm font-semibold transition-all duration-base ease-bounce',
              hasExam === opt.value
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:-translate-y-0.5 hover:shadow-md',
            )}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>
      {hasExam === true && (
        <div className="flex flex-col gap-2 animate-fly-in">
          <label
            htmlFor="exam-subject"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
          >
            {t('firstSession.checkIn.exam.subjectLabel')}
          </label>
          <input
            id="exam-subject"
            type="text"
            value={examSubject}
            onChange={(e) => setExamSubject(e.target.value)}
            placeholder={t('firstSession.checkIn.exam.subjectPlaceholder')}
            className={cn(
              'min-h-[44px] rounded-[var(--radius-md)] border border-[var(--color-border)]',
              'bg-[var(--color-bg-surface)] px-4 py-2 text-sm text-[var(--color-text-primary)]',
              'focus:border-[var(--color-primary)] focus:outline-none',
            )}
          />
        </div>
      )}
    </div>
  )
}

interface GoalProps {
  goal: string
  setGoal: (v: string) => void
  t: (key: string) => string
}
function GoalPicker({ goal, setGoal, t }: GoalProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        {t('firstSession.checkIn.goal.question')}
      </h2>
      <p className="text-xs text-[var(--color-text-tertiary)]">
        {t('firstSession.checkIn.goal.hint')}
      </p>
      <textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder={t('firstSession.checkIn.goal.placeholder')}
        rows={3}
        className={cn(
          'rounded-[var(--radius-md)] border border-[var(--color-border)]',
          'bg-[var(--color-bg-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)]',
          'focus:border-[var(--color-primary)] focus:outline-none resize-none',
        )}
      />
    </div>
  )
}
