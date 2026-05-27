/**
 * Mastery-5-Stufen-Mapping (Frontend-Seitig).
 * Backend-Schema bleibt `level: 1..10` — diese Funktion bündelt die
 * Visualisierungs-Logik an einer Stelle (Hard Rule DESIGN_SYSTEM.md §6:
 * Mastered nur nach Coach-Bestätigung im Backend; diese Funktion
 * unterscheidet rein farblich).
 */

export type MasteryStage =
  | 'introduced'
  | 'developing'
  | 'progressing'
  | 'proficient'
  | 'mastered'

export function masteryStage(score: number): MasteryStage {
  if (score >= 85) return 'mastered'
  if (score >= 75) return 'proficient'
  if (score >= 60) return 'progressing'
  if (score >= 40) return 'developing'
  return 'introduced'
}

export function masteryStageFromLevel(level: number): MasteryStage {
  return masteryStage(level * 10)
}
