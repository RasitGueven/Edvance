import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight } from 'lucide-react'
import type { SkillCluster } from '@/types'

const CLUSTER_TINTS = [
  { bg: 'var(--color-primary-light)',     fg: 'var(--color-primary)' },
  { bg: 'var(--color-success-light)',     fg: 'var(--color-success)' },
  { bg: 'var(--color-warning-light)',     fg: 'var(--color-warning)' },
  { bg: 'var(--color-info-light)',        fg: 'var(--color-info)' },
  { bg: 'color-mix(in srgb, var(--xp-gold) 14%, white)', fg: '#9A6B00' },
]

export function StudentClusterGrid({ clusters }: { clusters: SkillCluster[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {clusters.map((c, idx) => {
        const tint = CLUSTER_TINTS[idx % CLUSTER_TINTS.length]
        return (
          <Link
            key={c.id}
            to={`/student/cluster/${c.id}`}
            className="group block rounded-[var(--radius-xl)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <div className="relative h-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-gradient-surface p-5 shadow-premium-sm transition-all duration-300 group-hover:shadow-premium-lg group-hover:-translate-y-0.5">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-90"
                style={{ background: tint.fg }}
              />

              <div className="relative flex items-start gap-4">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] shadow-premium-sm"
                  style={{ background: tint.bg, color: tint.fg }}
                >
                  <BookOpen className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                    {c.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Klasse {c.class_level_min}
                    {c.class_level_min !== c.class_level_max && ` – ${c.class_level_max}`}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--text-muted)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
