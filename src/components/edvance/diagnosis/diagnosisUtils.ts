import type { BehaviorAnalysis } from '@/types/diagnosis'

export const SIGNAL_LABELS: Record<
  BehaviorAnalysis['mastery_signal'],
  { label: string; color: string; emoji: string }
> = {
  secure: { label: 'Sicher', color: 'var(--success)', emoji: '✓' },
  developing: { label: 'In Entwicklung', color: 'var(--primary)', emoji: '↗' },
  gap: { label: 'Lücke', color: 'var(--destructive)', emoji: '✗' },
  guessing: { label: 'Geraten', color: 'var(--warning)', emoji: '?' },
}

// Mapping: Diagnose-Mock-Cluster (M8.* taxonomy) → KMK-Kompetenzbereich
// (Schema seit Migration 001). Bei Klick auf einen Fokus-Cluster im
// Lernplan-Block wird ueber diesen Namen das echte Cluster in Supabase
// gefunden und zur ClusterView navigiert.
export const DIAGNOSIS_TO_COMPETENCY: Record<string, string> = {
  'Rationale Zahlen': 'Zahl & Rechnen',
  'Terme & Gleichungen': 'Algebra & Funktionen',
  'Proportionalität': 'Sachrechnen & Modellieren',
  'Prozentrechnung': 'Zahl & Rechnen',
  'Lineare Funktionen': 'Algebra & Funktionen',
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDuration(ms: number) {
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min === 0) return `${sec}s`
  return `${min}m ${sec}s`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
