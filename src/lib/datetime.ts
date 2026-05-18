// UTC in DB -> Anzeige Europe/Berlin (CLAUDE.md §10).
export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}
