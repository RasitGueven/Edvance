import { describe, it, expect } from 'vitest'
import { SELECT_SM, SELECT_MD, TEXTAREA_MD } from '@/lib/formStyles'

describe('formStyles – Tailwind-Klassen-Konstanten', () => {
  it('SELECT_SM ist ein nicht-leerer String', () => {
    expect(typeof SELECT_SM).toBe('string')
    expect(SELECT_SM.length).toBeGreaterThan(0)
  })

  it('SELECT_MD ist ein nicht-leerer String', () => {
    expect(typeof SELECT_MD).toBe('string')
    expect(SELECT_MD.length).toBeGreaterThan(0)
  })

  it('TEXTAREA_MD ist ein nicht-leerer String', () => {
    expect(typeof TEXTAREA_MD).toBe('string')
    expect(TEXTAREA_MD.length).toBeGreaterThan(0)
  })

  it('Konstanten verwenden CSS-Variablen (kein hardcoded Farbe)', () => {
    expect(SELECT_SM).toContain('var(--')
    expect(SELECT_MD).toContain('var(--')
    expect(TEXTAREA_MD).toContain('var(--')
  })

  it('SELECT_SM und SELECT_MD sind voneinander verschieden', () => {
    expect(SELECT_SM).not.toBe(SELECT_MD)
  })

  it('SELECT_SM enthält rounded-xl', () => {
    expect(SELECT_SM).toContain('rounded-xl')
  })

  it('TEXTAREA_MD enthält min-h', () => {
    expect(TEXTAREA_MD).toContain('min-h')
  })
})
