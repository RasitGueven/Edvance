import { Link } from 'react-router-dom'
import { Sparkles, Target } from 'lucide-react'
import type { SkillLevelEntry } from '@/types/diagnosis'
import { SectionHeader } from './DiagnosisResultComponents'
import { EdvanceCard } from '@/components/edvance'

interface LernplanSectionProps {
  focus: SkillLevelEntry[]
  clusterIdFor: (name: string) => string | undefined
}

export function LernplanSection({ focus, clusterIdFor }: LernplanSectionProps) {
  return (
    <section className="mb-10">
      <SectionHeader
        icon={<Target className="h-4 w-4" />}
        label="Empfohlener Lernplan"
        description="Automatisch generiert auf Basis der schwächsten Skills"
      />
      <div
        className="rounded-3xl p-7 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, white) 0%, color-mix(in srgb, var(--color-primary-hover) 4%, white) 100%)',
          border: '2px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
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
              <EdvanceCard
                className="p-5 border-2 border-b-4 border-[var(--color-border)] transition-shadow group-hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
                      borderBottom: '3px solid var(--color-primary-hover)',
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
                      background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
                    }}
                  />
                </div>
              </EdvanceCard>
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
    </section>
  )
}
