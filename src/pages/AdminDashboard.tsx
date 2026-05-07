import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ChevronRight } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type SchoolType = 'Gymnasium' | 'Gesamtschule' | 'Realschule' | 'Hauptschule' | ''
type Tarif = 'Basic' | 'Standard' | 'Premium' | ''

type FormData = {
  firstName: string
  lastName: string
  email: string
  classLevel: string
  schoolName: string
  schoolType: SchoolType
  subjects: string[]
  tarif: Tarif
  coachId: string
}

// ── Mock Coaches ─────────────────────────────────────────────────────────────

const MOCK_COACHES = [
  { id: 'c2', name: 'Frau Demir' },
  { id: 'c3', name: 'Herr Kaya' },
]

const SUBJECTS = ['Mathematik', 'Deutsch', 'Englisch']
const SCHOOL_TYPES: SchoolType[] = ['Gymnasium', 'Gesamtschule', 'Realschule', 'Hauptschule']
const CLASS_LEVELS = Array.from({ length: 9 }, (_, i) => String(i + 5))

const TARIFE = [
  {
    id: 'Basic' as Tarif,
    label: 'Basic',
    price: '89 €/Monat',
    features: ['2 Sessions/Woche', 'Basis-Lernpfad', 'Monatlicher Eltern-Report'],
  },
  {
    id: 'Standard' as Tarif,
    label: 'Standard',
    price: '129 €/Monat',
    features: ['3 Sessions/Woche', 'KI-Lernpfad', '2× Eltern-Report/Monat', 'Coach-Chat'],
  },
  {
    id: 'Premium' as Tarif,
    label: 'Premium',
    price: '169 €/Monat',
    features: ['Unbegrenzte Sessions', 'Voller KI-Lernpfad', 'Wöchentlicher Report', 'Prioritäts-Coach', 'Fachwechsel flexibel'],
  },
]

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Stammdaten', 'Fächer', 'Tarif', 'Coach', 'Abschluss']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all"
                style={{
                  background: done
                    ? 'var(--success)'
                    : active
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                    : 'var(--border)',
                  color: done || active ? 'white' : 'var(--muted)',
                }}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className="mt-1 text-xs font-medium hidden sm:block"
                style={{ color: active ? 'var(--primary)' : done ? 'var(--success)' : 'var(--muted)' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="h-0.5 w-10 mx-1 mb-4 sm:w-14 transition-all"
                style={{ background: done ? 'var(--success)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Steps ────────────────────────────────────────────────────────────────────

function Step1({ data, setData }: { data: FormData; setData: (d: FormData) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">Vorname</Label>
          <Input id="firstName" placeholder="z.B. Lena" value={data.firstName} onChange={e => setData({ ...data, firstName: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Nachname</Label>
          <Input id="lastName" placeholder="z.B. Fischer" value={data.lastName} onChange={e => setData({ ...data, lastName: e.target.value })} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-Mail (Eltern)</Label>
        <Input id="email" type="email" placeholder="eltern@beispiel.de" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Klasse</Label>
          <div className="flex flex-wrap gap-2">
            {CLASS_LEVELS.map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setData({ ...data, classLevel: lvl })}
                className="h-9 w-11 rounded-lg border text-sm font-medium transition-all"
                style={{
                  borderColor: data.classLevel === lvl ? 'var(--primary)' : 'var(--border)',
                  background: data.classLevel === lvl ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                  color: data.classLevel === lvl ? 'var(--primary)' : 'var(--foreground)',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Schultyp</Label>
          <div className="flex flex-col gap-2">
            {SCHOOL_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setData({ ...data, schoolType: type })}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-all"
                style={{
                  borderColor: data.schoolType === type ? 'var(--primary)' : 'var(--border)',
                  background: data.schoolType === type ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                  color: data.schoolType === type ? 'var(--primary)' : 'var(--foreground)',
                }}
              >
                {data.schoolType === type && <Check className="h-3.5 w-3.5 shrink-0" />}
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="school">Schule (optional)</Label>
        <Input id="school" placeholder="z.B. Humboldt-Gymnasium Köln" value={data.schoolName} onChange={e => setData({ ...data, schoolName: e.target.value })} />
      </div>
    </div>
  )
}

function Step2({ data, setData }: { data: FormData; setData: (d: FormData) => void }) {
  const toggle = (subject: string) => {
    const already = data.subjects.includes(subject)
    if (already) {
      setData({ ...data, subjects: data.subjects.filter(s => s !== subject) })
    } else if (data.subjects.length < 2) {
      setData({ ...data, subjects: [...data.subjects, subject] })
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Maximal 2 Fächer wählbar (MVP).</p>
      <div className="flex flex-col gap-3">
        {SUBJECTS.map(subject => {
          const selected = data.subjects.includes(subject)
          const disabled = !selected && data.subjects.length >= 2
          return (
            <button
              key={subject}
              type="button"
              disabled={disabled}
              onClick={() => toggle(subject)}
              className="flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-all"
              style={{
                borderColor: selected ? 'var(--primary)' : 'var(--border)',
                background: selected ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'var(--card)',
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <span className="font-medium text-foreground">{subject}</span>
              {selected && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: 'var(--primary)' }}>
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step3({ data, setData }: { data: FormData; setData: (d: FormData) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {TARIFE.map((tarif, idx) => {
        const selected = data.tarif === tarif.id
        const isMiddle = idx === 1
        return (
          <button
            key={tarif.id}
            type="button"
            onClick={() => setData({ ...data, tarif: tarif.id })}
            className="relative flex items-start justify-between rounded-xl border px-5 py-4 text-left transition-all"
            style={{
              borderColor: selected ? 'var(--primary)' : isMiddle && !selected ? 'var(--primary-light)' : 'var(--border)',
              background: selected ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'var(--card)',
              boxShadow: selected ? '0 0 0 2px var(--primary)' : 'none',
            }}
          >
            {isMiddle && (
              <span className="absolute -top-3 left-4 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: 'var(--primary)' }}>
                Empfohlen
              </span>
            )}
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">{tarif.label}</span>
              <ul className="mt-1 flex flex-col gap-0.5">
                {tarif.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-sm text-muted">
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
              <span className="font-bold text-foreground">{tarif.price}</span>
              {selected && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: 'var(--primary)' }}>
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function Step4({ data, setData }: { data: FormData; setData: (d: FormData) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Wähle einen Coach für die erste Session.</p>
      {MOCK_COACHES.map(coach => {
        const selected = data.coachId === coach.id
        const initials = coach.name.split(' ').map(n => n[0]).join('').toUpperCase()
        return (
          <button
            key={coach.id}
            type="button"
            onClick={() => setData({ ...data, coachId: coach.id })}
            className="flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all"
            style={{
              borderColor: selected ? 'var(--primary)' : 'var(--border)',
              background: selected ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'var(--card)',
              boxShadow: selected ? '0 0 0 2px var(--primary)' : 'none',
            }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}
            >
              {initials}
            </span>
            <span className="font-medium text-foreground">{coach.name}</span>
            {selected && (
              <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full" style={{ background: 'var(--primary)' }}>
                <Check className="h-3.5 w-3.5 text-white" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function Step5({ data }: { data: FormData }) {
  const coach = MOCK_COACHES.find(c => c.id === data.coachId)
  const rows = [
    ['Name', `${data.firstName} ${data.lastName}`],
    ['E-Mail', data.email || '–'],
    ['Klasse', data.classLevel ? `${data.classLevel}. Klasse` : '–'],
    ['Schultyp', data.schoolType || '–'],
    ['Schule', data.schoolName || '–'],
    ['Fächer', data.subjects.length ? data.subjects.join(', ') : '–'],
    ['Tarif', data.tarif || '–'],
    ['Coach', coach?.name ?? '–'],
  ]
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl p-4 text-sm"
        style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)' }}
      >
        <p className="font-semibold text-success">Alles bereit zum Anlegen</p>
        <p className="mt-0.5 text-muted">Bitte prüfe die Angaben und bestätige das Onboarding.</p>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3 text-sm"
            style={{ background: i % 2 === 0 ? 'var(--card)' : 'color-mix(in srgb, var(--muted) 5%, transparent)' }}
          >
            <span className="text-muted font-medium w-28 shrink-0">{label}</span>
            <span className="text-foreground font-semibold text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Wizard validation ─────────────────────────────────────────────────────────

function canProceed(step: number, data: FormData): boolean {
  if (step === 0) return !!data.firstName && !!data.lastName && !!data.classLevel && !!data.schoolType
  if (step === 1) return data.subjects.length >= 1
  if (step === 2) return !!data.tarif
  if (step === 3) return !!data.coachId
  return true
}

// ── Main ─────────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormData = {
  firstName: '', lastName: '', email: '', classLevel: '',
  schoolName: '', schoolType: '', subjects: [], tarif: '', coachId: '',
}

export function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(EMPTY_FORM)
  const [done, setDone] = useState(false)

  const isLast = step === STEPS.length - 1

  function handleNext() {
    if (isLast) { setDone(true); return }
    setStep(s => s + 1)
  }

  function handleReset() {
    setData(EMPTY_FORM)
    setStep(0)
    setDone(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-border bg-card px-6 py-3" style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>E</div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Edvance</p>
            <p className="text-xs text-muted leading-tight">Admin-Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:block">{user?.email}</span>
          <Button variant="outline" onClick={signOut}>Abmelden</Button>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {done ? (
          /* ── Success state ── */
          <Card style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)' }}>
            <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)' }}>
                <Check className="h-8 w-8 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">Schüler angelegt</p>
                <p className="mt-1 text-sm text-muted">
                  {data.firstName} {data.lastName} wurde erfolgreich im System eingetragen und {MOCK_COACHES.find(c => c.id === data.coachId)?.name} zugewiesen.
                </p>
              </div>
              <Button onClick={handleReset} className="mt-2">Weiteren Schüler anlegen</Button>
            </CardContent>
          </Card>
        ) : (
          /* ── Wizard ── */
          <Card style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)' }}>
            <CardHeader className="pb-2">
              <h1 className="text-xl font-bold text-foreground">Schüler-Onboarding</h1>
              <p className="text-sm text-muted">{STEPS[step]} – Schritt {step + 1} von {STEPS.length}</p>
            </CardHeader>
            <CardContent className="pt-4">
              <StepIndicator current={step} />

              {step === 0 && <Step1 data={data} setData={setData} />}
              {step === 1 && <Step2 data={data} setData={setData} />}
              {step === 2 && <Step3 data={data} setData={setData} />}
              {step === 3 && <Step4 data={data} setData={setData} />}
              {step === 4 && <Step5 data={data} />}

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 0}
                >
                  Zurück
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed(step, data)}
                >
                  {isLast ? 'Jetzt anlegen' : (
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
