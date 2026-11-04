import { NavLink, useLocation } from 'react-router-dom'
import { PRIMARY_MOBILE_DESTINATIONS } from '@/config/destinationRegistry'
import { cn } from '@/utils/cn'

/**
 * Phone navigation.
 *
 * Five destinations, five slots, one row — Learn, Dictionary, AI, Translate,
 * Profile. Because the brief fixes the count at five, the old "More" sheet is
 * gone: there is nothing left to put behind it, and a sheet that only ever
 * contained Profile would have hidden the learner's own account one tap deeper
 * than everything else.
 *
 * Each item keeps a 44px+ touch target and a text label — the icon alone is not
 * an accessible name, and "AI" alone would not distinguish WAZOBIA AI from a
 * generic assistant control.
 */
export function MobileNav() {
  const location = useLocation()

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-paper-300 bg-paper-50 backdrop-blur-sm lg:hidden',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_MOBILE_DESTINATIONS.map((destination) => {
          const active =
            location.pathname === destination.href ||
            location.pathname.startsWith(`${destination.href}/`)

          return (
            <li key={destination.id} className="min-w-0">
              <NavLink
                to={destination.href}
                aria-current={active ? 'page' : undefined}
                className="relative flex h-[var(--spacing-mobile-nav)] flex-col items-center justify-center gap-1"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-3 top-0 h-[2px] rounded-full bg-forest-700 transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'transition-colors [&>svg]:size-[21px]',
                    active ? 'text-forest-800' : 'text-ink-500',
                  )}
                >
                  {destination.icon}
                </span>
                {/*
                  The visible label is shortened ("Dictionary" → "Dict.") so five
                  items fit a 320px screen without horizontal overflow, while the
                  accessible name stays the full destination name.
                */}
                <span
                  className={cn(
                    'max-w-full truncate px-0.5 text-[0.625rem] font-medium leading-none',
                    active ? 'text-forest-800' : 'text-ink-500',
                  )}
                >
                  {destination.shortName}
                </span>
                <span className="sr-only">{destination.name}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
