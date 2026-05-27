import { useEffect, useState, type JSX } from 'react'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { EmptyState, LoadingPulse, StatCard } from '@/components/edvance'
import { DashboardTiles } from '@/components/edvance/DashboardTiles'
import { useAuth } from '@/hooks/useAuth'
import {
  getSessionStudents,
  listSessionsForCoach,
  setAttendance,
} from '@/lib/supabase/sessions'
import { listStudentsWithName } from '@/lib/supabase/students'
import { formatDateLongDe } from '@/lib/utils'
import { ClipboardList, FlaskConical, Inbox } from 'lucide-react'
import { SessionCard, type SessionVM } from './SessionCard'
import type { AttendanceStatus } from '@/types'

const PLACEHOLDER_DASH = '–'

function sessionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function nextUpcomingTime(vms: SessionVM[]): string {
  const next = vms
    .filter((v) => v.session.status === 'upcoming')
    .sort((a, b) => a.session.scheduled_at.localeCompare(b.session.scheduled_at))[0]
  return next ? `${sessionTime(next.session.scheduled_at)} Uhr` : PLACEHOLDER_DASH
}

function totalActiveStudents(vms: SessionVM[]): number {
  return vms
    .filter((v) => v.session.status === 'active')
    .reduce((sum, v) => sum + v.students.length, 0)
}

/**
 * Coach-Energie (DESIGN_SYSTEM.md §5.7):
 * - Wie Eltern-App: funktional, klar, ruhig — keine eigene Designkategorie.
 * - Coach-Emergency-Flag in Rot Kontext 5 (`--color-error-coach`).
 * - Live-Sync via Supabase Realtime bleibt; nur Visualisierung tauscht.
 */
export function CoachDashboard(): JSX.Element {
  const { user } = useAuth()
  const [vms, setVms] = useState<SessionVM[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = (): void => {
    if (!user) return
    setLoading(true)
    void (async () => {
      const [{ data: sessions, error: sErr }, { data: students }] = await Promise.all([
        listSessionsForCoach(user.id),
        listStudentsWithName(),
      ])
      if (sErr) {
        setError(sErr)
        setLoading(false)
        return
      }
      const nameMap = new Map(
        (students ?? []).map((st) => [
          st.id,
          { name: st.full_name ?? 'Unbenannt', classLevel: st.class_level },
        ]),
      )
      const built: SessionVM[] = []
      for (const session of sessions ?? []) {
        const { data: links } = await getSessionStudents(session.id)
        built.push({
          session,
          students: (links ?? []).map((l) => ({
            student_id: l.student_id,
            name: nameMap.get(l.student_id)?.name ?? 'Unbenannt',
            classLevel: nameMap.get(l.student_id)?.classLevel ?? null,
            attendance: l.attendance,
          })),
        })
      }
      setVms(built)
      setLoading(false)
    })()
  }

  useEffect(load, [user])

  const onAttendance = async (
    sessionId: string,
    studentId: string,
    a: AttendanceStatus,
  ): Promise<void> => {
    const { error: err } = await setAttendance(sessionId, studentId, a)
    if (err) {
      setError(err)
      return
    }
    load()
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)]">
      <EdvanceNavbar subtitle="Coach-Dashboard" sticky />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Guten Tag 👋</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-tertiary)]">{formatDateLongDe()}</p>
        </div>

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
          Schnellzugriff
        </h2>
        <div className="mb-8">
          <DashboardTiles
            tiles={[
              {
                to: '/coach/intake',
                icon: <ClipboardList className="h-5 w-5" />,
                title: 'Erstgespräch-Protokoll',
                description: 'Strukturiertes Erstgespräch erfassen und finalisieren',
              },
              {
                to: '/coach/screening-results',
                icon: <FlaskConical className="h-5 w-5" />,
                title: 'Screening-Ergebnisse',
                description: 'Lernstand-Diagnose begleiten und bewerten',
              },
              {
                to: '/coach/reports',
                icon: <Inbox className="h-5 w-5" />,
                title: 'Reports',
                description: 'Coach-Einschätzungen verfassen und freigeben',
              },
            ]}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Sessions heute"
            value={vms.length}
            icon="📅"
            color="var(--color-primary)"
          />
          <StatCard
            label="Aktive Schüler"
            value={totalActiveStudents(vms)}
            icon="👥"
            color="var(--color-success-eltern)"
          />
          <StatCard
            label="Nächste Session"
            value={nextUpcomingTime(vms)}
            icon="⏰"
            color="var(--color-gold-warning)"
          />
        </div>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Deine Sessions
        </h2>
        {error && <p className="mb-3 text-sm text-[var(--color-error-coach)]">{error}</p>}
        {loading ? (
          <LoadingPulse type="list" lines={3} />
        ) : vms.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Keine Sessions"
            description="Es sind noch keine Sessions für dich angelegt."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {vms.map((vm) => (
              <SessionCard
                key={vm.session.id}
                vm={vm}
                onAttendance={(sid, a) => onAttendance(vm.session.id, sid, a)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
