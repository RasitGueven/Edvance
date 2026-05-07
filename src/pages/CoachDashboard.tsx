import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { mockSessions, type MockSession } from '@/lib/mockData'
import { CalendarDays, Users, Clock } from 'lucide-react'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate() {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function nextUpcomingTime(sessions: MockSession[]) {
  const next = sessions.find((s) => s.status === 'upcoming')
  return next ? next.time + ' Uhr' : '–'
}

function totalActiveStudents(sessions: MockSession[]) {
  return sessions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.students.length, 0)
}

const statusBorderColor: Record<MockSession['status'], string> = {
  active: 'border-l-success',
  done: 'border-l-border',
  upcoming: 'border-l-primary',
}

const statusBg: Record<MockSession['status'], string> = {
  active: 'bg-success/5',
  done: 'bg-card',
  upcoming: 'bg-card',
}

export function CoachDashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3"
        style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}
          >
            E
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Edvance</p>
            <p className="text-xs text-muted leading-tight">Coach-Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:block">{user?.email}</span>
          <Button variant="outline" onClick={signOut}>
            Abmelden
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Datum */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Guten Tag 👋</h1>
          <p className="mt-0.5 text-sm text-muted">{formatDate()}</p>
        </div>

        {/* Stat Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card style={{ boxShadow: '0 1px 6px 0 rgba(0,0,0,0.07)' }}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--primary)/10', backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
              >
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Sessions heute</p>
                <p className="mt-0.5 text-3xl font-bold text-foreground">{mockSessions.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: '0 1px 6px 0 rgba(0,0,0,0.07)' }}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'color-mix(in srgb, var(--success) 12%, transparent)' }}
              >
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Aktive Schüler</p>
                <p className="mt-0.5 text-3xl font-bold text-foreground">{totalActiveStudents(mockSessions)}</p>
              </div>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: '0 1px 6px 0 rgba(0,0,0,0.07)' }}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 12%, transparent)' }}
              >
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Nächste Session</p>
                <p className="mt-0.5 text-3xl font-bold text-foreground">{nextUpcomingTime(mockSessions)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session List */}
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Heutige Sessions</h2>
        <div className="flex flex-col gap-4">
          {mockSessions.map((session) => (
            <Card
              key={session.id}
              className={`border-l-4 ${statusBorderColor[session.status]} ${statusBg[session.status]}`}
              style={{ boxShadow: session.status === 'active' ? '0 2px 12px 0 rgba(15,110,86,0.10)' : '0 1px 6px 0 rgba(0,0,0,0.07)' }}
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
                {/* Schülerliste */}
                <div className="mb-5 flex flex-wrap gap-3">
                  {session.students.map((student) => (
                    <div key={student.id} className="flex items-center gap-2">
                      <Avatar
                        initials={getInitials(student.name)}
                        attendance={student.attendance}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {student.name.split(' ')[0]}
                        </p>
                        <p className="text-xs text-muted leading-tight">Kl. {student.class_level}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legende + Button */}
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                  <div>
                    {session.status === 'active' && <Button>Session öffnen</Button>}
                    {session.status === 'upcoming' && <Button variant="outline">Vorbereiten</Button>}
                    {session.status === 'done' && (
                      <Button variant="outline" disabled>Protokoll ansehen</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
