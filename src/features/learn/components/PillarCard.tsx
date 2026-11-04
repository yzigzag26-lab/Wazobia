import { Link } from 'react-router-dom'
import { IconChevronRight } from '@/components/ui/icons'
import { cn } from '@/utils/cn'
import type { Pillar } from '../pillars'

export interface PillarCardProps {
  readonly pillar: Pillar
  readonly className?: string
}

/**
 * One of the four Learn cards.
 *
 * Requirements this satisfies, deliberately:
 *
 *  - **Rectangular and consistent.** Every card is a `<Link>` with the same
 *    internal rhythm: icon tile, title, description, meta line. Heights match
 *    because the description is `flex-1` and the grid rows stretch.
 *  - **Illustrated.** The icon tile is a drawn SVG glyph, not a photograph:
 *    stock imagery here would be visual noise that says nothing about the
 *    content (and would be dishonest — these are not photographs of our
 *    material).
 *  - **Accessible.** A real link, so it is in the tab order, announces as a link
 *    with its own name, and works with Enter. The heading inside is the link's
 *    accessible name, so screen-reader users hear "Lessons" rather than
 *    "Open". Focus is visible via the shared ring token.
 *  - **Not a fake button.** No `onClick` on a div, no `role="button"`.
 */
export function PillarCard({ pillar, className }: PillarCardProps) {
  return (
    <Link
      to={pillar.href}
      className={cn(
        'group relative flex h-full flex-col rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5',
        'transition-[border-color,background-color,box-shadow] duration-150',
        'hover:border-forest-400 hover:shadow-[0_1px_0_0_var(--color-paper-300)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)]',
          'border border-paper-300 bg-paper-100 text-forest-800',
          'transition-colors duration-150 group-hover:border-forest-300 group-hover:bg-forest-50',
        )}
      >
        {pillar.icon}
      </span>

      <h3 className="mt-4 text-[1.0625rem] font-semibold leading-6 tracking-[-0.01em] text-ink-900">
        {pillar.title}
      </h3>

      <p className="mt-2 flex-1 text-[0.875rem] leading-6 text-ink-600">{pillar.description}</p>

      <span className="mt-4 flex items-center justify-between gap-3 border-t border-paper-200 pt-3">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-400">
          {pillar.meta}
        </span>
        <IconChevronRight
          width={15}
          height={15}
          className="shrink-0 text-ink-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-forest-700"
        />
      </span>
    </Link>
  )
}
