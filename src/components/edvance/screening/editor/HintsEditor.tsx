import { useTranslation } from 'react-i18next'

export function HintSlot({
  n,
  value,
  onChange,
}: {
  n: 1 | 2
  value: string
  onChange: (v: string) => void
}): JSX.Element {
  const { t } = useTranslation('screening-editor')
  return (
    <div className="rounded-xl border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--warning)]">
        💡 {t('hint.n', { n })}
      </div>
      <textarea
        className="w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--warning)]/60"
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          n === 1 ? t('hint.placeholder1') : t('hint.placeholder2')
        }
      />
    </div>
  )
}

export function HintsEditor({
  hint1,
  hint2,
  onChange,
  showNotPersistedBanner = false,
}: {
  hint1: string
  hint2: string
  onChange: (which: 'hint1' | 'hint2', v: string) => void
  showNotPersistedBanner?: boolean
}): JSX.Element {
  const { t } = useTranslation('screening-editor')
  return (
    <div className="flex flex-col gap-2">
      {showNotPersistedBanner && (
        <p className="rounded-lg bg-[var(--info)]/10 px-3 py-2 text-xs text-[var(--info)]">
          ℹ️ {t('hint.notPersisted')}
        </p>
      )}
      <HintSlot n={1} value={hint1} onChange={(v) => onChange('hint1', v)} />
      <HintSlot n={2} value={hint2} onChange={(v) => onChange('hint2', v)} />
      <p className="text-xs text-[var(--text-muted)]">{t('hint.explainer')}</p>
    </div>
  )
}
