import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { StudentWithName } from '@/types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const MAX_INITIALS = 2

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, MAX_INITIALS)
}

export function formatDateLongDe(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** Einheitliches Anzeigeformat für Schüler-Auswahllisten. */
export function studentSelectLabel(s: StudentWithName): string {
  return `${s.full_name ?? 'Unbenannt'}${s.class_level ? ` · Kl. ${s.class_level}` : ''}`
}
