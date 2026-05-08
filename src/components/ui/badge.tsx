import { cn } from '@/lib/utils'
import type { BadgeProps, BadgeVariant } from '@/types'

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  active: 'bg-success/15 text-success border-success/30',
  done: 'bg-muted/20 text-muted border-border',
  upcoming: 'bg-primary/10 text-primary border-primary/30',
}

const VARIANT_LABELS: Record<BadgeVariant, string> = {
  active: 'Aktiv',
  done: 'Abgeschlossen',
  upcoming: 'Geplant',
}

export function Badge({ variant, className }: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {VARIANT_LABELS[variant]}
    </span>
  )
}
