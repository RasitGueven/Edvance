import { cn } from '@/lib/utils'
import type { AttendanceStatus } from '@/lib/mockData'

const attendanceStyle: Record<AttendanceStatus, string> = {
  present: 'bg-success',
  absent: 'bg-destructive',
  unknown: 'bg-muted',
}

type AvatarProps = {
  initials: string
  attendance?: AttendanceStatus
  className?: string
}

export function Avatar({ initials, attendance, className }: AvatarProps) {
  const base = attendance ? attendanceStyle[attendance] : undefined

  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shrink-0',
        !base && 'bg-primary',
        base,
        className,
      )}
    >
      {initials}
    </span>
  )
}
