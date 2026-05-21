// Adaptiver Screening-Controller — reine, deterministische Zustandsmaschine.
// Kein Supabase, kein DOM: bekommt einen Item-Pool + Intake-Konfig, liefert
// Schritt für Schritt das nächste Item und am Ende eine Cluster-Auswertung.
// Persistenz/Integration passiert außerhalb (P5).
//
// Ablauf: Warm-up-Sweep (1 AFB-I-Item je Cluster, breit) → Fokus-Treppe je
// Cluster (Start AFB I, richtig → AFB+1, falsch → AFB−1, null → bleibt;
// Stopp bei Konvergenz/Kappe/erschöpftem Pool). Intake kann Themen hart
// ausschließen und Cluster gewichten (mehr Tiefe). Robust: fehlende Stufe/
// Cluster wird übersprungen, nie ein Crash. Das Kind sieht NIE richtig/falsch
// (CLAUDE.md §6) — Grading ist hier nur interne Zustandslogik.
//
// AFB ↔ level: VERA-Items werden so geseedet, dass `level` numerisch dem AFB
// entspricht (I=1, II=2, III=3). Legacy-Items ohne `afb`-Spalte nutzen den
// gleichen numerischen Schwierigkeitsbegriff. `reachedAfb` in der Summary
// leitet sich aus `estimatedLevel` ab.

import type { ScreeningAfb, ScreeningItem, ScreeningLevel } from '@/types'
import { gradeScreeningAnswer } from './grade'

export const RECOMMENDED_BUDGET_MS = 20 * 60 * 1000

export type AdaptiveConfig = {
  // Themen, die das Erstgespräch hart ausschließt (Items mit topic ∈ → raus).
  excludedTopics?: string[]
  // Schwächen/Ziele aus dem Erstgespräch → Cluster werden vorgezogen und
  // tiefer (höhere Fragenkappe) geprüft.
  weightedTopics?: string[]
  // Schwerpunkte aus Klassenarbeit/Coach (student_focus_areas) — auf
  // Cluster-Id-Ebene. Wirkt zusätzlich zu weightedTopics.
  weightedClusterIds?: string[]
  budgetMs?: number
  // Injizierbar für deterministische Tests; default Math.random.
  rng?: () => number
}

export type AdaptiveAnswerLog = {
  itemId: string
  clusterId: string
  level: ScreeningLevel
  // null = manuelles Coach-Rating ausstehend (z. B. OPEN ohne Match in
  // akzeptierte_antworten). Beeinflusst die Treppe nicht — wir bleiben
  // auf der aktuellen Stufe, statt blind hoch/runter zu gehen.
  correct: boolean | null
  durationMs: number
}

export type ClusterSummary = {
  clusterId: string
  answered: number
  correct: number
  // null = scheitert schon an AFB I (oder kein Treffer dort);
  // 'I'/'II'/'III' = höchste sicher gelöste Stufe.
  reachedAfb: ScreeningAfb | null
  // 0 = scheitert schon an L1; 1–3 = höchste sicher gelöste Stufe (numerisch).
  estimatedLevel: 0 | ScreeningLevel
  mastery: number // 0..1 (correct / answered, ignoriert pending)
  // Items, die auf Coach-Rating warten (correct === null).
  pending: number
  // Statistische Belastbarkeit der Cluster-Aussage. Heuristik, keine IRT.
  confidence: 'low' | 'medium' | 'high'
}

export function levelToAfb(l: 0 | ScreeningLevel): ScreeningAfb | null {
  return l === 1 ? 'I' : l === 2 ? 'II' : l === 3 ? 'III' : null
}

type ClusterState = {
  clusterId: string
  weighted: boolean
  level: ScreeningLevel
  asked: Set<string>
  log: AdaptiveAnswerLog[]
  focusDone: boolean
}

export type AdaptiveSession = {
  phase: 'warmup' | 'focus' | 'done'
  pool: ScreeningItem[]
  clusterOrder: string[]
  warmupQueue: string[]
  focusOrder: string[]
  focusIndex: number
  clusters: Map<string, ClusterState>
  current: ScreeningItem | null
  spentMs: number
  budgetMs: number
  rng: () => number
}

function clampLevel(n: number): ScreeningLevel {
  if (n <= 1) return 1
  if (n >= 3) return 3
  return 2
}

function pick(items: ScreeningItem[], rng: () => number): ScreeningItem | null {
  if (items.length === 0) return null
  const sorted = [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const idx = Math.min(sorted.length - 1, Math.floor(rng() * sorted.length))
  return sorted[idx] ?? null
}

// Erstellt eine Sitzung aus dem (aktiven) Item-Pool + Intake-Konfig.
export function createAdaptiveSession(
  pool: ScreeningItem[],
  config: AdaptiveConfig = {},
): AdaptiveSession {
  const excluded = new Set(config.excludedTopics ?? [])
  const weighted = new Set(config.weightedTopics ?? [])
  const weightedClusters = new Set(config.weightedClusterIds ?? [])
  const rng = config.rng ?? Math.random

  const usable = pool.filter((it) => it.active && !excluded.has(it.topic))

  const clusterOrder: string[] = []
  const clusters = new Map<string, ClusterState>()
  for (const it of usable) {
    if (!clusters.has(it.cluster_id)) {
      clusterOrder.push(it.cluster_id)
      clusters.set(it.cluster_id, {
        clusterId: it.cluster_id,
        weighted: weightedClusters.has(it.cluster_id),
        // Focus startet auf AFB I — Schüler bauen sich von unten hoch.
        level: 1,
        asked: new Set(),
        log: [],
        focusDone: false,
      })
    }
    if (weighted.has(it.topic)) {
      const cs = clusters.get(it.cluster_id)
      if (cs) cs.weighted = true
    }
  }

  // Fokus-Reihenfolge: gewichtete Cluster zuerst, sonst stabile Reihenfolge.
  const focusOrder = [...clusterOrder].sort((a, b) => {
    const wa = clusters.get(a)?.weighted ? 0 : 1
    const wb = clusters.get(b)?.weighted ? 0 : 1
    return wa - wb
  })

  return {
    phase: clusterOrder.length === 0 ? 'done' : 'warmup',
    pool: usable,
    clusterOrder,
    warmupQueue: [...clusterOrder],
    focusOrder,
    focusIndex: 0,
    clusters,
    current: null,
    spentMs: 0,
    budgetMs: config.budgetMs ?? RECOMMENDED_BUDGET_MS,
    rng,
  }
}

function clusterItems(
  s: AdaptiveSession,
  clusterId: string,
  level: ScreeningLevel,
): ScreeningItem[] {
  const cs = s.clusters.get(clusterId)
  if (!cs) return []
  return s.pool.filter(
    (it) => it.cluster_id === clusterId && it.level === level && !cs.asked.has(it.id),
  )
}

// Wählt ein Item bevorzugt auf der Zielstufe, sonst nächstgelegene Stufe.
function pickNearLevel(
  s: AdaptiveSession,
  clusterId: string,
  level: ScreeningLevel,
): ScreeningItem | null {
  const order: ScreeningLevel[] =
    level === 1 ? [1, 2, 3] : level === 3 ? [3, 2, 1] : [2, 1, 3]
  for (const lvl of order) {
    const chosen = pick(clusterItems(s, clusterId, lvl), s.rng)
    if (chosen) return chosen
  }
  return null
}

// Mindestanzahl korrekter Items pro Level, damit das Level als "bestätigt"
// gilt. AFB III braucht 2 Treffer (Lucky-Guess-Schutz bei 4-Optionen-MC).
function requiredHits(level: ScreeningLevel): number {
  return level === 3 ? 2 : 1
}

function correctOnLevel(log: AdaptiveAnswerLog[], level: ScreeningLevel): number {
  return log.filter((e) => e.level === level && e.correct === true).length
}

function focusCap(cs: ClusterState): number {
  const base = cs.weighted ? 5 : 3
  // Wenn die Treppe schon auf AFB III ist und die Bestätigung (2× richtig)
  // noch fehlt, ein Extra-Item zulassen — sonst stoppt converged() zu früh
  // und wir verschenken den entscheidenden Treffer.
  const needsConfirm =
    cs.level === 3 && correctOnLevel(cs.log, 3) < requiredHits(3)
  return base + (needsConfirm ? 1 : 0)
}

function converged(cs: ClusterState): boolean {
  const n = cs.log.length
  if (n < 2) return false
  const a = cs.log[n - 1]
  const b = cs.log[n - 2]
  // Nur „2× falsch in Folge auf gleicher Stufe" beendet den Fokus früh.
  // 2× richtig in Folge lassen wir bewusst stehen — die Treppe soll weiter
  // steigen, bis Cap oder AFB-III-Bestätigung erreicht ist.
  return (
    a.level === b.level && a.correct === false && b.correct === false
  )
}

function finalizeCluster(cs: ClusterState): void {
  cs.focusDone = true
}

// Liefert das nächste zu zeigende Item oder null (Test fertig). Idempotent:
// solange nicht geantwortet wurde, kommt dasselbe Item zurück.
export function nextItem(s: AdaptiveSession): ScreeningItem | null {
  if (s.current) return s.current
  if (s.phase === 'done') return null
  if (s.spentMs >= s.budgetMs) {
    s.phase = 'done'
    return null
  }

  if (s.phase === 'warmup') {
    while (s.warmupQueue.length > 0) {
      const clusterId = s.warmupQueue[0]
      const item = pickNearLevel(s, clusterId, 1)
      s.warmupQueue.shift()
      if (item) {
        s.current = item
        return item
      }
    }
    s.phase = 'focus'
  }

  while (s.focusIndex < s.focusOrder.length) {
    const clusterId = s.focusOrder[s.focusIndex]
    const cs = s.clusters.get(clusterId)
    if (!cs || cs.focusDone) {
      s.focusIndex += 1
      continue
    }
    const item = pickNearLevel(s, clusterId, cs.level)
    if (!item) {
      finalizeCluster(cs)
      s.focusIndex += 1
      continue
    }
    s.current = item
    return item
  }

  s.phase = 'done'
  return null
}

// Verarbeitet die Antwort auf das aktuelle Item: intern bewerten, Treppe
// nachführen, Stopp-Kriterien prüfen. Gibt das Log-Objekt zur Persistenz
// zurück (P5). Wirft nicht; ohne aktuelles Item passiert nichts.
export function submitAnswer(
  s: AdaptiveSession,
  answer: unknown,
  durationMs = 0,
): AdaptiveAnswerLog | null {
  const item = s.current
  if (!item) return null
  const cs = s.clusters.get(item.cluster_id)
  if (!cs) {
    s.current = null
    return null
  }

  const correct = gradeScreeningAnswer({
    check_type: item.check_type,
    canonical: item.canonical,
    answer,
    tolerance: item.tolerance,
    accepted: item.akzeptierte_antworten ?? null,
  })

  cs.asked.add(item.id)
  s.spentMs += Math.max(0, durationMs)
  s.current = null

  const entry: AdaptiveAnswerLog = {
    itemId: item.id,
    clusterId: cs.clusterId,
    level: item.level,
    correct,
    durationMs: Math.max(0, durationMs),
  }

  if (s.phase === 'focus') {
    cs.log.push(entry)
    // Bei null (manuell offen) Stufe nicht verändern — sonst wandern wir
    // ohne Signal weiter und entwerten die Treppe.
    if (correct === true) cs.level = clampLevel(cs.level + 1)
    else if (correct === false) cs.level = clampLevel(cs.level - 1)
    if (cs.log.length >= focusCap(cs) || converged(cs)) {
      finalizeCluster(cs)
    }
  } else {
    // Warm-up zählt für die Auswertung mit und setzt den Focus-Startpunkt:
    // korrektes L1-Warm-up → Focus startet auf L2, sonst auf L1.
    cs.log.push(entry)
    cs.level = correct === true ? 2 : 1
  }

  return entry
}

function masteryOnLevel(log: AdaptiveAnswerLog[], level: ScreeningLevel): number {
  const onLevel = log.filter((e) => e.level === level && e.correct !== null)
  if (onLevel.length === 0) return 0
  return onLevel.filter((e) => e.correct === true).length / onLevel.length
}

function estimateLevel(log: AdaptiveAnswerLog[]): 0 | ScreeningLevel {
  // Höchstes Level, auf dem genug richtige Antworten vorliegen (AFB III: 2,
  // sonst 1). Verhindert Lucky-Guess-Aufstufung auf III.
  let best: 0 | ScreeningLevel = 0
  for (const lvl of [1, 2, 3] as ScreeningLevel[]) {
    if (correctOnLevel(log, lvl) >= requiredHits(lvl)) best = lvl
  }
  // Downgrade-Regel: Wenn die Mastery auf dem ermittelten Level < 50 %, ist
  // der Schüler dort noch wackelig — eine Stufe runter.
  if (best > 0 && masteryOnLevel(log, best) < 0.5) {
    best = (best - 1) as 0 | ScreeningLevel
  }
  return best
}

function confidenceFor(
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

// Cluster-Auswertung für Report/Coach (Eingabe für P5 result_summary).
export function summarize(s: AdaptiveSession): ClusterSummary[] {
  return s.clusterOrder.map((clusterId) => {
    const cs = s.clusters.get(clusterId)
    const log = cs?.log ?? []
    const answered = log.length
    const correct = log.filter((e) => e.correct === true).length
    const pending = log.filter((e) => e.correct === null).length
    const decided = answered - pending
    const estimatedLevel = estimateLevel(log)
    return {
      clusterId,
      answered,
      correct,
      reachedAfb: levelToAfb(estimatedLevel),
      estimatedLevel,
      mastery: decided === 0 ? 0 : correct / decided,
      pending,
      confidence: confidenceFor(answered, pending, estimatedLevel, log),
    }
  })
}

export function isComplete(s: AdaptiveSession): boolean {
  return s.phase === 'done' || nextItem(s) === null
}
