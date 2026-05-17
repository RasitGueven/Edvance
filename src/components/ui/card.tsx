/**
 * Card — Primäre Container-Komponente für alle strukturierten Inhalts-Blöcke.
 *
 * Design-Regeln:
 * - moment-bg (#1A2E4A) ist Pflicht-Hintergrund für Celebration-Screens (variant="moment").
 *   Dort nur kurzzeitig verwenden und Level-Up / Boss-Challenge max. 1× pro Session zeigen.
 * - moment-* Farben niemals in dauerhaften Cards — nur als kurzlebige Animationshintergründe.
 * - Nie rohe <div> für Cards verwenden — immer diese Komponente (CLAUDE.md §11).
 *
 * Varianten:
 * - default: weißer Hintergrund, dezenter Rahmen — Standard für alle Screens.
 * - subtle:  leicht getönter Hintergrund, kein Rahmen — für eingebettete Blöcke.
 * - moment:  dunkler Hintergrund (moment-bg) — ausschließlich für Celebration-Screens.
 *
 * Compound-Komponenten (shadcn-kompatibel): CardHeader, CardTitle, CardDescription,
 * CardContent, CardFooter bleiben unverändert für bestehende Verwendung.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

type CardVariant = 'default' | 'subtle' | 'moment'

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-bg-surface border border-border shadow-card',
  subtle:  'bg-bg-subtle',
  moment:  'bg-moment-bg text-white border-0',
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  title?: string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', title, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl p-4', VARIANT_CLASSES[variant], className)}
      {...props}
    >
      {title && (
        <p className="mb-3 text-sm font-medium text-text-primary">{title}</p>
      )}
      {children}
    </div>
  ),
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold leading-none tracking-tight text-text-primary', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-secondary', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
