import { Link } from 'react-router-dom'
import { WazobiaLogo } from '@/components/brand/WazobiaLogo'

/**
 * Compact phone header. Keeps the brand visible on small screens while the
 * bottom bar carries navigation (blueprint §5.1).
 */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-paper-200 bg-paper-50/95 px-4 backdrop-blur-sm lg:hidden">
      <Link to="/" aria-label="WAZOBIA — home" className="flex items-center">
        <WazobiaLogo variant="emblem" height={34} decorative />
      </Link>
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-400">
        Nigeria
      </span>
    </header>
  )
}
