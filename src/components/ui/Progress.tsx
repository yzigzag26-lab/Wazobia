import { cn } from '@/utils/cn'

export interface ProgressProps {
  /** 0–1. Values outside the range are clamped rather than rendered wrong. */
  readonly value: number
  /** Accessible name. Required: a bare bar announces nothing useful. */
  readonly label: string
  readonly className?: string
  /** Renders the numeric percentage beside the track. */
  readonly showValue?: boolean
  readonly tone?: 'forest' | 'gold'
}

/**
 * Progress bar.
 *
 * `role="progressbar"` with a real `aria-valuenow` is used instead of a styled
 * `<div>` so a screen reader announces position. The visible track and the
 * accessible value are the same number — they cannot disagree.
 */
export function Progress({
  value,
  label,
  className,
  showValue = false,
  tone = 'forest',
}: ProgressProps) {
  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
  const percent = Math.round(clamped * 100)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/*
        A real <progress> element, not a div with role="progressbar": it carries
        the role, the value semantics and the assistive-technology announcement
        natively. It is restyled, not reimplemented.
      */}
      <progress
        value={percent}
        max={100}
        aria-label={label}
        aria-valuetext={`${percent}% complete`}
        className={cn(
          'h-1.5 min-w-0 flex-1 overflow-hidden rounded-full',
          '[&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-paper-200',
          '[&::-webkit-progress-value]:rounded-full',
          '[&::-moz-progress-bar]:rounded-full',
          tone === 'gold'
            ? '[&::-webkit-progress-value]:bg-gold-500 [&::-moz-progress-bar]:bg-gold-500'
            : '[&::-webkit-progress-value]:bg-forest-700 [&::-moz-progress-bar]:bg-forest-700',
        )}
      />
      {showValue ? (
        <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-ink-500">
          {percent}%
        </span>
      ) : null}
    </div>
  )
}
