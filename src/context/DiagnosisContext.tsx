import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { BehaviorSnapshot } from '@/types/diagnosis'
import type { RunTask } from '@/types'

const STORAGE_KEY = 'edvance_diagnosis_state_v1'

export type DiagnosisMode = 'local' | 'db'

export type DiagnosisState = {
  studentName: string
  subject: string
  date: string
  currentIndex: number
  awaitingCoachRating: boolean
  snapshots: BehaviorSnapshot[]
  tasks: RunTask[]
  coachNote: string
  finished: boolean
  startedAt: string | null
  // U5c: DB-Modus (Screening) – persistierter Lauf statt localStorage
  mode: DiagnosisMode
  screeningTestId: string | null
  // pro Task-Index die behavior_snapshots.id (fuer screening_ratings)
  snapshotIds: (string | null)[]
}

type StartArgs = {
  studentName: string
  subject: string
  tasks: RunTask[]
}

type DiagnosisContextValue = {
  state: DiagnosisState
  submitAnswer: (snapshot: Omit<BehaviorSnapshot, 'coach_rating'>) => void
  setCoachRating: (rating: 1 | 2 | 3 | 4) => void
  setCoachNote: (note: string) => void
  startSession: (args: StartArgs) => void
  // U5c: DB-gestuetzter Screening-Lauf
  startScreening: (args: StartArgs & { screeningTestId: string }) => void
  recordSnapshotId: (index: number, id: string) => void
  hydrate: (next: DiagnosisState) => void
  resetSession: () => void
}

const initialState: DiagnosisState = {
  studentName: 'Schüler',
  subject: 'Mathematik',
  date: new Date().toISOString(),
  currentIndex: 0,
  awaitingCoachRating: false,
  snapshots: [],
  tasks: [],
  coachNote: '',
  finished: false,
  startedAt: null,
  mode: 'local',
  screeningTestId: null,
  snapshotIds: [],
}

function loadFromStorage(): DiagnosisState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DiagnosisState>
    return {
      ...initialState,
      ...parsed,
      tasks: parsed.tasks ?? [],
      mode: 'local',
      snapshotIds: parsed.snapshotIds ?? [],
    }
  } catch {
    return null
  }
}

function saveToStorage(state: DiagnosisState) {
  // DB-Modus (Screening) wird in Supabase persistiert, NICHT in localStorage.
  if (state.mode === 'db') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / disabled */
  }
}

const DiagnosisContext = createContext<DiagnosisContextValue | undefined>(undefined)

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DiagnosisState>(() => loadFromStorage() ?? initialState)

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        const next = JSON.parse(e.newValue) as DiagnosisState
        // Cross-Tab nur fuer lokale Sessions; DB-Laeufe nicht ueberschreiben
        setState(prev => (prev.mode === 'db' ? prev : next))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

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
      const isLast = idx >= prev.tasks.length - 1
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

  const startSession: DiagnosisContextValue['startSession'] = ({
    studentName,
    subject,
    tasks,
  }) =>
    setState({
      ...initialState,
      studentName,
      subject,
      tasks,
      date: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      mode: 'local',
    })

  const startScreening: DiagnosisContextValue['startScreening'] = ({
    studentName,
    subject,
    tasks,
    screeningTestId,
  }) =>
    setState({
      ...initialState,
      studentName,
      subject,
      tasks,
      date: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      mode: 'db',
      screeningTestId,
      snapshotIds: [],
    })

  const recordSnapshotId: DiagnosisContextValue['recordSnapshotId'] = (index, id) =>
    setState(prev => {
      const ids = [...prev.snapshotIds]
      ids[index] = id
      return { ...prev, snapshotIds: ids }
    })

  const hydrate: DiagnosisContextValue['hydrate'] = next => setState(next)

  const resetSession = () => setState({ ...initialState })

  return (
    <DiagnosisContext.Provider
      value={{
        state,
        submitAnswer,
        setCoachRating,
        setCoachNote,
        startSession,
        startScreening,
        recordSnapshotId,
        hydrate,
        resetSession,
      }}
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
