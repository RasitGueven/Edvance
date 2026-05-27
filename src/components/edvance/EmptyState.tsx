import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-4 animate-fade-in">
      <div className="text-5xl leading-none select-none">{icon}</div>
      <div className="flex flex-col gap-2 max-w-xs">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--color-text-tertiary)]">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
