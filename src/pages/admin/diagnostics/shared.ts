import { COGNITIVE_TYPE_LABELS, INPUT_TYPE_LABELS } from '@/lib/taskLabels'
import { SELECT_SM } from '@/lib/formStyles'
import type { CognitiveType, InputType } from '@/types'

export const INPUT_TYPES = Object.keys(INPUT_TYPE_LABELS) as InputType[]
export const COG_TYPES = Object.keys(COGNITIVE_TYPE_LABELS) as CognitiveType[]

export const SELECT_CLASS = SELECT_SM

export type Edit = {
  is_diagnostic: boolean
  difficulty: number | null
  input_type: InputType | null
  cognitive_type: CognitiveType | null
}
