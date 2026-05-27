import type { JSX } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EdvanceBadge } from '@/components/edvance'
import { getInitials } from '@/lib/utils'
import type { AttendanceStatus, CoachingSession, SessionStatus } from '@/types'

const PLACEHOLDER_DASH = '–'

const STATUS_BORDER_COLOR: Record<SessionStatus, string> = {
  active:   'border-l-[var(--color-success-eltern)]',
  done:     'border-l-[var(--color-border)]',
  upcoming: 'border-l-[var(--color-primary)]',
}
const STATUS_BG: Record<SessionStatus, string> = {
  active:   'bg-[var(--color-success-eltern-light)]',
  done:     'bg-[var(--color-bg-surface)]',
  upcoming: 'bg-[var(--color-bg-surface)]',
}

export type SessionStudentVM = {
  student_id: string
  name: string
  classLevel: number | null
  attendance: AttendanceStatus
  /** Optional: Notfall-Flag (Stimmung/Lückenbild kritisch) — wird als coach-emergency Badge dargestellt. */
  emergency?: boolean
}

export type SessionVM = {
  session: CoachingSession
  students: SessionStudentVM[]
}

function sessionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

interface SessionCardProps {
  vm: SessionVM
  onAttendance: (studentId: string, a: AttendanceStatus) => void
}

export function SessionCard({ vm, onAttendance }: SessionCardProps): JSX.Element {
  const { session, students } = vm
  return (
    <Card
      className={`border-l-4 ${STATUS_BORDER_COLOR[session.status]} ${STATUS_BG[session.status]} ${
        session.status === 'active' ? 'shadow-md' : 'shadow-xs'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[var(--color-text-primary)]">
              {sessionTime(session.scheduled_at)} Uhr
            </span>
            <Badge variant={session.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
            <span>{session.room ?? PLACEHOLDER_DASH}</span>
            <span>·</span>
            <span>{students.length} Schüler</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="mb-2 text-sm text-[var(--color-text-tertiary)]">Keine Teilnehmer eingetragen.</p>
        ) : (
          <div className="mb-5 flex flex-col gap-3">
            {students.map((s) => (
              <div key={s.student_id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar initials={getInitials(s.name)} attendance={s.attendance} />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">
                      {s.name.split(' ')[0]}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] leading-tight">
                      Kl. {s.classLevel ?? PLACEHOLDER_DASH}
                    </p>
                  </div>
                  {s.emergency && (
                    <EdvanceBadge variant="coach-emergency" className="ml-2">
                      Notfall
                    </EdvanceBadge>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant={s.attendance === 'present' ? 'default' : 'outline'}
                    onClick={() => onAttendance(s.student_id, 'present')}
                  >
                    Da
                  </Button>
                  <Button
                    size="sm"
                    variant={s.attendance === 'absent' ? 'default' : 'outline'}
                    onClick={() => onAttendance(s.student_id, 'absent')}
                  >
                    Fehlt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
