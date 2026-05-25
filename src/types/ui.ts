import type { ReactNode } from 'react'
import type { UserRole } from './auth'
import type { AttendanceStatus } from './student'

export const THEMES = ['edvance', 'ocean', 'forest', 'sunset'] as const
export type Theme = (typeof THEMES)[number]
export type ThemeColors = { primary: string; light: string; dark: string }

export type ProtectedRouteProps = {
  allowedRoles: UserRole[]
  children: ReactNode
}

export type AvatarProps = {
  initials: string
  attendance?: AttendanceStatus
  className?: string
}

export type BadgeVariant =
  | 'active' | 'done' | 'upcoming'
  | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'celebration'

export type BadgeProps = {
  variant: BadgeVariant
  className?: string
  children?: ReactNode
}

export type SupabaseResult<T> = {
  data: T | null
  error: string | null
}
