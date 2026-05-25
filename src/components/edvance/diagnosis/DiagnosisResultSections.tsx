import { Link } from 'react-router-dom'
import { Sparkles, CheckCircle2 as CheckCircle2Icon } from 'lucide-react'
import type { SkillLevelEntry } from '@/types/diagnosis'
import { formatDate, getInitials } from './diagnosisUtils'

// ── Diagnosis Hero Header ─────────────────────────────────────────────────────

export function DiagnosisHeroHeader({
  studentName,
  subject,
  date,
}: {
  studentName: string
  subject: string
  date: string
}) {
  return (
    <div
      className="rounded-3xl p-8 mb-8 overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        border: '2px solid var(--primary-shadow)',
        borderBottomWidth: '4px',
      }}
    >
      <div
        className="absolute -top-12 -right-12 h-48 w-48 rounded-full opacity-10"
        style={{ background: 'white' }}
      />
      <div
        className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-5"
        style={{ background: 'white' }}
      />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl text-3xl font-black text-primary shrink-0"
            style={{ background: 'white', borderBottom: '4px solid color-mix(in srgb, white 80%, black)' }}
          >
            {getInitials(studentName)}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/70">
              Initialdiagnostik · {subject}
            </p>
            <h1 className="mt-1 text-3xl font-black text-white tracking-tight">{studentName}</h1>
            <p className="mt-1 text-sm font-semibold text-white/80">
              {formatDate(date)} · Coach: Frau Demir
            </p>
          </div>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wider"
          style={{ background: 'color-mix(in srgb, var(--success) 30%, white)', color: 'var(--success-dark)' }}
        >
          <CheckCircle2Icon className="h-3.5 w-3.5" />
          Abgeschlossen
        </span>
      </div>
    </div>
  )
}

// ── Focus Plan Section ────────────────────────────────────────────────────────

export function FocusPlanSection({
  focus,
  clusterIdFor,
}: {
  focus: SkillLevelEntry[]
  clusterIdFor: (name: string) => string | undefined
}) {
  return (
    <div
      className="rounded-3xl p-7 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, white) 0%, color-mix(in srgb, var(--primary-dark) 4%, white) 100%)',
        border: '2px solid color-mix(in srgb, var(--primary) 25%, transparent)',
        borderBottomWidth: '4px',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-primary">
          Fokus für die nächsten 1–2 Sessions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {focus.map((s, i) => {
          const cid = clusterIdFor(s.skill_cluster)
          const card = (
            <div
              className="rounded-2xl bg-card p-5 transition-shadow group-hover:shadow-md"
              style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    borderBottom: '3px solid var(--primary-shadow)',
                  }}
                >
                  {i + 1}
                </span>
                <p className="text-sm font-black text-foreground flex-1">{s.skill_cluster}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted">
                  Aktuell L{s.level} ({s.label})
                </p>
                <span className="text-xs font-black text-primary">
                  {cid ? '→ Lernen starten' : '→ Ziel L7+'}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(s.level / 10) * 100}%`,
                    background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  }}
                />
              </div>
            </div>
          )
          return cid ? (
            <Link key={s.skill_cluster} to={`/student/cluster/${cid}`} className="group block">
              {card}
            </Link>
          ) : (
            <div key={s.skill_cluster}>{card}</div>
          )
        })}
      </div>

      <p className="mt-5 text-xs font-semibold text-muted leading-relaxed">
        Der Lernpfad startet bei der schwächsten Stelle und arbeitet sich systematisch nach oben.
        Nach DGSR-Logik (Diagnose → Generation → Spacing → Reflection).
      </p>
    </div>
  )
}
