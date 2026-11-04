import { NavLink } from 'react-router-dom'
import { WazobiaLogo } from '@/components/brand/WazobiaLogo'
import {
  IconPanelCollapse,
  IconPanelExpand,
  IconSearch,
} from '@/components/ui/icons'
import { brand } from '@/config/brand'
import { DESTINATIONS } from '@/config/destinationRegistry'
import { cn } from '@/utils/cn'
import { LanguageSwitcher } from './LanguageSwitcher'

export interface SidebarProps {
  readonly collapsed: boolean
  readonly onToggleCollapsed: () => void
  readonly className?: string
}

/**
 * Desktop / laptop navigation (blueprint §5.1).
 *
 * Persistent and collapsible. When collapsed, destinations keep their icon and
 * gain a `title`-based accessible name plus a native tooltip via `title`, so the
 * control never becomes unlabelled. Collapse state is a presentation
 * preference and does not affect routing.
 */
export function Sidebar({ collapsed, onToggleCollapsed, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-paper-200 bg-paper-50 lg:flex',
        'transition-[width] duration-200',
        collapsed ? 'w-[var(--spacing-sidebar-collapsed)]' : 'w-[var(--spacing-sidebar)]',
        className,
      )}
      aria-label="Primary"
    >
      {/* Brand */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-paper-200',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        <NavLink
          to="/"
          className="flex items-center rounded-[var(--radius-sm)]"
          aria-label="WAZOBIA — home"
        >
          <WazobiaLogo variant="emblem" height={collapsed ? 28 : 34} decorative />
        </NavLink>

        {!collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-ink-500 hover:bg-paper-200 hover:text-ink-900"
            aria-label="Collapse navigation"
            aria-expanded
          >
            <IconPanelCollapse width={18} height={18} />
          </button>
        ) : null}
      </div>

      {/* Search entry point — disabled until the search endpoint exists. */}
      <div className={cn('pt-3', collapsed ? 'px-2' : 'px-3')}>
        <button
          type="button"
          disabled
          title="Search will be available once the dictionary service is connected"
          className={cn(
            'flex w-full items-center gap-2 rounded-[var(--radius-sm)] border border-paper-300 bg-white text-ink-400',
            'disabled:cursor-not-allowed',
            collapsed ? 'justify-center px-0 py-2' : 'px-2.5 py-1.5',
          )}
        >
          <IconSearch width={16} height={16} />
          {!collapsed ? (
            <>
              <span className="text-[0.8125rem]">Search</span>
              <span className="ml-auto rounded-[2px] border border-paper-300 px-1 py-0.5 text-[0.625rem] tracking-wide">
                soon
              </span>
            </>
          ) : null}
        </button>
      </div>

      {/* Destinations */}
      <nav className={cn('mt-1 flex-1 overflow-y-auto pb-4', collapsed ? 'px-2' : 'px-3')}>
        <h2
          className={cn(
            'mb-1.5 mt-4 px-2 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-400',
            collapsed && 'sr-only',
          )}
        >
          Destinations
        </h2>
        <ul className="space-y-0.5">
          {DESTINATIONS.map((destination) => (
            <li key={destination.id}>
              <NavLink
                to={destination.href}
                title={collapsed ? destination.name : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2.5 rounded-[var(--radius-sm)] py-2 text-[0.84375rem]',
                    'transition-colors duration-100',
                    collapsed ? 'justify-center px-0' : 'px-2',
                    isActive
                      ? 'bg-white font-medium text-ink-900 shadow-[inset_0_0_0_1px_var(--color-paper-300)]'
                      : 'text-ink-600 hover:bg-paper-200 hover:text-ink-900',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-forest-700 transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span
                      className={cn(
                        'shrink-0 [&>svg]:size-[18px]',
                        isActive ? 'text-forest-800' : 'text-ink-400 group-hover:text-ink-600',
                      )}
                    >
                      {destination.icon}
                    </span>
                    {!collapsed ? (
                      <span className="min-w-0 flex-1 leading-[1.25]">{destination.name}</span>
                    ) : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer: language preference + collapse control */}
      <div className={cn('shrink-0 border-t border-paper-200 py-3', collapsed ? 'px-2' : 'px-3')}>
        <LanguageSwitcher
          id="sidebar-language"
          variant={collapsed ? 'compact' : 'full'}
          className="mb-2.5"
        />
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="grid size-8 w-full place-items-center rounded-[var(--radius-sm)] text-ink-500 hover:bg-paper-200 hover:text-ink-900"
            aria-label="Expand navigation"
            title="Expand navigation"
            aria-expanded={false}
          >
            <IconPanelExpand width={18} height={18} />
          </button>
        ) : (
          <p className="px-1 text-[0.6875rem] leading-4 text-ink-400">{brand.descriptor}</p>
        )}
      </div>
    </aside>
  )
}
