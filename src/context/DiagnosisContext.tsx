import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { BehaviorSnapshot } from '@/types/diagnosis'
import { mockDiagnosisTasks } from '@/lib/diagnosisMockData'

const STORAGE_KEY = 'edvance_diagnosis_state_v1'

export type DiagnosisState = {
  studentName: string
  subject: string
  date: string
  currentIndex: number
  // pro Task: wartet das System auf Coach-Bewertung?
  awaitingCoachRating: boolean
  // Array indexed by task position
  snapshots: BehaviorSnapshot[]
  coachNote: string
  finished: boolean
  startedAt: string | null
}

type DiagnosisContextValue = {
  state: DiagnosisState
  // Student-Aktionen
  submitAnswer: (snapshot: Omit<BehaviorSnapshot, 'coach_rating'>) => void
  // Coach-Aktionen
  setCoachRating: (rating: 1 | 2 | 3 | 4) => void
  setCoachNote: (note: string) => void
  // Setup
  startSession: (studentName: string, subject: string) => void
  resetSession: () => void
}

const initialState: DiagnosisState = {
  studentName: 'Schüler',
  subject: 'Mathematik',
  date: new Date().toISOString(),
  currentIndex: 0,
  awaitingCoachRating: false,
  snapshots: [],
  coachNote: '',
  finished: false,
  startedAt: null,
}

function loadFromStorage(): DiagnosisState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DiagnosisState
  } catch {
    return null
  }
}

function saveToStorage(state: DiagnosisState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / disabled */
  }
}

const DiagnosisContext = createContext<DiagnosisContextValue | undefined>(undefined)

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DiagnosisState>(() => loadFromStorage() ?? initialState)

  // Cross-Tab-Sync: lausche auf storage-Events von anderen Tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        setState(JSON.parse(e.newValue) as DiagnosisState)
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // Persistiere bei jedem Update
  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const submitAnswer: DiagnosisContextValue['submitAnswer'] = snapshotPartial => {
    setState(prev => {
      if (prev.finished || prev.awaitingCoachRating) return prev
      const fullSnapshot: BehaviorSnapshot = { ...snapshotPartial, coach_rating: null }
      const next = [...prev.snapshots]
      next[prev.currentIndex] = fullSnapshot
      return { ...prev, snapshots: next, awaitingCoachRating: true }
    })
  }

  const setCoachRating: DiagnosisContextValue['setCoachRating'] = rating => {
    setState(prev => {
      if (!prev.awaitingCoachRating) return prev
      const idx = prev.currentIndex
      const updated = [...prev.snapshots]
      const cur = updated[idx]
      if (!cur) return prev
      updated[idx] = { ...cur, coach_rating: rating }

      const isLast = idx >= mockDiagnosisTasks.length - 1
      return {
        ...prev,
        snapshots: updated,
        awaitingCoachRating: false,
        currentIndex: isLast ? idx : idx + 1,
        finished: isLast,
      }
    })
  }

  const setCoachNote: DiagnosisContextValue['setCoachNote'] = note =>
    setState(prev => ({ ...prev, coachNote: note }))

  const startSession: DiagnosisContextValue['startSession'] = (studentName, subject) =>
    setState({
      ...initialState,
      studentName,
      subject,
      date: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    })

  const resetSession = () => setState(initialState)

  return (
    <DiagnosisContext.Provider
      value={{ state, submitAnswer, setCoachRating, setCoachNote, startSession, resetSession }}
    >
      {children}
    </DiagnosisContext.Provider>
  )
}

export function useDiagnosis() {
  const ctx = useContext(DiagnosisContext)
  if (!ctx) throw new Error('useDiagnosis must be used within DiagnosisProvider')
  return ctx
}
