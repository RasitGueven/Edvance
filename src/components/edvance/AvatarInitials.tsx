import { cn } from '@/lib/utils'

const AVATAR_PALETTE = [
  '#2D6A9F', '#0F6E56', '#D97706', '#7C3AED',
  '#EA580C', '#0E7490', '#BE185D', '#065F46',
]

function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

interface AvatarInitialsProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'auto' | string
}

const sizeStyles: Record<string, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

export function AvatarInitials({ name, size = 'md', color = 'auto' }: AvatarInitialsProps) {
  const bg = color === 'auto' ? nameToColor(name) : color

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
