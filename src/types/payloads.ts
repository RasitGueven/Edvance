// Typisierte Payloads für strukturierte Aufgaben (question_payload in tasks-Tabelle).
// Jeder Typ hat ein discriminator-Feld `type` für sicheres Parsen.

export type MCPayload = {
  type: 'mc'
  options: string[]      // Antwortoptionen (math-String erlaubt)
  correct_index: number  // Index der korrekten Option (für spätere Auswertung)
}

export type MatchingPayload = {
  type: 'matching'
  pairs: Array<{ left: string; right: string }>  // korrekte Paare; right wird im Widget gemischt
}

export type StepsPayload = {
  type: 'steps'
  steps: Array<{ prompt: string; placeholder?: string }>
}

export type QuestionPayload = MCPayload | MatchingPayload | StepsPayload

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

export function parseMCPayload(raw: unknown): MCPayload | null {
  if (!isObj(raw) || raw.type !== 'mc') return null
  if (!Array.isArray(raw.options) || typeof raw.correct_index !== 'number') return null
  return raw as MCPayload
}

export function parseMatchingPayload(raw: unknown): MatchingPayload | null {
  if (!isObj(raw) || raw.type !== 'matching') return null
  if (!Array.isArray(raw.pairs)) return null
  return raw as MatchingPayload
}

export function parseStepsPayload(raw: unknown): StepsPayload | null {
  if (!isObj(raw) || raw.type !== 'steps') return null
  if (!Array.isArray(raw.steps)) return null
  return raw as StepsPayload
}
