import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CLASS_LEVELS, SCHOOL_TYPES } from '@/components/edvance/onboarding/constants'
import type { SchoolType, StepProps } from '@/types'

const HIGHLIGHT_BG = 'color-mix(in srgb, var(--primary) 10%, transparent)'

function selectableStyle(selected: boolean): { borderColor: string; background: string; color: string } {
  return {
    borderColor: selected ? 'var(--primary)' : 'var(--border)',
    background: selected ? HIGHLIGHT_BG : 'transparent',
    color: selected ? 'var(--primary)' : 'var(--foreground)',
  }
}

export function StudentDataStep({ data, setData }: StepProps): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">Vorname</Label>
          <Input
            id="firstName"
            placeholder="z.B. Lena"
            value={data.firstName}
            onChange={(event) => setData({ ...data, firstName: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Nachname</Label>
          <Input
            id="lastName"
            placeholder="z.B. Fischer"
            value={data.lastName}
            onChange={(event) => setData({ ...data, lastName: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-Mail (Eltern)</Label>
        <Input
          id="email"
          type="email"
          placeholder="eltern@beispiel.de"
          value={data.email}
          onChange={(event) => setData({ ...data, email: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Klasse</Label>
          <div className="flex flex-wrap gap-2">
            {CLASS_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setData({ ...data, classLevel: level })}
                className="h-9 w-11 rounded-lg border text-sm font-medium transition-all"
                style={selectableStyle(data.classLevel === level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Schultyp</Label>
          <div className="flex flex-col gap-2">
            {SCHOOL_TYPES.map((type) => {
              const selected = data.schoolType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setData({ ...data, schoolType: type as SchoolType })}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-all"
                  style={selectableStyle(selected)}
                >
                  {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  {type}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="school">Schule (optional)</Label>
        <Input
          id="school"
          placeholder="z.B. Humboldt-Gymnasium Köln"
          value={data.schoolName}
          onChange={(event) => setData({ ...data, schoolName: event.target.value })}
        />
      </div>
    </div>
  )
}
