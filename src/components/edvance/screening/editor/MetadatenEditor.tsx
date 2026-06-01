import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import {
  Field,
  Section,
  SELECT,
} from '@/components/edvance/screening/editor/ScreeningEditorPrimitives'
import {
  AFB_OPTIONS,
  PHASE_OPTIONS,
  type FormState,
} from '@/components/edvance/screening/editor/state'
import type {
  ScreeningAfb,
  ScreeningLevel,
  ScreeningPhase,
} from '@/types'

interface MetadatenEditorProps {
  state: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
}

export function MetadatenEditor({ state, set }: MetadatenEditorProps): JSX.Element {
  const { t } = useTranslation('screening-editor')

  return (
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
            onChange={(e) => set('class_level', Number(e.target.value))}
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
            onChange={(e) => set('afb', e.target.value as ScreeningAfb | '')}
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
  )
}
