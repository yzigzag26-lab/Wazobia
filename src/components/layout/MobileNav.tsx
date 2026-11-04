import * as Dialog from '@radix-ui/react-dialog'
import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { WazobiaLogo } from '@/components/brand/WazobiaLogo'
import { IconClose, IconMore } from '@/components/ui/icons'
import {
  PRIMARY_MOBILE_DESTINATIONS,
  SECONDARY_MOBILE_DESTINATIONS,
  STATUS_LABELS,
  STATUS_TONE,
} from '@/config/destinationRegistry'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { LanguageSwitcher } from './LanguageSwitcher'

/**
 * Phone navigation (blueprint §5.1).
 *
 * Four high-frequency destinations in the bottom bar plus a "More" surface for
 * the remaining modules. WAZOBIA AI holds the first slot. The bar never exceeds
 * four destinations and every item keeps a 44px+ touch target.
 */
export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 border-t border-paper-300 bg-paper-50/95 backdrop-blur-sm lg:hidden',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <ul className="grid grid-cols-5">
          {PRIMARY_MOBILE_DESTINATIONS.map((destination) => (
            <li key={destination.id}>
              <NavLink
                to={destination.href}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-[var(--spacing-mobile-nav)] flex-col items-center justify-center gap-1',
                    isActive ? 'text-forest-800' : 'text-ink-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-3 top-0 h-[2px] rounded-full bg-forest-700 transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="[&>svg]:size-[21px]">{destination.icon}</span>
                    <span className="text-[0.625rem] font-medium leading-none">
                      {destination.shortName}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}

          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                'flex h-[var(--spacing-mobile-nav)] w-full flex-col items-center justify-center gap-1',
                SECONDARY_MOBILE_DESTINATIONS.some((d) => location.pathname.startsWith(d.href))
                  ? 'text-forest-800'
                  : 'text-ink-500',
              )}
            >
              <IconMore width={21} height={21} />
              <span className="text-[0.625rem] font-medium leading-none">More</span>
            </button>
          </li>
        </ul>
      </nav>

      <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-900/35 lg:hidden" />
          <Dialog.Content
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-lg border-t border-paper-300 bg-paper-50 lg:hidden',
              'pb-[calc(var(--spacing-mobile-nav)+env(safe-area-inset-bottom))]',
            )}
            aria-describedby="more-nav-description"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-paper-200 bg-paper-50 px-4 py-3">
              <div>
                <Dialog.Title className="font-serif text-[0.9375rem] font-semibold tracking-[0.02em] text-ink-900">
                  Explore WAZOBIA
                </Dialog.Title>
                <Dialog.Description id="more-nav-description" className="mt-0.5 text-xs text-ink-500">
                  The rest of the platform
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-ink-600 hover:bg-paper-200"
                  aria-label="Close"
                >
                  <IconClose width={18} height={18} />
                </button>
              </Dialog.Close>
            </div>

            <div className="px-4 pt-3">
              <LanguageSwitcher id="more-language" />
            </div>

            <ul className="mt-3 divide-y divide-paper-200 border-t border-paper-200">
              {SECONDARY_MOBILE_DESTINATIONS.map((destination) => (
                <li key={destination.id}>
                  <Dialog.Close asChild>
                    <NavLink
                      to={destination.href}
                      className="flex items-start gap-3 px-4 py-3.5 active:bg-paper-200"
                    >
                      <span className="mt-0.5 shrink-0 text-ink-400 [&>svg]:size-[20px]">
                        {destination.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium text-ink-900">{destination.name}</span>
                          {destination.status !== 'available' ? (
                            <Badge tone={STATUS_TONE[destination.status]}>
                              {STATUS_LABELS[destination.status]}
                            </Badge>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-ink-500">
                          {destination.summary}
                        </span>
                      </span>
                    </NavLink>
                  </Dialog.Close>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between px-4 py-4">
              <WazobiaLogo variant="emblem" height={30} decorative />
              <span className="text-[0.6875rem] text-ink-400">v0.1.0 · foundation</span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
