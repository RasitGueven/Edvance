import { cn, getInitials } from '@/lib/utils'

interface AvatarInitialsProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'auto' | string
}

const AVATAR_PALETTE = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-gold-warning)',
  'var(--color-repair)',
  'var(--color-accent-streak)',
  'var(--color-primary)',
  'var(--color-error-exam)',
  'var(--color-success)',
]

function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

export function AvatarInitials({ name, size = 'md', color = 'auto' }: AvatarInitialsProps) {
  const bg = color === 'auto' ? nameToColor(name) : color

  const sizeStyles: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  }

  return (
    <div
      className={cn(
        'flex-none flex items-center justify-center rounded-[var(--radius-full)] font-bold text-white select-none',
        sizeStyles[size],
      )}
      style={{ backgroundColor: bg }}
      title={name}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  )
}
