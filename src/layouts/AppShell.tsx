import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconInfo } from '@/components/ui/icons'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { useMediaQuery, DESKTOP_QUERY } from '@/hooks/useMediaQuery'
import { isBoolean, usePersistentState } from '@/hooks/usePersistentState'
import { findDestinationByPath } from '@/config/destinationRegistry'
import { brand } from '@/config/brand'
import { cn } from '@/utils/cn'
import { MobileHeader } from './MobileHeader'
import { AccountMenu } from '@/components/layout/AccountMenu'
import { ReviewLink } from '@/components/layout/ReviewLink'

/**
 * The single application shell.
 *
 * Desktop and phone share one content column, one page component and one set of
 * tokens; only the navigation affordance differs. This is what keeps the product
 * feeling like the same interface across devices (blueprint §5.1).
 */
export function AppShell() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [collapsed, setCollapsed] = usePersistentState('sidebar-collapsed', false, isBoolean)
  const location = useLocation()

  /**
   * Move focus to the main landmark on route change for screen-reader users.
   *
   * `location.pathname` is *required* here even though the effect body does not
   * read it: it is the trigger. The shell is not remounted between
   * destinations, so nothing else would re-run this effect and a screen-reader
   * user would be left with focus on a navigation item that no longer matches
   * the page. The rule cannot see that intent, so it is suppressed with reason.
   */
  // oxlint-disable react/exhaustive-effect-dependencies
  useEffect(() => {
    const main = document.getElementById('main-content')
    if (main) main.focus({ preventScroll: true })
  }, [location.pathname])
  // oxlint-enable react/exhaustive-effect-dependencies

  useEffect(() => {
    const destination = findDestinationByPath(location.pathname)
    document.title = destination
      ? `${destination.name} — ${brand.name}`
      : `${brand.name} — ${brand.positioning}`
  }, [location.pathname])

  const { sessionError } = useAuth()

  return (
    <div className="min-h-dvh bg-paper-50">
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50',
          'focus:rounded-[var(--radius-sm)] focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-sm focus:text-on-brand',
        )}
      >
        Skip to content
      </a>

      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed(!collapsed)} />
      <MobileHeader />
      <MobileNav />

      <div
        className={cn(
          'transition-[padding] duration-200',
          isDesktop
            ? collapsed
              ? 'pl-[var(--spacing-sidebar-collapsed)]'
              : 'pl-[var(--spacing-sidebar)]'
            : 'pb-[calc(var(--spacing-mobile-nav)+env(safe-area-inset-bottom))]',
        )}
      >
        {/* Signed-in only from here down, so this strip carries the account
            controls rather than a guest notice. */}
        <div className="border-b border-paper-200 bg-paper-50">
          <div className="mx-auto flex w-full max-w-[74rem] items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-10">
            <ReviewLink />
            <div className="ml-auto">
              <AccountMenu />
            </div>
          </div>
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[74rem] px-[var(--gutter,1rem)] py-7 outline-none sm:px-6 sm:py-9 lg:px-10 lg:py-10"
        >
          {/*
            A signed-in user whose requests are being rejected sees this instead
            of a silent, empty app. Previously that condition ended the session
            and bounced them to /login — a loop with no explanation.
          */}
          {sessionError !== null ? (
            <div className="mb-6">
              <StateMessage
                tone="error"
                icon={<IconInfo width={18} height={18} />}
                title="We could not reach your account"
                description={sessionError}
              />
            </div>
          ) : null}

          <Outlet />
        </main>

        <footer className="mx-auto w-full max-w-[74rem] border-t border-paper-200 px-4 py-6 text-xs text-ink-400 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {brand.name} — {brand.positioning}
            </p>
            <p className="font-serif">{brand.promise}</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
