import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Link to the dictionary review queue, shown only to reviewers.
 *
 * Purely an affordance. `user_roles` is read from the server as part of
 * `/users/me`, and the review endpoint re-checks the role in Postgres — so a
 * user who forges this link in the DOM gets a 403 from the API, not a queue.
 */
export function ReviewLink({ className }: { readonly className?: string }) {
  const { profile } = useAuth()
  const roles = profile?.roles ?? []
  if (!roles.includes('reviewer') && !roles.includes('admin')) return null

  return (
    <Link
      to="/app/review"
      className={
        className ??
        'text-xs font-medium text-forest-700 underline underline-offset-4 hover:text-forest-800'
      }
    >
      Review queue
    </Link>
  )
}
