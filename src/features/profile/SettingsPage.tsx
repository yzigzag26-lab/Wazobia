import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { IconBell, IconChevronRight, IconLock, IconShield, IconSun, IconUser } from '@/components/ui/icons'
import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

/**
 * Settings shell.
 *
 * A two-column layout on desktop (list + panel) and a single column on a phone
 * where the list navigates to a sibling route. Both use the same child routes,
 * so there is one implementation of each panel.
 *
 * The list is a real `<nav>` of links, not tabs: these are separate URLs that can
 * be bookmarked and opened directly, and on a phone they behave as pages.
 */

interface SettingLink {
  readonly to: string
  readonly label: string
  readonly description: string
  readonly icon: ReactNode
}

const LINKS: readonly SettingLink[] = [
  {
    to: '/app/profile/settings/appearance',
    label: 'Appearance',
    description: 'Light, dark, or match this device.',
    icon: <IconSun width={17} height={17} />,
  },
  {
    to: '/app/profile/settings/security',
    label: 'Account security',
    description: 'Password and sessions.',
    icon: <IconLock width={17} height={17} />,
  },
  {
    to: '/app/profile/settings/preferences',
    label: 'Profile preferences',
    description: 'Name, language, learning goals.',
    icon: <IconUser width={17} height={17} />,
  },
  {
    to: '/app/profile/settings/notifications',
    label: 'Notifications',
    description: 'What WAZOBIA may email you.',
    icon: <IconBell width={17} height={17} />,
  },
  {
    to: '/app/profile/settings/privacy',
    label: 'Privacy and data',
    description: 'What is stored, and how to delete it.',
    icon: <IconShield width={17} height={17} />,
  },
]

export default function SettingsPage() {
  const location = useLocation()
  const isIndex = location.pathname.replace(/\/$/, '') === '/app/profile/settings'
  const panelRef = useRef<HTMLDivElement>(null)

  /*
   * On a phone the list stacks above the panel, so choosing a section would
   * otherwise leave the reader looking at the menu they just used and thinking
   * nothing happened. Scroll the panel into view when the section changes.
   *
   * Skipped on the index (there is no panel) and on desktop, where list and panel
   * are side by side and scrolling would be a jolt.
   */
  useEffect(() => {
    if (location.pathname.replace(/\/$/, '') === '/app/profile/settings') return
    if (!window.matchMedia('(max-width: 1023px)').matches) return
    // `scrollIntoView` is missing in some embedded webviews and in jsdom. A
    // convenience scroll must never be able to take the page down with it.
    const panel = panelRef.current
    if (panel && typeof panel.scrollIntoView === 'function') {
      panel.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }, [location.pathname])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<span>Profile · Settings</span>}
        title="Settings"
        description="Preferences are stored in this browser. WAZOBIA has no account backend, so nothing here is saved to a server or synced to another device."
      />

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="min-w-0">
          <ul className="space-y-1">
            {LINKS.map((link) => {
              const active = location.pathname === link.to
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-start gap-3 rounded-[var(--radius-md)] border px-3 py-2.5',
                      'transition-colors duration-100',
                      active
                        ? 'border-forest-400 bg-forest-50'
                        : 'border-transparent hover:border-paper-300 hover:bg-paper-100',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 shrink-0',
                        active ? 'text-forest-800' : 'text-ink-400 group-hover:text-ink-600',
                      )}
                    >
                      {link.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.875rem] font-medium text-ink-900">
                        {link.label}
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] leading-5 text-ink-500">
                        {link.description}
                      </span>
                    </span>
                    <IconChevronRight
                      width={14}
                      height={14}
                      className="mt-1 shrink-0 text-ink-300"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div ref={panelRef} className="min-w-0 scroll-mt-20">
          {isIndex ? <SettingsOverview /> : <Outlet />}
        </div>
      </div>
    </div>
  )
}

function SettingsOverview() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6">
      <h2 className="text-[0.9375rem] font-semibold text-ink-900">Choose a section</h2>
      <p className="mt-1.5 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
        Appearance changes the whole interface and applies immediately. Security, notifications and
        privacy describe what WAZOBIA can and cannot do today — there is no password store and no
        mail server, and each page says so rather than showing controls that do nothing.
      </p>
    </div>
  )
}
