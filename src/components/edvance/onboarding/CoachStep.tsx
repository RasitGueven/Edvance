import { Check } from 'lucide-react'
import { MOCK_COACHES } from '@/components/edvance/onboarding/constants'
import { getInitials } from '@/lib/utils'
import type { StepProps } from '@/types'

const SELECTED_BG = 'color-mix(in srgb, var(--primary) 8%, transparent)'
const AVATAR_GRADIENT = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'

export function CoachStep({ data, setData }: StepProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Wähle einen Coach für die erste Session.</p>
      {MOCK_COACHES.map((coach) => {
        const selected = data.coachId === coach.id
        return (
          <button
            key={coach.id}
            type="button"
            onClick={() => setData({ ...data, coachId: coach.id })}
            className="flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all"
            style={{
              borderColor: selected ? 'var(--primary)' : 'var(--border)',
              background: selected ? SELECTED_BG : 'var(--card)',
              boxShadow: selected ? '0 0 0 2px var(--primary)' : 'none',
            }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: AVATAR_GRADIENT }}
            >
              {getInitials(coach.name)}
            </span>
            <span className="font-medium text-foreground">{coach.name}</span>
            {selected && (
              <span
                className="ml-auto flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: 'var(--primary)' }}
              >
                <Check className="h-3.5 w-3.5 text-white" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
