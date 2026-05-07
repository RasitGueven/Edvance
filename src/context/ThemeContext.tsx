import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export const THEMES = ['edvance', 'ocean', 'forest', 'sunset'] as const
export type Theme = (typeof THEMES)[number]

const STORAGE_KEY = 'edvance:theme'

export const THEME_PREVIEW: Record<Theme, { primary: string; light: string; dark: string }> = {
  edvance: { primary: '#2D6A9F', light: '#98C0D8', dark: '#1B2A3E' },
  ocean: { primary: '#0E7490', light: '#67E8F9', dark: '#164E63' },
  forest: { primary: '#166534', light: '#86EFAC', dark: '#14532D' },
  sunset: { primary: '#C2410C', light: '#FDBA74', dark: '#7C2D12' },
}

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'edvance'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return (THEMES as readonly string[]).includes(stored ?? '') ? (stored as Theme) : 'edvance'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  if (theme === 'edvance') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (next: Theme) => setThemeState(next)

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
