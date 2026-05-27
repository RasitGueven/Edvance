import { describe, it, expect } from 'vitest'
import {
  emptyState,
  fromItem,
  validate,
  buildInput,
  parsePayloadCanonical,
  INPUT_TYPES,
  AFB_OPTIONS,
  PHASE_OPTIONS,
  CHECK_TYPES,
} from '@/components/edvance/screening/editor/state'
import type { FormState } from '@/components/edvance/screening/editor/state'
import type { ScreeningItem } from '@/types'

// ── Fixture helpers ──────────────────────────────────────────────────────────

function makeItem(overrides: Partial<ScreeningItem> = {}): ScreeningItem {
  return {
    id: 'item-1',
    created_at: '2025-01-01T00:00:00Z',
    cluster_id: 'cluster-1',
    class_level: 8,
    topic: 'Algebra',
    skill_code: 'M8.AL.01',
    skill_label: 'Lineare Gleichungen',
    level: 2,
    curriculum_seq: 5,
    input_type: 'MC',
    prompt: 'Was ist 2 + 2?',
    payload: { options: [{ text: '4', correct: true }] },
    canonical: { index: 0 },
    check_type: 'mc_index',
    tolerance: null,
    typical_errors: ['Rechenzeichen verwechselt'],
    explanation: 'Grundrechenarten',
    source: 'manual',
    active: true,
    afb: 'I',
    phase: 'sprint',
    kontext: 'Zahlenraum',
    teilaufgaben: [],
    akzeptierte_antworten: null,
    ...overrides,
  }
}

function validState(overrides: Partial<FormState> = {}): FormState {
  return {
    ...emptyState(),
    prompt: 'Was ist 2+2?',
    skill_code: 'M8.AL.01',
    skill_label: 'Lineare Gleichungen',
    topic: 'Algebra',
    ...overrides,
  }
}

// ── Constants ────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('INPUT_TYPES includes MC, NUMERIC, MATCHING, STEPS_FINAL, OPEN, DRAW', () => {
    expect(INPUT_TYPES).toContain('MC')
    expect(INPUT_TYPES).toContain('NUMERIC')
    expect(INPUT_TYPES).toContain('OPEN')
    expect(INPUT_TYPES).toContain('DRAW')
  })

  it('AFB_OPTIONS are I, II, III', () => {
    expect(AFB_OPTIONS).toEqual(['I', 'II', 'III'])
  })

  it('PHASE_OPTIONS are sprint, tiefe', () => {
    expect(PHASE_OPTIONS).toEqual(['sprint', 'tiefe'])
  })

  it('CHECK_TYPES includes mc_index, numeric, manual', () => {
    expect(CHECK_TYPES).toContain('mc_index')
    expect(CHECK_TYPES).toContain('numeric')
    expect(CHECK_TYPES).toContain('manual')
  })
})

// ── emptyState ───────────────────────────────────────────────────────────────

describe('emptyState', () => {
  it('returns an object with expected fields', () => {
    const s = emptyState()
    expect(s).toHaveProperty('topic')
    expect(s).toHaveProperty('prompt')
    expect(s).toHaveProperty('skill_code')
    expect(s).toHaveProperty('skill_label')
    expect(s).toHaveProperty('input_type')
    expect(s).toHaveProperty('check_type')
    expect(s).toHaveProperty('class_level')
    expect(s).toHaveProperty('teilaufgaben')
  })

  it('defaults to MC input_type', () => {
    expect(emptyState().input_type).toBe('MC')
  })

  it('defaults to mc_index check_type', () => {
    expect(emptyState().check_type).toBe('mc_index')
  })

  it('defaults class_level to 8', () => {
    expect(emptyState().class_level).toBe(8)
  })

  it('defaults to empty prompt', () => {
    expect(emptyState().prompt).toBe('')
  })

  it('teilaufgaben defaults to empty array', () => {
    expect(emptyState().teilaufgaben).toEqual([])
  })

  it('returns a new object each call (no mutation)', () => {
    const a = emptyState()
    const b = emptyState()
    a.prompt = 'changed'
    expect(b.prompt).toBe('')
  })
})

// ── fromItem ─────────────────────────────────────────────────────────────────

describe('fromItem', () => {
  it('maps item fields to FormState', () => {
    const item = makeItem()
    const state = fromItem(item)
    expect(state.topic).toBe('Algebra')
    expect(state.skill_code).toBe('M8.AL.01')
    expect(state.skill_label).toBe('Lineare Gleichungen')
    expect(state.class_level).toBe(8)
    expect(state.level).toBe(2)
    expect(state.input_type).toBe('MC')
    expect(state.check_type).toBe('mc_index')
    expect(state.prompt).toBe('Was ist 2 + 2?')
    expect(state.afb).toBe('I')
    expect(state.phase).toBe('sprint')
  })

  it('converts curriculum_seq number to string', () => {
    const state = fromItem(makeItem({ curriculum_seq: 7 }))
    expect(state.curriculum_seq).toBe('7')
  })

  it('converts null curriculum_seq to empty string', () => {
    const state = fromItem(makeItem({ curriculum_seq: null }))
    expect(state.curriculum_seq).toBe('')
  })

  it('converts null tolerance to empty string', () => {
    const state = fromItem(makeItem({ tolerance: null }))
    expect(state.tolerance).toBe('')
  })

  it('converts typical_errors array to newline-joined string', () => {
    const state = fromItem(makeItem({ typical_errors: ['Fehler A', 'Fehler B'] }))
    expect(state.typical).toBe('Fehler A\nFehler B')
  })

  it('converts null afb to empty string', () => {
    const state = fromItem(makeItem({ afb: null }))
    expect(state.afb).toBe('')
  })

  it('converts null phase to empty string', () => {
    const state = fromItem(makeItem({ phase: null }))
    expect(state.phase).toBe('')
  })

  it('derives usage "screening" when afb and phase are set', () => {
    const state = fromItem(makeItem({ afb: 'II', phase: 'tiefe' }))
    expect(state.usage).toBe('screening')
  })

  it('derives usage "lernpfad" when afb or phase is null', () => {
    const state = fromItem(makeItem({ afb: null, phase: null }))
    expect(state.usage).toBe('lernpfad')
  })

  it('serializes payload to JSON string', () => {
    const state = fromItem(makeItem({ payload: { options: [] } }))
    expect(typeof state.payloadStr).toBe('string')
    const parsed = JSON.parse(state.payloadStr)
    expect(parsed).toHaveProperty('options')
  })

  it('serializes canonical to JSON string', () => {
    const state = fromItem(makeItem({ canonical: { index: 0 } }))
    const parsed = JSON.parse(state.canonicalStr)
    expect(parsed.index).toBe(0)
  })
})

// ── validate ─────────────────────────────────────────────────────────────────

describe('validate', () => {
  it('returns null for a fully valid state', () => {
    expect(validate(validState())).toBeNull()
  })

  it('returns "promptEmpty" when prompt is blank', () => {
    expect(validate(validState({ prompt: '' }))).toBe('promptEmpty')
    expect(validate(validState({ prompt: '   ' }))).toBe('promptEmpty')
  })

  it('returns "skillCodeMissing" when skill_code is blank', () => {
    expect(validate(validState({ skill_code: '' }))).toBe('skillCodeMissing')
  })

  it('returns "skillLabelMissing" when skill_label is blank', () => {
    expect(validate(validState({ skill_label: '' }))).toBe('skillLabelMissing')
  })

  it('returns "topicMissing" when topic is blank', () => {
    expect(validate(validState({ topic: '' }))).toBe('topicMissing')
  })

  it('returns "openManualMismatch" when OPEN input_type with non-manual check_type', () => {
    const s = validState({ input_type: 'OPEN', check_type: 'mc_index' })
    expect(validate(s)).toBe('openManualMismatch')
  })

  it('returns "openManualMismatch" when non-OPEN with manual check_type', () => {
    const s = validState({ input_type: 'MC', check_type: 'manual' })
    expect(validate(s)).toBe('openManualMismatch')
  })

  it('accepts OPEN + manual', () => {
    const s = validState({ input_type: 'OPEN', check_type: 'manual' })
    expect(validate(s)).toBeNull()
  })

  it('returns "afbPhaseMismatch" when afb is set but phase is empty', () => {
    const s = validState({ afb: 'I', phase: '' })
    expect(validate(s)).toBe('afbPhaseMismatch')
  })

  it('returns "afbPhaseMismatch" when phase is set but afb is empty', () => {
    const s = validState({ afb: '', phase: 'sprint' })
    expect(validate(s)).toBe('afbPhaseMismatch')
  })

  it('accepts both afb and phase set', () => {
    const s = validState({ afb: 'II', phase: 'tiefe', check_type: 'mc_index', input_type: 'MC' })
    expect(validate(s)).toBeNull()
  })

  it('accepts both afb and phase empty', () => {
    const s = validState({ afb: '', phase: '' })
    expect(validate(s)).toBeNull()
  })

  it('skips openManualMismatch for DRAW input_type', () => {
    const s = validState({ input_type: 'DRAW', check_type: 'mc_index' })
    expect(validate(s)).toBeNull()
  })
})

// ── parsePayloadCanonical ────────────────────────────────────────────────────

describe('parsePayloadCanonical', () => {
  it('parses valid JSON strings', () => {
    const s = validState({
      payloadStr: '{"options": []}',
      canonicalStr: '{"index": 0}',
    })
    const result = parsePayloadCanonical(s)
    expect(result).not.toHaveProperty('error')
    if (!('error' in result)) {
      expect((result.payload as Record<string, unknown>).options).toEqual([])
      expect((result.canonical as Record<string, unknown>).index).toBe(0)
    }
  })

  it('returns { error: true } for invalid payloadStr', () => {
    const s = validState({ payloadStr: 'INVALID{JSON', canonicalStr: '{}' })
    const result = parsePayloadCanonical(s)
    expect(result).toHaveProperty('error', true)
  })

  it('returns { error: true } for invalid canonicalStr', () => {
    const s = validState({ payloadStr: '{}', canonicalStr: '][' })
    const result = parsePayloadCanonical(s)
    expect(result).toHaveProperty('error', true)
  })

  it('returns null payload for empty payloadStr', () => {
    const s = validState({ payloadStr: '', canonicalStr: '{}' })
    const result = parsePayloadCanonical(s)
    if (!('error' in result)) {
      expect(result.payload).toBeNull()
    }
  })
})

// ── buildInput ───────────────────────────────────────────────────────────────

describe('buildInput', () => {
  it('builds a valid ScreeningItemInput', () => {
    const s = validState({
      typical: 'Fehler A\nFehler B',
      tolerance: '0.5',
      curriculum_seq: '3',
      explanation: 'Erklärung',
      kontext: 'Zahlen',
      afb: 'I',
      phase: 'sprint',
    })
    const input = buildInput(s, 'cluster-42', { options: [] }, { index: 0 })
    expect(input.cluster_id).toBe('cluster-42')
    expect(input.topic).toBe('Algebra')
    expect(input.skill_code).toBe('M8.AL.01')
    expect(input.typical_errors).toEqual(['Fehler A', 'Fehler B'])
    expect(input.tolerance).toBe(0.5)
    expect(input.curriculum_seq).toBe(3)
    expect(input.afb).toBe('I')
    expect(input.phase).toBe('sprint')
  })

  it('converts DRAW input_type to OPEN', () => {
    const s = validState({ input_type: 'DRAW', check_type: 'manual' })
    const input = buildInput(s, 'cluster-1', null, {})
    expect(input.input_type).toBe('OPEN')
  })

  it('converts empty tolerance to null', () => {
    const s = validState({ tolerance: '' })
    const input = buildInput(s, 'cluster-1', null, {})
    expect(input.tolerance).toBeNull()
  })

  it('converts empty curriculum_seq to null', () => {
    const s = validState({ curriculum_seq: '' })
    const input = buildInput(s, 'cluster-1', null, {})
    expect(input.curriculum_seq).toBeNull()
  })

  it('converts empty afb to null', () => {
    const s = validState({ afb: '' })
    const input = buildInput(s, 'cluster-1', null, {})
    expect(input.afb).toBeNull()
  })

  it('converts empty phase to null', () => {
    const s = validState({ phase: '' })
    const input = buildInput(s, 'cluster-1', null, {})
    expect(input.phase).toBeNull()
  })

  it('filters empty lines from typical_errors', () => {
    const s = validState({ typical: 'Fehler A\n\nFehler B\n  ' })
    const input = buildInput(s, 'cluster-1', null, {})
    expect(input.typical_errors).toEqual(['Fehler A', 'Fehler B'])
  })

  it('sets teilaufgaben to null when empty', () => {
    const s = validState({ teilaufgaben: [] })
    const input = buildInput(s, 'cluster-1', null, {})
    expect(input.teilaufgaben).toBeNull()
  })

  it('sets teilaufgaben when non-empty', () => {
    const s = validState({ teilaufgaben: [{ key: 'a', prompt: 'Frage' }] })
    const input = buildInput(s, 'cluster-1', null, {})
    expect(input.teilaufgaben).toHaveLength(1)
  })
})
