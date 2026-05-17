// Geteilte Konstanten/Typen der Diagnose-Verwaltung.

import { COGNITIVE_TYPE_LABELS, INPUT_TYPE_LABELS } from '@/lib/taskLabels'
import type { CognitiveType, InputType } from '@/types'

export const INPUT_TYPES = Object.keys(INPUT_TYPE_LABELS) as InputType[]
export const COG_TYPES = Object.keys(COGNITIVE_TYPE_LABELS) as CognitiveType[]

export const SELECT_CLASS =
  'h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 text-sm'

export type Edit = {
  is_diagnostic: boolean
  difficulty: number | null
  input_type: InputType | null
  cognitive_type: CognitiveType | null
}
