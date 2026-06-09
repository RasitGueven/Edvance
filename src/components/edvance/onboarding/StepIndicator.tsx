import { Check } from 'lucide-react'
import { STEP_LABELS, PRIMARY_GRADIENT } from '@/components/edvance/onboarding/constants'
import type { StepIndicatorProps } from '@/types'

function stepLabelCls(done: boolean, active: boolean): string {
  if (active) return 'text-[var(--color-primary)]'
  if (done) return 'text-[var(--color-success)]'
  return 'text-muted'
}

export function StepIndicator({ current }: StepIndicatorProps): JSX.Element {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-0">
        {STEP_LABELS.map((label, index) => {
          const done = index < current
          const active = index === current
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${active ? 'h-10 w-10' : 'h-9 w-9'} ${done || active ? 'text-white' : 'text-muted'}`}
                  style={{
                    background: done
                      ? 'var(--color-success)'
                      : active
                      ? PRIMARY_GRADIENT
                      : 'var(--color-border)',
                  }}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`mt-1 block text-[10px] font-medium ${stepLabelCls(done, active)}`}>
                  {label}
                </span>
              </div>
              {index < STEP_LABELS.length - 1 && (
                <div
                  className={`mx-1 mb-4 h-1 w-10 transition-all duration-500 sm:w-14 ${
                    done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
          style={{ width: `${Math.round(((current + 1) / STEP_LABELS.length) * 100)}%` }}
        />
      </div>
    </div>
  )
}
