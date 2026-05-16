import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { CoachStep } from '@/components/edvance/onboarding/CoachStep'
import { EMPTY_FORM, STEP_LABELS } from '@/components/edvance/onboarding/constants'
import { StepIndicator } from '@/components/edvance/onboarding/StepIndicator'
import { StudentDataStep } from '@/components/edvance/onboarding/StudentDataStep'
import { SubjectsStep } from '@/components/edvance/onboarding/SubjectsStep'
import { SummaryStep } from '@/components/edvance/onboarding/SummaryStep'
import { TierStep } from '@/components/edvance/onboarding/TierStep'
import { canProceed } from '@/components/edvance/onboarding/validation'
import { getCoaches } from '@/lib/supabase/profiles'
import type { Coach, OnboardingFormData } from '@/types'

const SHADOW_CARD = '0 4px 24px 0 rgba(0,0,0,0.08)'
const SUCCESS_ICON_BG = 'color-mix(in srgb, var(--success) 15%, transparent)'

const STEP_DATA = 0
const STEP_SUBJECTS = 1
const STEP_TIER = 2
const STEP_COACH = 3
const STEP_SUMMARY = 4

type StepRendererProps = {
  step: number
  data: OnboardingFormData
  setData: (next: OnboardingFormData) => void
  coaches: Coach[]
  coachesLoading: boolean
}

function StepRenderer({
  step,
  data,
  setData,
  coaches,
  coachesLoading,
}: StepRendererProps): JSX.Element | null {
  if (step === STEP_DATA) return <StudentDataStep data={data} setData={setData} />
  if (step === STEP_SUBJECTS) return <SubjectsStep data={data} setData={setData} />
  if (step === STEP_TIER) return <TierStep data={data} setData={setData} />
  if (step === STEP_COACH)
    return (
      <CoachStep data={data} setData={setData} coaches={coaches} loading={coachesLoading} />
    )
  if (step === STEP_SUMMARY) return <SummaryStep data={data} coaches={coaches} />
  return null
}

type SuccessStateProps = {
  data: OnboardingFormData
  coaches: Coach[]
  onReset: () => void
}

function SuccessState({ data, coaches, onReset }: SuccessStateProps): JSX.Element {
  const coachName = coaches.find((entry) => entry.id === data.coachId)?.full_name
  return (
    <Card style={{ boxShadow: SHADOW_CARD }}>
      <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: SUCCESS_ICON_BG }}>
          <Check className="h-8 w-8 text-success" />
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">Schüler angelegt</p>
          <p className="mt-1 text-sm text-muted">
            {data.firstName} {data.lastName} wurde erfolgreich im System eingetragen und {coachName} zugewiesen.
          </p>
        </div>
        <Button onClick={onReset} className="mt-2">
          Weiteren Schüler anlegen
        </Button>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard(): JSX.Element {
  const [step, setStep] = useState<number>(STEP_DATA)
  const [data, setData] = useState<OnboardingFormData>(EMPTY_FORM)
  const [done, setDone] = useState<boolean>(false)
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [coachesLoading, setCoachesLoading] = useState<boolean>(true)

  useEffect(() => {
    let active = true
    getCoaches().then(({ data: list }) => {
      if (!active) return
      setCoaches(list ?? [])
      setCoachesLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const isLast = step === STEP_LABELS.length - 1

  const handleNext = (): void => {
    if (isLast) {
      setDone(true)
      return
    }
    setStep((current) => current + 1)
  }

  const handleBack = (): void => setStep((current) => current - 1)

  const handleReset = (): void => {
    setData(EMPTY_FORM)
    setStep(STEP_DATA)
    setDone(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Admin-Dashboard" />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-4 flex justify-end">
          <Link
            to="/admin/leads"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)]"
          >
            <Inbox className="h-4 w-4" /> Leads verwalten
          </Link>
        </div>
        {done ? (
          <SuccessState data={data} coaches={coaches} onReset={handleReset} />
        ) : (
          <Card style={{ boxShadow: SHADOW_CARD }}>
            <CardHeader className="pb-2">
              <h1 className="text-xl font-bold text-foreground">Schüler-Onboarding</h1>
              <p className="text-sm text-muted">
                {STEP_LABELS[step]} – Schritt {step + 1} von {STEP_LABELS.length}
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <StepIndicator current={step} />
              <StepRenderer
                step={step}
                data={data}
                setData={setData}
                coaches={coaches}
                coachesLoading={coachesLoading}
              />

              <div className="mt-8 flex items-center justify-between">
                <Button variant="outline" onClick={handleBack} disabled={step === STEP_DATA}>
                  Zurück
                </Button>
                <Button onClick={handleNext} disabled={!canProceed(step, data)}>
                  {isLast ? (
                    'Jetzt anlegen'
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Weiter <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
