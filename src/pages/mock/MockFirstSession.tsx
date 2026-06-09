import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { StreakPill, XPBar } from '@/components/edvance'
import { CheckInStep, type CheckInAnswers } from './firstSession/CheckInStep'
import { PlanStep } from './firstSession/PlanStep'
import { TaskStep } from './firstSession/TaskStep'
import { SummaryStep } from './firstSession/SummaryStep'
import { HomeQuestStep } from './firstSession/HomeQuestStep'
import {
  MOCK_STUDENT_FIRST_SESSION,
  selectTasksForSession,
  type MockTask,
} from '@/lib/mocks/firstSession'

type Phase = 'check-in' | 'plan' | 'task' | 'summary' | 'home-quest'

const XP_PER_LEVEL = 500

export function MockFirstSession(): JSX.Element {
  const { t } = useTranslation('student')
  const [phase, setPhase] = useState<Phase>('check-in')
  const [taskIndex, setTaskIndex] = useState<number>(0)
  const [xpEarned, setXpEarned] = useState<number>(0)
  const [correctCount, setCorrectCount] = useState<number>(0)
  const [checkIn, setCheckIn] = useState<CheckInAnswers | null>(null)

  const sessionTasks: MockTask[] = useMemo(
    () => selectTasksForSession(checkIn?.teacherTopicIds ?? []),
    [checkIn?.teacherTopicIds],
  )
  const topicsDriven = (checkIn?.teacherTopicIds.length ?? 0) > 0

  const handleCheckInDone = (answers: CheckInAnswers): void => {
    setCheckIn(answers)
    setPhase('plan')
  }

  const handleTaskSubmit = (correct: boolean, xp: number): void => {
    if (correct) {
      setXpEarned((x) => x + xp)
      setCorrectCount((c) => c + 1)
    }
  }

  const handleTaskAdvance = (): void => {
    if (taskIndex < sessionTasks.length - 1) {
      setTaskIndex((i) => i + 1)
    } else {
      setPhase('summary')
    }
  }

  const totalXpAfter = MOCK_STUDENT_FIRST_SESSION.startXp + xpEarned

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <EdvanceNavbar subtitle="Mock · Erste Session" sticky />

      <section className="relative overflow-hidden student-hero light-source">
        <div className="mx-auto max-w-3xl px-4 py-8 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <p className="text-eyebrow opacity-70">
                {t('firstSession.hero.eyebrow')}
              </p>
              <h1 className="text-display text-3xl mt-1.5 leading-none">
                {t('firstSession.hero.greeting', {
                  name: MOCK_STUDENT_FIRST_SESSION.displayName,
                })}
              </h1>
              <p className="mt-2 text-sm opacity-80 max-w-md">
                {t('firstSession.hero.subtitle')}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <StreakPill variant="presence" count={1} />
              <StreakPill variant="home" count={0} />
            </div>
          </div>

          <div className="glass-card p-5">
            <XPBar
              current={totalXpAfter % XP_PER_LEVEL}
              max={XP_PER_LEVEL}
              level={MOCK_STUDENT_FIRST_SESSION.startLevel}
              levelName={`Level ${MOCK_STUDENT_FIRST_SESSION.startLevel}`}
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {phase === 'check-in' && (
          <CheckInStep onComplete={handleCheckInDone} />
        )}
        {phase === 'plan' && (
          <PlanStep
            tasks={sessionTasks}
            topicsDriven={topicsDriven}
            onStart={() => setPhase('task')}
          />
        )}
        {phase === 'task' && (
          <TaskStep
            key={taskIndex}
            tasks={sessionTasks}
            taskIndex={taskIndex}
            onSubmit={handleTaskSubmit}
            onAdvance={handleTaskAdvance}
          />
        )}
        {phase === 'summary' && (
          <SummaryStep
            tasks={sessionTasks}
            xpEarned={xpEarned}
            correctCount={correctCount}
            goal={checkIn?.goal ?? ''}
            onNext={() => setPhase('home-quest')}
          />
        )}
        {phase === 'home-quest' && <HomeQuestStep />}
      </main>
    </div>
  )
}
