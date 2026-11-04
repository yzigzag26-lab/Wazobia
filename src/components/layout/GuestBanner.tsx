import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/hooks/useSession'

/**
 * Persistent guest indicator.
 *
 * Blueprint brief §5 requires a *visible* guest indicator, a clear route to
 * create an account, and a way to exit the guest session. It also states plainly
 * that guest state is local and grants no privilege — so this banner says exactly
 * that rather than implying a real account.
 */
export function GuestBanner() {
  const { isGuest, endSession } = useSession()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  if (!isGuest || dismissed) return null

  return (
    <div className="border-b border-gold-300 bg-gold-100">
      <div className="mx-auto flex w-full max-w-[74rem] flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 lg:px-10">
        <p className="text-[0.8125rem] leading-5 text-forest-900">
          <span className="mr-2 inline-flex items-center rounded-[2px] border border-gold-600 bg-paper-50 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-forest-900">
            Guest
          </span>
          You are exploring as a guest. Progress, favourites and contributions are not saved to an
          account.
        </p>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to="/signup"
            className="rounded-[var(--radius-sm)] px-2 py-1 text-[0.8125rem] font-medium text-forest-900 underline underline-offset-4 hover:text-forest-700"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="rounded-[var(--radius-sm)] px-2 py-1 text-[0.8125rem] font-medium text-forest-900 underline underline-offset-4 hover:text-forest-700"
          >
            Log in
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              endSession()
              navigate('/', { replace: true })
            }}
          >
            Exit guest
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="grid size-7 place-items-center rounded-[var(--radius-sm)] text-forest-800 hover:bg-white hover:text-forest-900"
            aria-label="Dismiss guest notice"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
