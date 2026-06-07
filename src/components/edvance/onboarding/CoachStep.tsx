import { Check } from 'lucide-react'
import { EmptyState, LoadingPulse } from '@/components/edvance'
import { getInitials } from '@/lib/utils'
import type { CoachStepProps } from '@/types'

const AVATAR_GRADIENT = 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)'

export function CoachStep({ data, setData, coaches, loading }: CoachStepProps): JSX.Element {
  if (loading) return <LoadingPulse type="list" lines={3} />
  if (coaches.length === 0) {
    return (
      <EmptyState
        icon="🧑‍🏫"
        title="Keine Coaches"
        description="Es sind noch keine Coach-Profile angelegt. Bitte zuerst einen Coach erstellen."
      />
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Wähle einen Coach für die erste Session.</p>
      {coaches.map((coach) => {
        const selected = data.coachId === coach.id
        const name = coach.full_name ?? 'Unbenannter Coach'
        return (
          <button
            key={coach.id}
            type="button"
            onClick={() => setData({ ...data, coachId: coach.id })}
            className={`flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all ${
              selected
                ? 'ring-2 border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-surface)]'
            }`}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: AVATAR_GRADIENT }}
            >
              {getInitials(name)}
            </span>
            <span className="font-medium text-foreground">{name}</span>
            {selected && (
              <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]">
                <Check className="h-3.5 w-3.5 text-white" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
