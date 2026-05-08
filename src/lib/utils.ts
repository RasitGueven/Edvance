import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const MAX_INITIALS = 2

// Erzeugt zwei-Buchstaben-Initialen aus einem vollen Namen, z.B. "Lena Fischer" → "LF".
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, MAX_INITIALS)
}

// Formatiert das aktuelle Datum als deutsche Langform, z.B. "Donnerstag, 8. Mai 2026".
export function formatDateLongDe(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
