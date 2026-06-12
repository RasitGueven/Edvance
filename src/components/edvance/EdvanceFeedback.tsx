// Feedback components: EmptyState, LoadingPulse, ToastBanner.
// Extracted from index.tsx to stay within 400-line limit.
import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-4 animate-fade-in">
      <div className="text-5xl leading-none select-none">{icon}</div>
      <div className="flex flex-col gap-2 max-w-xs">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─── LoadingPulse ─────────────────────────────────────────────────────────────

interface LoadingPulseProps {
  lines?: number
  type?: 'card' | 'list' | 'stat'
}

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn('rounded-[var(--radius-md)] bg-[var(--border)] animate-skeleton', className)}
      style={style}
    />
  )
}

export function LoadingPulse({ lines = 3, type = 'list' }: LoadingPulseProps) {
  if (type === 'card') {
    return (
      <div className="rounded-[var(--radius-xl)] p-6 border border-[var(--border)] shadow-card bg-[var(--surface)]">
        <SkeletonBlock className="h-5 w-1/2 mb-4" />
        <SkeletonBlock className="h-4 w-full mb-2" />
        <SkeletonBlock className="h-4 w-3/4 mb-2" />
        <SkeletonBlock className="h-4 w-5/6" />
      </div>
    )
  }

  if (type === 'stat') {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-xl)] p-6 border border-[var(--border)] shadow-card bg-[var(--surface)] flex items-start gap-3"
          >
            <SkeletonBlock className="w-12 h-12 rounded-[var(--radius-lg)] flex-none" />
            <div className="flex-1 flex flex-col gap-2">
              <SkeletonBlock className="h-8 w-16" />
              <SkeletonBlock className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBlock className="w-10 h-10 rounded-[var(--radius-full)] flex-none" />
          <div className="flex-1 flex flex-col gap-1.5">
            <SkeletonBlock
              className="h-3.5"
              style={{ width: `${70 + (i % 3) * 10}%` } as React.CSSProperties}
            />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ToastBanner ──────────────────────────────────────────────────────────────

interface ToastBannerProps {
  type: 'success' | 'xp' | 'levelup' | 'warning' | 'error'
  message: string
  xpAmount?: number
  onClose?: () => void
}

const TOAST_CLASS: Record<string, string> = {
  success: 'toast-success',
  xp:      'toast-xp',
  levelup: 'toast-levelup',
  warning: 'toast-warning',
  error:   'toast-error',
}

const TOAST_ICON: Record<string, string> = {
  success: '✓',
  xp:      '🎉',
  levelup: '⬆️',
  warning: '⚠️',
  error:   '✕',
}

export function ToastBanner({ type, message, xpAmount, onClose }: ToastBannerProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const hideTimer = setTimeout(() => setExiting(true), 2700)
    return () => clearTimeout(hideTimer)
  }, [])

  useEffect(() => {
    if (!exiting) return
    const closeTimer = setTimeout(() => onClose?.(), 200)
    return () => clearTimeout(closeTimer)
  }, [exiting, onClose])

  return (
    <div
      className={cn(
        'fixed top-6 left-1/2 z-50',
        'flex items-center gap-3 px-5 py-3',
        'rounded-[var(--radius-lg)] font-semibold border-[1.5px]',
        '-translate-x-1/2 min-w-[280px] max-w-[480px]',
        'shadow-elevation-lg',
        TOAST_CLASS[type],
        exiting ? 'animate-toast-out' : 'animate-toast-in',
      )}
      role="alert"
    >
      <span className={cn('text-xl leading-none', type === 'xp' && 'text-2xl')}>
        {TOAST_ICON[type]}
      </span>

      <span className="flex-1 text-sm">{message}</span>

      {type === 'xp' && xpAmount !== undefined && (
        <span className="text-xl font-bold leading-none animate-bounce-pop">
          +{xpAmount} XP
        </span>
      )}
    </div>
  )
}
