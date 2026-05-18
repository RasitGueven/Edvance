import { Check } from 'lucide-react'
import { STEP_LABELS } from '@/components/edvance/onboarding/constants'
import type { StepIndicatorProps } from '@/types'

export function StepIndicator({ current }: StepIndicatorProps): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, index) => {
        const done = index < current
        const active = index === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all',
                  done && 'bg-[var(--success)] text-white',
                  active && 'bg-gradient-brand text-white',
                  !done && !active && 'bg-[var(--border)] text-[var(--text-muted)]',
                ].filter(Boolean).join(' ')}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={[
                  'mt-1 text-xs font-medium hidden sm:block',
                  active && 'text-[var(--primary)]',
                  done && 'text-[var(--success)]',
                  !done && !active && 'text-[var(--text-muted)]',
                ].filter(Boolean).join(' ')}
              >
                {label}
              </span>
            </div>
            {index < STEP_LABELS.length - 1 && (
              <div
                className={[
                  'h-0.5 w-10 mx-1 mb-4 sm:w-14 transition-all',
                  done ? 'bg-[var(--success)]' : 'bg-[var(--border)]',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
