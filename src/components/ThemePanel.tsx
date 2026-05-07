import { THEMES, THEME_PREVIEW, useTheme, type Theme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

export function ThemePanel() {
  if (import.meta.env.VITE_DEV_THEME_PANEL !== 'true') return null

  return <ThemePanelInner />
}

function ThemePanelInner() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-lg">
      <span className="text-xs font-medium text-muted">Theme</span>
      {THEMES.map((t) => (
        <ThemeSwatch key={t} value={t} active={t === theme} onClick={() => setTheme(t)} />
      ))}
    </div>
  )
}

function ThemeSwatch({
  value,
  active,
  onClick,
}: {
  value: Theme
  active: boolean
  onClick: () => void
}) {
  const colors = THEME_PREVIEW[value]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Theme ${value}`}
      title={value}
      className={cn(
        'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-foreground' : 'border-transparent',
      )}
      style={{
        background: `linear-gradient(135deg, ${colors.light} 0%, ${colors.primary} 50%, ${colors.dark} 100%)`,
      }}
    />
  )
}
