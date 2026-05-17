// Glue zwischen DB-Item-Bank und reinem adaptiven Controller.
// Lädt den freigegebenen (active) Pool und formt UI-Rohwerte in die
// Antwort-Objekte, die der Auto-Grader erwartet. Kein Zustand hier —
// der Controller (adaptive.ts) hält die Sitzung.

import { listScreeningItems } from '@/lib/supabase/screeningItems'
import type { ScreeningItem, SupabaseResult } from '@/types'

// Nur freigegebene Items. Engine degradiert robust bei leerem Ergebnis
// (Aufrufer zeigt dann einen freundlichen Leerzustand).
export async function loadActiveScreeningPool(): Promise<
  SupabaseResult<ScreeningItem[]>
> {
  return listScreeningItems({ active: true })
}

export type McPayload = { type: 'mc'; options: string[]; correct_index?: number }

export function isMcPayload(p: unknown): p is McPayload {
  return (
    typeof p === 'object' &&
    p !== null &&
    Array.isArray((p as { options?: unknown }).options)
  )
}

// Rohwert aus der UI → Antwort-Objekt für gradeScreeningAnswer.
//  - MC / mc_index:   Index → { index }
//  - sonst (numeric / normalized / Fallback): Freitext → { value }
export function buildScreeningAnswer(
  item: ScreeningItem,
  raw: { mcIndex: number | null; text: string },
): unknown {
  if (item.check_type === 'mc_index') {
    return { index: raw.mcIndex }
  }
  return { value: raw.text.trim() }
}
