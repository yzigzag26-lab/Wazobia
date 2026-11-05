import { useLocation, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'

/**
 * The gate in front of the application area.
 *
 * Guest access was removed from WAZOBIA: there is no anonymous session, no
 * "continue as guest", and no browsing of `/app/*` without an account. That
 * decision is stated once, here, rather than repeated as conditionals in every
 * page.
 *
 * Three details that are easy to get wrong:
 *
 *  1. **`loading` is not `signed-out`.** The session is read from localStorage
 *     on first paint. Redirecting during that read would bounce a returning
 *     user to `/login` for a frame on every page load, which looks like being
 *     signed out at random.
 *  2. **`expired` is not `signed-in`.** A token that failed to refresh leaves a
 *     stale entry behind. Treating it as a session would render the app shell
 *     and then fail every request inside it.
 *  3. **The attempted path is remembered.** Being sent back to the page you
 *     asked for after signing in is the difference between a gate and a maze.
 *
 * This is a navigation affordance, not a security boundary. Every protected
 * endpoint verifies the bearer token server-side; a user who edits their way
 * past this component still gets 401 from the API.
 */
export function RequireAuth({ children }: { readonly children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <output className="grid min-h-dvh place-items-center bg-paper-50" aria-live="polite">
        <span className="flex items-center gap-3 text-ink-600">
          <Spinner />
          <span className="text-sm">Checking your session…</span>
        </span>
      </output>
    )
  }

  if (status !== 'signed-in') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <>{children}</>
}
