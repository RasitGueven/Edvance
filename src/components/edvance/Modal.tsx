import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Größe — `md` default, `lg` für längere Inhalte, `auto` lässt Inhalt entscheiden. */
  size?: 'md' | 'lg' | 'auto'
  /** `dark` für Effekt-Momente (Boss, Level-Up); `default` für funktionale Inhalte. */
  tone?: 'default' | 'dark'
  className?: string
}

/**
 * Generischer Modal-Container. Für emotionale Momente (Level-Up, Boss,
 * Streak-Repair) gibt es eigene Komponenten in `./moments/`, die diesen Modal
 * als Bühne nutzen können.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  tone = 'default',
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
    md:   'max-w-md',
    lg:   'max-w-xl',
    auto: '',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 animate-fade-in"
      style={{ backgroundColor: 'rgba(20, 33, 61, 0.55)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full rounded-[var(--radius-xl)] p-6 shadow-xl animate-scale-in',
          tone === 'dark'
            ? 'student-hero light-source text-white border-0'
            : 'bg-[var(--color-bg-surface)] border border-[var(--color-border)]',
          sizeClass[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2
            className={cn(
              'text-xl font-bold mb-4',
              tone === 'dark' ? 'text-white' : 'text-[var(--color-text-primary)]',
            )}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
