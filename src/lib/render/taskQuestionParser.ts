// Parst eine Mathebuch-Aufgaben-Question in Praeambel + Teilaufgaben.
// Erkennt typische Teilaufgaben-Marker am Zeilenanfang: "a)", "b)" usw.
//
// Beispiel:
//   "Ein Wuerfel ... Die Tabelle zeigt:\n\n[TABLE]\n\na) Ordne die Zeilen ...\nb) Begruende ..."
// →
//   [
//     { type: 'preamble', content: 'Ein Wuerfel ... Die Tabelle zeigt:\n\n[TABLE]' },
//     { type: 'subtask', key: 'a', content: 'Ordne die Zeilen ...' },
//     { type: 'subtask', key: 'b', content: 'Begruende ...' },
//   ]

export type QuestionPart =
  | { type: 'preamble'; content: string }
  | { type: 'subtask'; key: string; content: string }

const SUBTASK_PATTERN = /(?:^|\n)([a-z])\)\s+/g

export function parseQuestion(text: string | null | undefined): QuestionPart[] {
  if (!text) return []
  const matches = Array.from(text.matchAll(SUBTASK_PATTERN))
  if (matches.length === 0) {
    return [{ type: 'preamble', content: text.trim() }]
  }

  const parts: QuestionPart[] = []
  const firstStart = matches[0].index ?? 0
  const preamble = text.slice(0, firstStart).trim()
  if (preamble) parts.push({ type: 'preamble', content: preamble })

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const startIdx = (m.index ?? 0) + m[0].length
    const endIdx = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length
    const content = text.slice(startIdx, endIdx).trim()
    parts.push({ type: 'subtask', key: m[1], content })
  }

  return parts
}
