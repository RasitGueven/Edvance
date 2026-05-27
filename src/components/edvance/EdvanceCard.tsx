import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EdvanceCardProps {
  children: ReactNode
  variant?: 'default' | 'raised' | 'navy' | 'blue-pale' | 'hero' | 'glass' | 'premium'
  accent?: 'none' | 'left-primary' | 'left-success' | 'left-warning' | 'left-destructive'
  className?: string
  onClick?: () => void
}

export function EdvanceCard({
  children,
  variant = 'default',
  accent = 'none',
  className,
  onClick,
}: EdvanceCardProps) {
  const variantStyles: Record<string, string> = {
    default:    'bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-xs',
    raised:     'bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-md',
    navy:       'bg-[var(--color-primary)] text-[var(--color-bg-surface)] border border-[var(--color-primary)] shadow-md',
    'blue-pale':'bg-[var(--color-primary-light)] border border-[var(--color-primary-light)]',
    hero:       'student-hero text-white border-0 shadow-xl',
    glass:      'glass-card shadow-md',
    premium:    'bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-md',
  }

  const accentStyles: Record<string, string> = {
    none:               '',
    'left-primary':     'border-l-4 border-l-[var(--color-primary)]',
    'left-success':     'border-l-4 border-l-[var(--color-success)]',
    'left-warning':     'border-l-4 border-l-[var(--color-gold-warning)]',
    'left-destructive': 'border-l-4 border-l-[var(--color-error-exam)]',
  }

  const isInteractive = !!onClick
  const isDark = variant === 'navy' || variant === 'hero'

  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] p-6',
        variantStyles[variant],
        accentStyles[accent],
        !isDark && 'transition-all duration-300 hover:shadow-lg',
        isInteractive && 'cursor-pointer hover-lift',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
