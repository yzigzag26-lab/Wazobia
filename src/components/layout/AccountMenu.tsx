import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

/**
 * Sign-out control.
 *
 * This did not exist until guest access was removed, and removing guest access
 * is what made it mandatory: previously a visitor could always "exit guest" and
 * the app had no authenticated state to leave. Once `/app/*` requires an
 * account, a missing sign-out turns every shared device into a permanently
 * signed-in one.
 *
 * The label uses the account's display name when there is one, and the email
 * local-part otherwise. It never invents a name.
 */
export function AccountMenu() {
  const { profile, session, signOut } = useAuth()
  const navigate = useNavigate()

  const display =
    profile?.display_name.trim() ||
    session?.email?.split('@')[0] ||
    'your account'

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[16ch] truncate text-sm text-ink-600 sm:inline" title={session?.email ?? undefined}>
        {display}
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          void signOut().then(() => {
            navigate('/', { replace: true })
          })
        }}
      >
        Sign out
      </Button>
    </div>
  )
}
