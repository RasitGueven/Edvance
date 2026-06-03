import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { EdvanceCard, MasteryBar, RarityBadge } from '@/components/edvance'
import { BossChallengeModal } from '@/components/edvance/moments'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { MASTERY_STAGE_LABEL, MASTERY_STAGE_COLOR } from '@/lib/mastery'
import {
  MOCK_CLUSTER_PROGRESS,
  sessionMinutes,
  type MockTask,
} from '@/lib/mocks/firstSession'

interface SummaryStepProps {
  tasks: MockTask[]
  xpEarned: number
  correctCount: number
  goal: string
  onNext: () => void
}

export function SummaryStep({
  tasks,
  xpEarned,
  correctCount,
  goal,
  onNext,
}: SummaryStepProps): JSX.Element {
  const { t } = useTranslation('student')
  const total = tasks.length
  const accuracy = total === 0 ? 0 : correctCount / total
  const [bossOpen, setBossOpen] = useState<boolean>(accuracy >= 0.8)

  return (
    <div className="flex flex-col gap-6 animate-fly-in">
      <BossChallengeModal open={bossOpen} onClose={() => setBossOpen(false)} />

      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] animate-scale-in">
          {t('firstSession.summary.headline')}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t('firstSession.summary.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          value={xpEarned.toString()}
          label={t('firstSession.summary.xpEarnedLabel')}
          colorVar="--color-accent"
        />
        <StatTile
          value={`${correctCount}/${total}`}
          label={t('firstSession.summary.tasksDoneLabel')}
          colorVar="--color-primary"
        />
        <StatTile
          value={sessionMinutes(tasks).toString()}
          label={t('firstSession.summary.timeLabel')}
          colorVar="--color-mastery-proficient"
        />
      </div>

      {goal.length > 0 && (
        <EdvanceCard accent="mastered">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-success-answer-light)]">
              <Check
                className="h-5 w-5 text-[var(--color-success-answer)]"
                aria-hidden="true"
              />
            </span>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                {t('firstSession.summary.goalEyebrow')}
              </p>
              <p className="text-base font-semibold text-[var(--color-text-primary)] break-words">
                {goal}
              </p>
              <span className="text-xs font-semibold text-[var(--color-success-answer)]">
                ✓ {t('firstSession.summary.goalDone')}
              </span>
            </div>
          </div>
        </EdvanceCard>
      )}

      <EdvanceCard>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
          {t('firstSession.summary.masteryEyebrow')}
        </p>
        <div className="flex flex-col gap-5">
          {MOCK_CLUSTER_PROGRESS.map((p) => (
            <div key={p.clusterId} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {p.clusterName}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: MASTERY_STAGE_COLOR[p.after] }}
                >
                  {MASTERY_STAGE_LABEL[p.before]} → {MASTERY_STAGE_LABEL[p.after]}
                </span>
              </div>
              <MasteryBar score={p.afterScore} size="md" />
            </div>
          ))}
        </div>
      </EdvanceCard>

      <EdvanceCard className="flex items-center gap-4">
        <RarityBadge rarity="bronze" form="round" size="md">★</RarityBadge>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {t('firstSession.summary.badgeLabel')}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {t('firstSession.summary.badgeSub')}
          </p>
        </div>
      </EdvanceCard>

      <button
        type="button"
        onClick={onNext}
        className={cn(
          'min-h-[44px] w-full rounded-[var(--radius-lg)] px-6 py-3',
          'text-sm font-semibold text-white shadow-md transition-all duration-base',
          'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]',
        )}
      >
        {t('firstSession.summary.cta')}
      </button>
    </div>
  )
}

interface StatTileProps {
  value: string
  label: string
  colorVar: string
}
function StatTile({ value, label, colorVar }: StatTileProps): JSX.Element {
  return (
    <EdvanceCard className="flex flex-col items-center gap-1 py-5 text-center">
      <span className="text-3xl font-bold" style={{ color: `var(${colorVar})` }}>
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </span>
    </EdvanceCard>
  )
}
