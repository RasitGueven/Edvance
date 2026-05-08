import { cn } from '@/lib/utils'
import type { AttendanceStatus, AvatarProps } from '@/types'

const ATTENDANCE_STYLE: Record<AttendanceStatus, string> = {
  present: 'bg-success',
  absent: 'bg-destructive',
  unknown: 'bg-muted',
}

export function Avatar({ initials, attendance, className }: AvatarProps): JSX.Element {
  const statusClass = attendance ? ATTENDANCE_STYLE[attendance] : undefined

  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shrink-0',
        !statusClass && 'bg-primary',
        statusClass,
        className,
      )}
    >
      {initials}
    </span>
  )
}
