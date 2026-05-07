import { cn } from '@/lib/utils'

type BadgeVariant = 'active' | 'done' | 'upcoming'

const variantStyles: Record<BadgeVariant, string> = {
  active: 'bg-success/15 text-success border-success/30',
  done: 'bg-muted/20 text-muted border-border',
  upcoming: 'bg-primary/10 text-primary border-primary/30',
}

const variantLabels: Record<BadgeVariant, string> = {
  active: 'Aktiv',
  done: 'Abgeschlossen',
  upcoming: 'Geplant',
}

type BadgeProps = {
  variant: BadgeVariant
  className?: string
}

export function Badge({ variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantStyles[variant],
        className,
      )}
    >
      {variantLabels[variant]}
    </span>
  )
}
