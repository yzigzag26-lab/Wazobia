import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface StateMessageProps {
  readonly tone?: 'neutral' | 'info' | 'waiting' | 'error'
  readonly icon?: ReactNode
  readonly title: string
  readonly description?: ReactNode
  readonly action?: ReactNode
  readonly className?: string
  /** Rendered beside the title, e.g. an error code for support. */
  readonly meta?: ReactNode
}

const TONES = {
  neutral: 'border-paper-300 bg-white text-ink-700',
  info: 'border-gold-500 bg-gold-100 text-forest-800',
  waiting: 'border-paper-300 bg-paper-100 text-ink-700',
  error: 'border-ember-600/30 bg-ember-100 text-ember-700',
} as const

/**
 * Shared presentation for loading-adjacent and terminal states:
 * empty, unavailable, error.
 *
 * Blueprint §7 of the brief requires loading, success, empty and error states to
 * be handled properly. Centralising the visual language here is what stops each
 * feature from inventing its own variant.
 */
export function StateMessage({
  tone = 'neutral',
  icon,
  title,
  description,
  action,
  className,
  meta,
}: StateMessageProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border px-5 py-5 sm:px-6 sm:py-6',
        TONES[tone],
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        {icon ? <span className="mt-0.5 shrink-0 opacity-85">{icon}</span> : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-semibold leading-6 tracking-[-0.01em]">{title}</h3>
          {description ? (
            <div className="mt-1.5 max-w-prose text-sm leading-6 opacity-85">{description}</div>
          ) : null}
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
      {meta ? <div className="mt-3 font-mono text-[0.6875rem] opacity-60">{meta}</div> : null}
    </div>
  )
}
