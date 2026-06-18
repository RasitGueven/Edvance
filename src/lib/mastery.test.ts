import { describe, it, expect } from 'vitest'
import { masteryStage, masteryStageFromLevel, MASTERY_STAGES, MASTERY_STAGE_LABEL } from './mastery'

describe('masteryStage', () => {
  it('gibt "introduced" bei Score < 40 zurück', () => {
    expect(masteryStage(0)).toBe('introduced')
    expect(masteryStage(39)).toBe('introduced')
  })

  it('gibt "developing" bei Score 40–59 zurück', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(59)).toBe('developing')
  })

  it('gibt "progressing" bei Score 60–74 zurück', () => {
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(74)).toBe('progressing')
  })

  it('gibt "proficient" bei Score 75–84 zurück', () => {
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(84)).toBe('proficient')
  })

  it('gibt "mastered" bei Score ≥ 85 zurück', () => {
    expect(masteryStage(85)).toBe('mastered')
    expect(masteryStage(100)).toBe('mastered')
  })

  it('behandelt Grenzwerte korrekt', () => {
    expect(masteryStage(40)).toBe('developing')
    expect(masteryStage(60)).toBe('progressing')
    expect(masteryStage(75)).toBe('proficient')
    expect(masteryStage(85)).toBe('mastered')
  })
})

describe('masteryStageFromLevel', () => {
  it('konvertiert Level 1–10 in Stage', () => {
    expect(masteryStageFromLevel(1)).toBe('introduced')   // 10 → introduced
    expect(masteryStageFromLevel(4)).toBe('developing')   // 40 → developing
    expect(masteryStageFromLevel(6)).toBe('progressing')  // 60 → progressing
    expect(masteryStageFromLevel(8)).toBe('proficient')   // 80 → proficient
    expect(masteryStageFromLevel(9)).toBe('mastered')     // 90 → mastered
    expect(masteryStageFromLevel(10)).toBe('mastered')    // 100 → mastered
  })
})

describe('MASTERY_STAGES', () => {
  it('enthält alle 5 Stufen in aufsteigender Reihenfolge', () => {
    expect(MASTERY_STAGES).toEqual([
      'introduced',
      'developing',
      'progressing',
      'proficient',
      'mastered',
    ])
  })
})

describe('MASTERY_STAGE_LABEL', () => {
  it('hat deutsches Label für jede Stage', () => {
    expect(MASTERY_STAGE_LABEL.introduced).toBe('Eingeführt')
    expect(MASTERY_STAGE_LABEL.developing).toBe('In Entwicklung')
    expect(MASTERY_STAGE_LABEL.progressing).toBe('Fortschritt')
    expect(MASTERY_STAGE_LABEL.proficient).toBe('Sicher')
    expect(MASTERY_STAGE_LABEL.mastered).toBe('Gemeistert')
  })
})
