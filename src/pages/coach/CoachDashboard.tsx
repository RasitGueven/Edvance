import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EdvanceNavbar } from '@/components/edvance/EdvanceNavbar'
import { MOCK_SESSIONS } from '@/lib/mockData'
import { formatDateLongDe, getInitials } from '@/lib/utils'
import { CalendarDays, Users, Clock } from 'lucide-react'
import type { MockSession, SessionStatus } from '@/types'

const PLACEHOLDER_DASH = '–'
const SHADOW_CARD = '0 1px 6px 0 rgba(0,0,0,0.07)'
const SHADOW_ACTIVE = '0 2px 12px 0 rgba(15,110,86,0.10)'
const ICON_BG_PRIMARY = 'color-mix(in srgb, var(--primary) 12%, transparent)'
const ICON_BG_SUCCESS = 'color-mix(in srgb, var(--success) 12%, transparent)'
const ICON_BG_WARNING = 'color-mix(in srgb, var(--warning) 12%, transparent)'

const STATUS_BORDER_COLOR: Record<SessionStatus, string> = {
  active: 'border-l-success',
  done: 'border-l-border',
  upcoming: 'border-l-primary',
}

const STATUS_BG: Record<SessionStatus, string> = {
  active: 'bg-success/5',
  done: 'bg-card',
  upcoming: 'bg-card',
}

function nextUpcomingTime(sessions: MockSession[]): string {
  const next = sessions.find((session) => session.status === 'upcoming')
  return next ? `${next.time} Uhr` : PLACEHOLDER_DASH
}

function totalActiveStudents(sessions: MockSession[]): number {
  return sessions
    .filter((session) => session.status === 'active')
    .reduce((sum, session) => sum + session.students.length, 0)
}

function sessionShadow(status: SessionStatus): string {
  return status === 'active' ? SHADOW_ACTIVE : SHADOW_CARD
}

function SessionActionButton({ status }: { status: SessionStatus }): JSX.Element | null {
  if (status === 'active') return <Button>Session öffnen</Button>
  if (status === 'upcoming') return <Button variant="outline">Vorbereiten</Button>
  return <Button variant="outline" disabled>Protokoll ansehen</Button>
}

function AttendanceLegend(): JSX.Element {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full bg-success inline-block" /> Anwesend
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive inline-block" /> Fehlt
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full bg-muted inline-block" /> Unbekannt
      </span>
    </div>
  )
}

type StatCardProps = {
  label: string
  value: string | number
  icon: JSX.Element
  iconBackground: string
}

function StatCard({ label, value, icon, iconBackground }: StatCardProps): JSX.Element {
  return (
    <Card style={{ boxShadow: SHADOW_CARD }}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBackground }}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-0.5 text-3xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionCard({ session }: { session: MockSession }): JSX.Element {
  return (
    <Card
      className={`border-l-4 ${STATUS_BORDER_COLOR[session.status]} ${STATUS_BG[session.status]}`}
      style={{ boxShadow: sessionShadow(session.status) }}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-foreground">{session.time} Uhr</span>
            <Badge variant={session.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>{session.room}</span>
            <span>·</span>
            <span>{session.students.length} Schüler</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-5 flex flex-wrap gap-3">
          {session.students.map((student) => (
            <div key={student.id} className="flex items-center gap-2">
              <Avatar initials={getInitials(student.name)} attendance={student.attendance} />
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">
                  {student.name.split(' ')[0]}
                </p>
                <p className="text-xs text-muted leading-tight">Kl. {student.classLevel}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <AttendanceLegend />
          <div>
            <SessionActionButton status={session.status} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CoachDashboard(): JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <EdvanceNavbar subtitle="Coach-Dashboard" sticky />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Guten Tag 👋</h1>
            <p className="mt-0.5 text-sm text-muted">{formatDateLongDe()}</p>
          </div>
          <Link
            to="/coach/intake"
            className="text-sm font-medium text-[var(--primary)]"
          >
            Erstgespräch-Protokoll
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Sessions heute"
            value={MOCK_SESSIONS.length}
            icon={<CalendarDays className="h-5 w-5 text-primary" />}
            iconBackground={ICON_BG_PRIMARY}
          />
          <StatCard
            label="Aktive Schüler"
            value={totalActiveStudents(MOCK_SESSIONS)}
            icon={<Users className="h-5 w-5 text-success" />}
            iconBackground={ICON_BG_SUCCESS}
          />
          <StatCard
            label="Nächste Session"
            value={nextUpcomingTime(MOCK_SESSIONS)}
            icon={<Clock className="h-5 w-5 text-warning" />}
            iconBackground={ICON_BG_WARNING}
          />
        </div>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Heutige Sessions
        </h2>
        <div className="flex flex-col gap-4">
          {MOCK_SESSIONS.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </main>
    </div>
  )
}
