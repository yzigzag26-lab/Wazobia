import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface PageHeaderProps {
  readonly eyebrow?: ReactNode
  readonly title: string
  readonly description?: ReactNode
  readonly actions?: ReactNode
  readonly className?: string
}

/**
 * Standard page heading block. Enforces one h1 per page, one measure for the
 * description, and a consistent rhythm across all eight destinations.
 */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('border-b border-paper-200 pb-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[1.875rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2.5 max-w-[58ch] text-[0.9375rem] leading-7 text-ink-600">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2 sm:pt-0.5">{actions}</div> : null}
      </div>
    </header>
  )
}
