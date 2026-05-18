import { useState, type JSX } from 'react'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { EdvanceCard } from '@/components/edvance'
import { CoordinateSystem, type PlotFn } from '@/components/edvance/CoordinateSystem'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LINEAR_COLOR = 'var(--primary)'
const QUAD_COLOR = 'var(--success)'

function num(v: string): number {
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function CoeffField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        className="w-24"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function GraphDemo(): JSX.Element {
  const [showLinear, setShowLinear] = useState(true)
  const [showQuad, setShowQuad] = useState(true)

  const [m, setM] = useState('1')
  const [b1, setB1] = useState('0')

  const [a, setA] = useState('1')
  const [b2, setB2] = useState('0')
  const [c, setC] = useState('0')

  const mN = num(m)
  const b1N = num(b1)
  const aN = num(a)
  const b2N = num(b2)
  const cN = num(c)

  const functions: PlotFn[] = []
  if (showLinear) {
    functions.push({
      fn: (x) => mN * x + b1N,
      color: LINEAR_COLOR,
      label: `Linear:  y = ${mN}·x + ${b1N}`,
    })
  }
  if (showQuad) {
    functions.push({
      fn: (x) => aN * x * x + b2N * x + cN,
      color: QUAD_COLOR,
      label: `Quadratisch:  y = ${aN}·x² + ${b2N}·x + ${cN}`,
    })
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <EdvanceNavbar subtitle="Graph-Demo" />

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Koordinatensystem</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Demo-Seite ohne Login — lineare und quadratische Gleichungen live einzeichnen.
            Bereich x, y ∈ [−10, 10].
          </p>
        </div>

        <EdvanceCard className="flex flex-col gap-6 p-6">
          <CoordinateSystem functions={functions} />
        </EdvanceCard>

        <EdvanceCard className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Lineare Gleichung · y = m·x + b
            </p>
            <button
              type="button"
              onClick={() => setShowLinear((v) => !v)}
              className="text-sm font-semibold"
              style={{ color: showLinear ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              {showLinear ? 'Sichtbar' : 'Ausgeblendet'}
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            <CoeffField id="lin-m" label="m (Steigung)" value={m} onChange={setM} />
            <CoeffField id="lin-b" label="b (y-Achsenabschnitt)" value={b1} onChange={setB1} />
          </div>
        </EdvanceCard>

        <EdvanceCard className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Quadratische Gleichung · y = a·x² + b·x + c
            </p>
            <button
              type="button"
              onClick={() => setShowQuad((v) => !v)}
              className="text-sm font-semibold"
              style={{ color: showQuad ? 'var(--success)' : 'var(--text-muted)' }}
            >
              {showQuad ? 'Sichtbar' : 'Ausgeblendet'}
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            <CoeffField id="quad-a" label="a" value={a} onChange={setA} />
            <CoeffField id="quad-b" label="b" value={b2} onChange={setB2} />
            <CoeffField id="quad-c" label="c" value={c} onChange={setC} />
          </div>
        </EdvanceCard>
      </main>
    </div>
  )
}
