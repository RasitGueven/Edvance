import { useCallback, useMemo, useRef } from 'react'
import type { BehaviorSnapshot } from '@/types/diagnosis'

type TrackerState = {
  taskStartTs: number | null
  firstKeystrokeTs: number | null
  lastKeystrokeTs: number | null
  hintRequestTs: number | null
  revisionCount: number
  rewriteCount: number
  prevAnswerLength: number
}

const initial = (): TrackerState => ({
  taskStartTs: null,
  firstKeystrokeTs: null,
  lastKeystrokeTs: null,
  hintRequestTs: null,
  revisionCount: 0,
  rewriteCount: 0,
  prevAnswerLength: 0,
})

const REWRITE_DELETE_THRESHOLD = 5

export function useBehaviorTracker() {
  const stateRef = useRef<TrackerState>(initial())

  const startTracking = useCallback(() => {
    stateRef.current = initial()
    stateRef.current.taskStartTs = Date.now()
  }, [])

  const onFirstKeystroke = useCallback(() => {
    const s = stateRef.current
    if (s.firstKeystrokeTs == null && s.taskStartTs != null) {
      s.firstKeystrokeTs = Date.now()
    }
    s.lastKeystrokeTs = Date.now()
  }, [])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const s = stateRef.current
    s.lastKeystrokeTs = Date.now()
    if (event.key === 'Backspace' || event.key === 'Delete') {
      s.revisionCount += 1
    }
  }, [])

  const onChange = useCallback((newValue: string) => {
    const s = stateRef.current
    const prev = s.prevAnswerLength
    const curr = newValue.length
    if (prev - curr >= REWRITE_DELETE_THRESHOLD) {
      s.rewriteCount += 1
    }
    s.prevAnswerLength = curr
    if (s.firstKeystrokeTs == null && curr > 0 && s.taskStartTs != null) {
      s.firstKeystrokeTs = Date.now()
    }
    if (curr > 0) s.lastKeystrokeTs = Date.now()
  }, [])

  const onHintRequested = useCallback(() => {
    const s = stateRef.current
    if (s.hintRequestTs == null && s.taskStartTs != null) {
      s.hintRequestTs = Date.now()
    }
  }, [])

  const onLastKeystroke = useCallback(() => {
    stateRef.current.lastKeystrokeTs = Date.now()
  }, [])

  const getSnapshot = useCallback(
    (task_id: string, answer_text: string): Omit<BehaviorSnapshot, 'coach_rating'> => {
      const s = stateRef.current
      const now = Date.now()
      const start = s.taskStartTs ?? now
      const first = s.firstKeystrokeTs
      const last = s.lastKeystrokeTs ?? now
      const hint = s.hintRequestTs

      return {
        task_id,
        thinking_time_ms: first != null ? first - start : now - start,
        task_duration_ms: now - start,
        revision_count: s.revisionCount,
        rewrite_count: s.rewriteCount,
        hint_used: hint != null,
        hint_request_time_ms: hint != null ? hint - start : null,
        answer_length: answer_text.length,
        time_after_completion_ms: Math.max(0, now - last),
        answer_text,
      }
    },
    [],
  )

  return useMemo(
    () => ({
      startTracking,
      onFirstKeystroke,
      onKeyDown,
      onChange,
      onHintRequested,
      onLastKeystroke,
      getSnapshot,
    }),
    [startTracking, onFirstKeystroke, onKeyDown, onChange, onHintRequested, onLastKeystroke, getSnapshot],
  )
}
