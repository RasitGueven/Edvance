import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useThemeContext, THEME_PREVIEW } from '@/context/ThemeContext'

// ── Test helper component ─────────────────────────────────────────────────────

function ThemeDisplay() {
  const { theme, setTheme } = useThemeContext()
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('ocean')}>ocean</button>
      <button onClick={() => setTheme('forest')}>forest</button>
      <button onClick={() => setTheme('sunset')}>sunset</button>
      <button onClick={() => setTheme('edvance')}>edvance</button>
    </div>
  )
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

// ── ThemeProvider ─────────────────────────────────────────────────────────────

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(<ThemeProvider><span>hello</span></ThemeProvider>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('defaults to "edvance" theme', () => {
    render(<ThemeProvider><ThemeDisplay /></ThemeProvider>)
    expect(screen.getByTestId('current-theme').textContent).toBe('edvance')
  })

  it('reads persisted theme from localStorage on mount', () => {
    window.localStorage.setItem('edvance:theme', 'ocean')
    render(<ThemeProvider><ThemeDisplay /></ThemeProvider>)
    expect(screen.getByTestId('current-theme').textContent).toBe('ocean')
  })

  it('falls back to "edvance" for an invalid stored theme', () => {
    window.localStorage.setItem('edvance:theme', 'rainbow')
    render(<ThemeProvider><ThemeDisplay /></ThemeProvider>)
    expect(screen.getByTestId('current-theme').textContent).toBe('edvance')
  })

  it('updates displayed theme when setTheme is called', async () => {
    const user = userEvent.setup()
    render(<ThemeProvider><ThemeDisplay /></ThemeProvider>)
    await user.click(screen.getByText('sunset'))
    expect(screen.getByTestId('current-theme').textContent).toBe('sunset')
  })

  it('persists new theme to localStorage', async () => {
    const user = userEvent.setup()
    render(<ThemeProvider><ThemeDisplay /></ThemeProvider>)
    await user.click(screen.getByText('ocean'))
    expect(window.localStorage.getItem('edvance:theme')).toBe('ocean')
  })

  it('sets data-theme attribute on <html> for non-default themes', async () => {
    const user = userEvent.setup()
    render(<ThemeProvider><ThemeDisplay /></ThemeProvider>)
    await user.click(screen.getByText('forest'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('forest')
  })

  it('removes data-theme attribute when switching back to "edvance"', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('edvance:theme', 'ocean')
    render(<ThemeProvider><ThemeDisplay /></ThemeProvider>)
    await user.click(screen.getByText('edvance'))
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })
})

// ── useThemeContext outside provider ──────────────────────────────────────────

describe('useThemeContext', () => {
  it('throws when used outside ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ThemeDisplay />)).toThrow(
      'useThemeContext must be used within a ThemeProvider',
    )
    spy.mockRestore()
  })
})

// ── THEME_PREVIEW ─────────────────────────────────────────────────────────────

describe('THEME_PREVIEW', () => {
  it('has entries for all 4 themes', () => {
    expect(Object.keys(THEME_PREVIEW)).toHaveLength(4)
    expect(THEME_PREVIEW).toHaveProperty('edvance')
    expect(THEME_PREVIEW).toHaveProperty('ocean')
    expect(THEME_PREVIEW).toHaveProperty('forest')
    expect(THEME_PREVIEW).toHaveProperty('sunset')
  })

  it('each entry has primary, light, and dark as valid hex colors', () => {
    for (const entry of Object.values(THEME_PREVIEW)) {
      expect(entry.primary).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(entry.light).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(entry.dark).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
