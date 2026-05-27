import type { JSX } from 'react'
import { XPBar, StreakPill } from '@/components/edvance'

interface StudentDashboardHeroProps {
  displayName: string
  level: number
  xpCurrentInLevel: number
  xpMaxPerLevel: number
  presenceWeeks: number
  homeSessions: number
  presenceMultiplier: number
}

/**
 * Schüler-Hero — student-hero Gradient + light-source Overlay,
 * zwei StreakPills in glass-pill Wrapper.
 *
 * KEINE dekorativen Hintergrund-Blobs mehr (v1-Premium-Stil entfernt).
 */
export function StudentDashboardHero({
  displayName,
  level,
  xpCurrentInLevel,
  xpMaxPerLevel,
  presenceWeeks,
  homeSessions,
  presenceMultiplier,
}: StudentDashboardHeroProps): JSX.Element {
  return (
    <section className="relative overflow-hidden student-hero light-source">
      <div className="mx-auto max-w-3xl px-4 py-8 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-eyebrow opacity-70">Heute · Mein Lernplan</p>
            <h1 className="text-display text-3xl mt-1.5 leading-none">Hi {displayName} 👋</h1>
            <p className="mt-2 text-sm opacity-80 max-w-md">
              Wähle ein Thema oder suche direkt nach einer Aufgabe.
            </p>
          </div>

          {/* Zwei Streaks im Glass-Pill Wrapper (Glas nur auf dunkler Bühne erlaubt) */}
          <div className="flex flex-col gap-2">
            <StreakPill variant="presence" count={presenceWeeks} multiplier={presenceMultiplier} />
            <StreakPill variant="home" count={homeSessions} />
          </div>
        </div>

        {/* XP-Card im Glas-Stil (auf dunklem Hero erlaubt) */}
        <div className="glass-card p-5">
          <XPBar
            current={xpCurrentInLevel}
            max={xpMaxPerLevel}
            level={level}
            levelName={`Level ${level}`}
          />
        </div>
      </div>
    </section>
  )
}
