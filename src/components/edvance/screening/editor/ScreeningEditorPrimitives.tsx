import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { EdvanceCard } from '@/components/edvance'
import type { EditorUsage } from './state'

export const SELECT =
  'h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 text-sm'
export const TEXTAREA =
  'min-h-[80px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm'
export const JSON_TEXT =
  'min-h-[110px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs'

export const USAGES: EditorUsage[] = ['screening', 'lernpfad', 'beides']

export function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <EdvanceCard className="p-5">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </EdvanceCard>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[var(--text-secondary)]">
        {label}
      </span>
      {children}
    </div>
  )
}

export function UsageToggle({
  value,
  onChange,
}: {
  value: EditorUsage
  onChange: (v: EditorUsage) => void
}): JSX.Element {
  const { t } = useTranslation('screening-editor')
  return (
    <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-0.5">
      {USAGES.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            value === u
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          {t(`usage.${u}`)}
        </button>
      ))}
    </div>
  )
}

export function Banner({
  variant,
  children,
}: {
  variant: 'warning' | 'info'
  children: React.ReactNode
}): JSX.Element {
  const cls =
    variant === 'warning'
      ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
      : 'bg-[var(--info)]/10 text-[var(--info)]'
  return (
    <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${cls}`}>
      {children}
    </div>
  )
}

export function SaveBar({
  dirty,
  busy,
  error,
  onSave,
  onDiscard,
}: {
  dirty: boolean
  busy: boolean
  error: string | null
  onSave: () => void
  onDiscard: () => void
}): JSX.Element {
  const { t } = useTranslation('screening-editor')
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-elevation-lg">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
        <span
          className={`flex items-center gap-2 text-xs font-semibold ${
            dirty ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              dirty ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
            }`}
          />
          {dirty
            ? 'Ungespeicherte Änderungen'
            : 'Alle Änderungen gespeichert'}
        </span>
        {error && (
          <span className="text-xs text-[var(--destructive)]">{error}</span>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDiscard}
            disabled={!dirty || busy}
          >
            {t('common:discard', { defaultValue: 'Verwerfen' })}
          </Button>
          <Button size="sm" onClick={onSave} disabled={!dirty || busy}>
            {busy
              ? t('common:saving', { defaultValue: 'Speichert…' })
              : t('common:save', { defaultValue: 'Speichern' })}
          </Button>
        </div>
      </div>
    </div>
  )
}
