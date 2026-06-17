/**
 * Reine Auswertungs-Logik für die Aufgaben-Stubs (kein React).
 * Bewusst schlank — der Mock beweist den Render-/Input-Pfad, nicht den
 * vollen SerloRenderer.
 */
import type { SessionTask } from '@/lib/mocks/session'

export type TaskAnswer =
  | { kind: 'mc'; index: number | null }
  | { kind: 'numeric'; raw: string }
  | { kind: 'coordinate'; points: { x: number; y: number }[] }

export function initialAnswer(task: SessionTask): TaskAnswer {
  switch (task.kind) {
    case 'mc':
      return { kind: 'mc', index: null }
    case 'numeric':
      return { kind: 'numeric', raw: '' }
    case 'coordinate':
      return { kind: 'coordinate', points: task.initialPoints.map((p) => ({ ...p })) }
  }
}

/** Darf „Prüfen" gedrückt werden? */
export function answerReady(answer: TaskAnswer): boolean {
  switch (answer.kind) {
    case 'mc':
      return answer.index !== null
    case 'numeric':
      return answer.raw.trim() !== ''
    case 'coordinate':
      return answer.points.length > 0
  }
}

function parseNumeric(raw: string): number {
  return Number(raw.trim().replace(',', '.'))
}

export function evaluateTask(task: SessionTask, answer: TaskAnswer): boolean {
  if (task.kind === 'mc' && answer.kind === 'mc') {
    return answer.index === task.correctIndex
  }
  if (task.kind === 'numeric' && answer.kind === 'numeric') {
    const value = parseNumeric(answer.raw)
    if (!Number.isFinite(value)) return false
    return Math.abs(value - task.answer) <= task.tolerance
  }
  if (task.kind === 'coordinate' && answer.kind === 'coordinate') {
    if (answer.points.length !== task.targetPoints.length) return false
    return task.targetPoints.every((target, i) => {
      const point = answer.points[i]
      return (
        point !== undefined &&
        Math.abs(point.x - target.x) <= task.tolerance &&
        Math.abs(point.y - target.y) <= task.tolerance
      )
    })
  }
  return false
}
