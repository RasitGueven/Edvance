// Reine Aggregations-Funktionen für die Coach-Auswertung. Input: persistierte
// screening_item_results, Output: KPIs (Auto-Grade-Quote, Median-Dauer,
// Pending-Anzahl). Keine Supabase-Calls hier — Daten kommen vom Caller.

import type { ScreeningItemResult } from '@/types'

export type ScreeningKpis = {
  total: number
  autoGraded: number
  manualPending: number
  autoGradeRatePct: number // 0..100 (auto / decided), 0 bei keine Entscheidungen
  medianDurationMs: number
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}

export function computeKpis(results: ScreeningItemResult[]): ScreeningKpis {
  const total = results.length
  let autoGraded = 0
  let manualPending = 0
  const durations: number[] = []
  for (const r of results) {
    if (r.correct === null) manualPending += 1
    else autoGraded += 1
    if (typeof r.duration_ms === 'number' && r.duration_ms > 0) {
      durations.push(r.duration_ms)
    }
  }
  const decided = autoGraded // pending zählt nicht in den Nenner
  return {
    total,
    autoGraded,
    manualPending,
    autoGradeRatePct:
      total === 0 ? 0 : Math.round((decided / total) * 100),
    medianDurationMs: median(durations),
  }
}

export function computeMedianByCluster(
  results: ScreeningItemResult[],
): Map<string, number> {
  const buckets = new Map<string, number[]>()
  for (const r of results) {
    if (typeof r.duration_ms !== 'number' || r.duration_ms <= 0) continue
    const arr = buckets.get(r.cluster_id) ?? []
    arr.push(r.duration_ms)
    buckets.set(r.cluster_id, arr)
  }
  const out = new Map<string, number>()
  for (const [cid, arr] of buckets) {
    out.set(cid, median(arr))
  }
  return out
}

export function computePendingByCluster(
  results: ScreeningItemResult[],
): Map<string, number> {
  const out = new Map<string, number>()
  for (const r of results) {
    if (r.correct === null) {
      out.set(r.cluster_id, (out.get(r.cluster_id) ?? 0) + 1)
    }
  }
  return out
}

export function formatMedianSeconds(ms: number): string {
  if (ms <= 0) return '–'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s === 0 ? `${m}min` : `${m}min ${s}s`
}
