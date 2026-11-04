import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { STATUS_LABELS, STATUS_TONE } from '@/config/destinationRegistry'
import type { Destination } from '@/config/destinations'
import { cn } from '@/utils/cn'
import { IconChevronRight } from '@/components/ui/icons'

export interface DestinationCardProps {
  readonly destination: Destination
  readonly className?: string
}

/**
 * Entry card for a destination. Status is stated plainly so the interface never
 * implies a capability that is not connected yet.
 */
export function DestinationCard({ destination, className }: DestinationCardProps) {
  return (
    <Link
      to={destination.href}
      className={cn(
        'group flex h-full flex-col rounded-[var(--radius-md)] border border-paper-300 bg-white p-4',
        'transition-colors hover:border-ink-400 hover:bg-paper-50',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-ink-500 [&>svg]:size-[22px]">{destination.icon}</span>
        <Badge tone={STATUS_TONE[destination.status]}>{STATUS_LABELS[destination.status]}</Badge>
      </div>

      <h3 className="mt-3.5 text-[0.9375rem] font-semibold leading-5 tracking-[-0.01em] text-ink-900">
        {destination.name}
      </h3>
      <p className="mt-1.5 flex-1 text-[0.8125rem] leading-5 text-ink-600">{destination.summary}</p>

      <span className="mt-3 inline-flex items-center gap-1 text-[0.75rem] font-medium text-ink-500 group-hover:text-forest-800">
        Open
        <IconChevronRight
          width={13}
          height={13}
          className="transition-transform duration-100 group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  )
}
