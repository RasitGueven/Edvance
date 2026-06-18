// Pure scoring and analysis helpers for the adaptive screening controller.
// Extracted from adaptive.ts to keep file sizes within the 400-line limit.
// No side-effects, no Supabase, no DOM.

import type { ScreeningAfb, ScreeningLevel } from '@/types'
import type { AdaptiveAnswerLog, ClusterSummary } from './adaptive'

export function levelToAfb(l: 0 | ScreeningLevel): ScreeningAfb | null {
  return l === 1 ? 'I' : l === 2 ? 'II' : l === 3 ? 'III' : null
}

// Mindestanzahl korrekter Items pro Level, damit das Level als "bestätigt"
// gilt. AFB III braucht 2 Treffer (Lucky-Guess-Schutz bei 4-Optionen-MC).
export function requiredHits(level: ScreeningLevel): number {
  return level === 3 ? 2 : 1
}

export function correctOnLevel(log: AdaptiveAnswerLog[], level: ScreeningLevel): number {
  return log.filter((e) => e.level === level && e.correct === true).length
}

function masteryOnLevel(log: AdaptiveAnswerLog[], level: ScreeningLevel): number {
  const onLevel = log.filter((e) => e.level === level && e.correct !== null)
  if (onLevel.length === 0) return 0
  return onLevel.filter((e) => e.correct === true).length / onLevel.length
}

export function estimateLevel(log: AdaptiveAnswerLog[]): 0 | ScreeningLevel {
  // Höchstes Level, auf dem genug richtige Antworten vorliegen (AFB III: 2,
  // sonst 1). Verhindert Lucky-Guess-Aufstufung auf III.
  let best: 0 | ScreeningLevel = 0
  for (const lvl of [1, 2, 3] as ScreeningLevel[]) {
    if (correctOnLevel(log, lvl) >= requiredHits(lvl)) best = lvl
  }
  // Downgrade-Regel: Wenn die Mastery auf dem ermittelten Level < 50 %, ist
  // der Schüler dort noch wackelig — eine Stufe runter.
  if (best > 0 && masteryOnLevel(log, best as ScreeningLevel) < 0.5) {
    best = (best - 1) as 0 | ScreeningLevel
  }
  return best
}

export function confidenceFor(
  answered: number,
  pending: number,
  estimatedLevel: 0 | ScreeningLevel,
  log: AdaptiveAnswerLog[],
): 'low' | 'medium' | 'high' {
  if (
    answered >= 4 &&
    pending === 0 &&
    estimatedLevel > 0 &&
    correctOnLevel(log, estimatedLevel as ScreeningLevel) >= 1
  ) {
    return 'high'
  }
  if (answered >= 2 && pending <= Math.max(1, Math.floor(answered / 3))) {
    return 'medium'
  }
  return 'low'
}

// Wie summarize, aber über eine flache Log-Liste (z. B. aus persistierten
// screening_item_results rekonstruiert) — Cluster-Reihenfolge = Erstkontakt.
// Server-Wahrheit für das result_summary nach einem (ggf. resumten) Lauf.
export function summarizeLogs(logs: AdaptiveAnswerLog[]): ClusterSummary[] {
  const order: string[] = []
  const byCluster = new Map<string, AdaptiveAnswerLog[]>()
  for (const e of logs) {
    if (!byCluster.has(e.clusterId)) {
      order.push(e.clusterId)
      byCluster.set(e.clusterId, [])
    }
    byCluster.get(e.clusterId)?.push(e)
  }
  return order.map((clusterId) => {
    const log = byCluster.get(clusterId) ?? []
    const correct = log.filter((e) => e.correct === true).length
    const pending = log.filter((e) => e.correct === null).length
    const decided = log.length - pending
    const estimatedLevel = estimateLevel(log)
    return {
      clusterId,
      answered: log.length,
      correct,
      reachedAfb: levelToAfb(estimatedLevel),
      estimatedLevel,
      mastery: decided === 0 ? 0 : correct / decided,
      pending,
      confidence: confidenceFor(log.length, pending, estimatedLevel, log),
    }
  })
}
