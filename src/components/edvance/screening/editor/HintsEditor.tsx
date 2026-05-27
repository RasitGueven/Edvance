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
    <div className="rounded-xl border border-[var(--color-gold-warning)]/40 bg-[var(--color-gold-warning)]/10 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-gold-warning)]">
        💡 {t('hint.n', { n })}
      </div>
      <textarea
        className="w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-gold-warning)]/60"
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
        <p className="rounded-lg bg-[var(--color-primary)]/10 px-3 py-2 text-xs text-[var(--color-primary)]">
          ℹ️ {t('hint.notPersisted')}
        </p>
      )}
      <HintSlot n={1} value={hint1} onChange={(v) => onChange('hint1', v)} />
      <HintSlot n={2} value={hint2} onChange={(v) => onChange('hint2', v)} />
      <p className="text-xs text-[var(--color-text-tertiary)]">{t('hint.explainer')}</p>
    </div>
  )
}
