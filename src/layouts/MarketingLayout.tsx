import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { WazobiaLogo } from '@/components/brand/WazobiaLogo'
import { brand } from '@/config/brand'
import { DESTINATIONS } from '@/config/destinationRegistry'
import { useSession } from '@/hooks/useSession'
import { cn } from '@/utils/cn'

/** Computed once at module load — calling `new Date()` during render is impure. */
const CURRENT_YEAR = new Date().getFullYear()

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#languages', label: 'Languages' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#preserve', label: 'Preservation' },
]

/**
 * Public marketing shell — used by the landing page only.
 *
 * Deliberately separate from AppShell: the marketing surface is a scrolling
 * document with an anchor-based header, while the application is a fixed
 * navigation frame. Sharing one shell would compromise both.
 */
export function MarketingLayout() {
  const location = useLocation()
  const { isGuest } = useSession()

  /**
   * Reset scroll when the visitor lands on a page without an anchor.
   *
   * `hash` is the only dependency that matters: the marketing shell is not
   * remounted on navigation, so the hash is what changes when a visitor clicks
   * "Languages" and back to a plain `/`. A fresh navigation also clears the
   * hash, which fires this again. `pathname` would be a redundant trigger.
   */
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.hash])

  return (
    <div className="min-h-dvh bg-paper-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-forest-900 focus:px-4 focus:py-2 focus:text-sm focus:text-paper-50"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-paper-200/80 bg-paper-50/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center" aria-label="WAZOBIA — home">
            <WazobiaLogo variant="emblem" height={40} priority decorative />
          </Link>

          <nav aria-label="Sections" className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[0.875rem] font-medium text-ink-600 transition-colors hover:text-forest-800"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden h-9 items-center rounded-[var(--radius-button)] px-3 text-[0.875rem] font-medium text-ink-700 transition-colors hover:bg-paper-200 sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              to={isGuest ? '/app' : '/signup'}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] px-3.5',
                'bg-forest-800 text-[0.875rem] font-medium text-white',
                'transition-colors hover:bg-forest-900',
              )}
            >
              {isGuest ? 'Open WAZOBIA' : 'Create account'}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="border-t border-paper-200 bg-paper-100">
        <div className="mx-auto w-full max-w-[80rem] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <WazobiaLogo variant="emblem" height={44} decorative />
              <p className="mt-4 max-w-[34ch] text-sm leading-6 text-ink-600">
                {brand.positioning}. Built in Nigeria, for Africa — starting with Yorùbá, Hausa and
                Igbo.
              </p>
              <p className="mt-4 font-serif text-sm text-forest-800">{brand.promise}</p>
            </div>

            <FooterColumn
              title="Platform"
              links={DESTINATIONS.slice(0, 4).map((d) => ({ label: d.name, href: d.href, to: true }))}
            />
            <FooterColumn
              title="More"
              links={DESTINATIONS.slice(4).map((d) => ({ label: d.name, href: d.href, to: true }))}
            />
            <FooterColumn
              title="Account"
              links={[
                { label: 'Create free account', href: '/signup', to: true },
                { label: 'Log in', href: '/login', to: true },
                { label: 'Continue as guest', href: '/app', to: true },
              ]}
            />
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-paper-300 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {CURRENT_YEAR} WAZOBIA. The African Language Ecosystem.</p>
            <p className="text-ink-400">
              Built in Nigeria. Designed for every African language that follows.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

interface FooterColumnProps {
  readonly title: string
  readonly links: readonly { readonly label: string; readonly href: string; readonly to?: boolean }[]
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h2 className="text-eyebrow text-ink-500">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              to={link.href}
              className="text-sm text-ink-600 transition-colors hover:text-forest-800"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
