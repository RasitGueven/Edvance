import { Check } from 'lucide-react'
import { STEP_LABELS } from '@/components/edvance/onboarding/constants'
import type { StepIndicatorProps } from '@/types'

const ACTIVE_BG = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'

function stepBackground(done: boolean, active: boolean): string {
  if (done) return 'var(--success)'
  if (active) return ACTIVE_BG
  return 'var(--border)'
}

function stepLabelColor(done: boolean, active: boolean): string {
  if (active) return 'var(--primary)'
  if (done) return 'var(--success)'
  return 'var(--muted)'
}

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
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all"
                style={{
                  background: stepBackground(done, active),
                  color: done || active ? 'white' : 'var(--muted)',
                }}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className="mt-1 text-xs font-medium hidden sm:block"
                style={{ color: stepLabelColor(done, active) }}
              >
                {label}
              </span>
            </div>
            {index < STEP_LABELS.length - 1 && (
              <div
                className="h-0.5 w-10 mx-1 mb-4 sm:w-14 transition-all"
                style={{ background: done ? 'var(--success)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
