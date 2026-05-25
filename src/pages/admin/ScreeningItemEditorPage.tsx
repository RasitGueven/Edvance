import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  EdvanceCard,
  LoadingPulse,
} from '@/components/edvance'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { HintsEditor } from '@/components/edvance/screening/editor/HintsEditor'
import { TeilaufgabenEditor } from '@/components/edvance/screening/editor/TeilaufgabenEditor'
import { LivePreview } from '@/components/edvance/screening/editor/LivePreview'
import {
  AFB_OPTIONS,
  buildInput,
  CHECK_TYPES,
  emptyState,
  fromItem,
  INPUT_TYPES,
  PHASE_OPTIONS,
  parsePayloadCanonical,
  validate,
  type EditorUsage,
  type FormState,
} from '@/components/edvance/screening/editor/state'
import {
  createScreeningItem,
  getScreeningItem,
  setScreeningItemActive,
  updateScreeningItem,
} from '@/lib/supabase/screeningItems'
import type {
  ScreeningAfb,
  ScreeningCheckType,
  ScreeningItem,
  ScreeningLevel,
  ScreeningPhase,
} from '@/types'

const SELECT =
  'h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 text-sm'
const TEXTAREA =
  'min-h-[80px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm'
const JSON_TEXT =
  'min-h-[110px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs'

const USAGES: EditorUsage[] = ['screening', 'lernpfad', 'beides']

export function ScreeningItemEditorPage(): JSX.Element {
  const { t } = useTranslation('screening-editor')
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const clusterIdParam = params.get('clusterId') ?? ''
  const isNew = !id || id === 'new'

  const [state, setState] = useState<FormState>(emptyState)
  const [loaded, setLoaded] = useState<ScreeningItem | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    getScreeningItem(id!).then(({ data, error: err }) => {
      if (err || !data) {
        setError(err ?? t('loadError'))
        setLoading(false)
        return
      }
      setLoaded(data)
      setState(fromItem(data))
      setActive(data.active)
      setLoading(false)
    })
  }, [id, isNew, t])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]): void => {
    setState((s) => ({ ...s, [k]: v }))
    setDirty(true)
  }

  const toggleActive = async (): Promise<void> => {
    if (!loaded) return
    const next = !active
    setActive(next)
    await setScreeningItemActive(loaded.id, next)
  }

  const save = async (): Promise<void> => {
    setError(null)
    const vErr = validate(state)
    if (vErr) {
      setError(t(`validation.${vErr}`))
      return
    }
    const parsed = parsePayloadCanonical(state)
    if ('error' in parsed) {
      setError('payload oder canonical ist kein gültiges JSON.')
      return
    }
    const cid = loaded ? loaded.cluster_id : clusterIdParam
    if (!cid) {
      setError(t('validation.clusterMissing'))
      return
    }
    setBusy(true)
    const input = buildInput(state, cid, parsed.payload, parsed.canonical)
    const { data, error: err } = loaded
      ? await updateScreeningItem(loaded.id, input)
      : await createScreeningItem(input)
    setBusy(false)
    if (err) {
      setError(t('validation.saveFailed', { error: err }))
      return
    }
    setDirty(false)
    if (!loaded && data) {
      navigate(`/admin/screening-items/${data.id}/edit`, { replace: true })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <EdvanceNavbar subtitle={t('page.subtitle')} sticky />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <LoadingPulse type="list" lines={6} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle={t('page.subtitle')} sticky />
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6">
        <Link
          to="/admin/screening-items"
          className="mb-2 inline-flex items-center gap-1 text-sm text-[var(--text-muted)]"
        >
          <ArrowLeft className="h-4 w-4" /> {t('page.backToList')}
        </Link>

        <header className="mb-6 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Input
              className="flex-1 border-transparent bg-transparent text-xl font-bold focus-visible:border-[var(--border)] focus-visible:bg-[var(--card)]"
              value={state.skill_label}
              onChange={(e) => set('skill_label', e.target.value)}
              placeholder={
                isNew ? t('header.newPlaceholder') : t('page.titleEdit')
              }
            />
            {!isNew && (
              <Button
                size="sm"
                variant={active ? 'outline' : 'default'}
                onClick={toggleActive}
              >
                {active ? t('common:active', { defaultValue: 'Aktiv' }) : t('common:inactive', { defaultValue: 'Inaktiv' })}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            <UsageToggle
              value={state.usage}
              onChange={(v) => set('usage', v)}
            />
            {loaded && (
              <span>
                {t('header.idLabel')} <strong>{loaded.id.slice(0, 8)}</strong>
              </span>
            )}
            <span>·</span>
            <span>{t(`inputTypes.${state.input_type}`)}</span>
          </div>

          {state.input_type === 'DRAW' && state.usage !== 'lernpfad' && (
            <Banner variant="warning">⚠️ {t('usage.drawWarning')}</Banner>
          )}
          <Banner variant="info">ℹ️ {t('usage.notPersisted')}</Banner>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Section title={t('sections.aufgabenstellung')}>
              <Field label={`${t('fields.context')} (${t('common:optional', { defaultValue: 'optional' })})`}>
                <textarea
                  className={TEXTAREA}
                  value={state.kontext}
                  onChange={(e) => set('kontext', e.target.value)}
                />
              </Field>
              <Field label={t('fields.prompt')}>
                <textarea
                  className={TEXTAREA}
                  value={state.prompt}
                  onChange={(e) => set('prompt', e.target.value)}
                />
              </Field>
            </Section>

            <Section title={t('sections.aufgabentyp')}>
              <div className="flex flex-wrap gap-1.5">
                {INPUT_TYPES.map((tp) => (
                  <button
                    type="button"
                    key={tp}
                    onClick={() => set('input_type', tp)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      state.input_type === tp
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {t(`inputTypes.${tp}`)}
                  </button>
                ))}
              </div>
            </Section>

            <Section title={t('sections.antwortoptionen')}>
              <p className="mb-2 text-xs text-[var(--text-muted)]">
                v1: JSON-Edit. Visuelle Builder pro Typ folgen.
              </p>
              <Field label="payload (JSON)">
                <textarea
                  className={JSON_TEXT}
                  value={state.payloadStr}
                  onChange={(e) => set('payloadStr', e.target.value)}
                />
              </Field>
              <Field label="canonical (JSON)">
                <textarea
                  className={JSON_TEXT}
                  value={state.canonicalStr}
                  onChange={(e) => set('canonicalStr', e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('fields.checkType')}>
                  <select
                    className={SELECT}
                    value={state.check_type}
                    onChange={(e) =>
                      set('check_type', e.target.value as ScreeningCheckType)
                    }
                  >
                    {CHECK_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('fields.tolerance')}>
                  <Input
                    value={state.tolerance}
                    onChange={(e) => set('tolerance', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            <Section title={t('sections.hinweise')}>
              <HintsEditor
                hint1={state.hint1}
                hint2={state.hint2}
                onChange={(which, v) => set(which, v)}
                showNotPersistedBanner
              />
            </Section>

            <Section title={t('sections.teilaufgaben')}>
              <TeilaufgabenEditor
                items={state.teilaufgaben}
                onChange={(items) => set('teilaufgaben', items)}
              />
            </Section>

            <Section title={t('sections.coach')}>
              <Field label={t('fields.explanation')}>
                <textarea
                  className={TEXTAREA}
                  value={state.explanation}
                  onChange={(e) => set('explanation', e.target.value)}
                />
              </Field>
              <Field
                label={`${t('fields.typicalErrors')} (${t('fields.typicalErrorsHint')})`}
              >
                <textarea
                  className={TEXTAREA}
                  value={state.typical}
                  onChange={(e) => set('typical', e.target.value)}
                />
              </Field>
            </Section>

            <Section title={t('sections.metadaten')}>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('fields.skillCode')}>
                  <Input
                    value={state.skill_code}
                    onChange={(e) => set('skill_code', e.target.value)}
                  />
                </Field>
                <Field label={t('fields.topic')}>
                  <Input
                    value={state.topic}
                    onChange={(e) => set('topic', e.target.value)}
                  />
                </Field>
                <Field label={t('fields.classLevel')}>
                  <Input
                    type="number"
                    min={5}
                    max={13}
                    value={state.class_level}
                    onChange={(e) =>
                      set('class_level', Number(e.target.value))
                    }
                  />
                </Field>
                <Field label={t('fields.level')}>
                  <select
                    className={SELECT}
                    value={state.level}
                    onChange={(e) =>
                      set('level', Number(e.target.value) as ScreeningLevel)
                    }
                  >
                    {[1, 2, 3].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('fields.afb')}>
                  <select
                    className={SELECT}
                    value={state.afb}
                    onChange={(e) =>
                      set('afb', e.target.value as ScreeningAfb | '')
                    }
                  >
                    <option value="">—</option>
                    {AFB_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        AFB {a}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('fields.phase')}>
                  <select
                    className={SELECT}
                    value={state.phase}
                    onChange={(e) =>
                      set('phase', e.target.value as ScreeningPhase | '')
                    }
                  >
                    <option value="">—</option>
                    {PHASE_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>
          </div>

          <div className="sticky top-20 self-start">
            <LivePreview state={state} />
          </div>
        </div>
      </main>

      <SaveBar
        dirty={dirty}
        busy={busy}
        error={error}
        onSave={save}
        onDiscard={() => {
          if (loaded) setState(fromItem(loaded))
          else setState(emptyState())
          setDirty(false)
          setError(null)
        }}
      />
    </div>
  )
}

function Section({
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

function Field({
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

function UsageToggle({
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

function Banner({
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

function SaveBar({
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
