import { cn } from '@/lib/utils'
import { EdvanceCard } from './Card'

interface StatCardProps {
  value: string | number
  label: string
  icon: string
  trend?: string | null
  color?: string
  className?: string
}

export function StatCard({
  value,
  label,
  icon,
  trend = null,
  color = 'var(--color-primary)',
  className,
}: StatCardProps) {
  const isPositive = trend?.startsWith('+')

  return (
    <EdvanceCard
      className={cn(
        'group flex items-start gap-4 hover:-translate-y-0.5 transition-transform duration-200',
        className,
      )}
    >
      <div
        className="flex-none flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] text-xl shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, white)` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-3xl font-bold leading-none" style={{ color }}>
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold rounded-[var(--radius-sm)] px-2 py-0.5 shrink-0',
                isPositive
                  ? 'bg-[var(--color-success-eltern-light)] text-[var(--color-success-eltern)]'
                  : 'bg-[var(--color-error-gap-light)] text-[var(--color-error-gap)]',
              )}
            >
              {trend}
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1 leading-relaxed">{label}</p>
      </div>
    </EdvanceCard>
  )
}
