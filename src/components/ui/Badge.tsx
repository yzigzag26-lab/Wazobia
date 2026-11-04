import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'neutral' | 'accent' | 'pending' | 'approved' | 'danger' | 'info'

export interface BadgeProps {
  readonly tone?: BadgeTone
  readonly children: ReactNode
  readonly className?: string
  /** Short dot marker instead of a full chip. */
  readonly withDot?: boolean
}

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-paper-200 text-ink-700 border-paper-300',
  accent: 'bg-forest-100 text-forest-900 border-forest-300',
  pending: 'bg-gold-100 text-gold-700 border-gold-600',
  approved: 'bg-forest-100 text-forest-700 border-forest-500',
  danger: 'bg-ember-100 text-ember-700 border-ember-600',
  info: 'bg-gold-100 text-forest-800 border-gold-500',
}

/**
 * Status chip. Used above all for content provenance — the UI must show whether
 * language content is an AI suggestion, pending review, or approved
 * (blueprint §7.5). Never decorative.
 */
export function Badge({ tone = 'neutral', children, className, withDot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-0.5',
        'text-[0.6875rem] font-medium uppercase tracking-[0.06em] whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {withDot ? (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-70" />
      ) : null}
      {children}
    </span>
  )
}
