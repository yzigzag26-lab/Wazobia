import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { guestSessionService, type GuestCapability, type GuestSession } from '@/services/guestSession'
import { SessionContext, type SessionValue } from './sessionContext'

/**
 * Session provider.
 *
 * Today only one kind of session exists: guest. The shape is intentionally the
 * same one real authentication will use later (`kind`, `isGuest`, capabilities),
 * so swapping the internals for Supabase does not change a single consumer.
 *
 * Nothing here claims authentication. `can()` answers capability questions for
 * *public* UI affordances only; the server remains the authorization boundary.
 *
 * This file exports only a component so Fast Refresh works; the hook lives in
 * `useSession.ts` and the context in `sessionContext.ts`.
 */
export function SessionProvider({ children }: { readonly children: ReactNode }) {
  const [session, setSession] = useState<GuestSession | null>(() => guestSessionService.read())

  const startGuestSession = useCallback(() => {
    setSession(guestSessionService.start())
  }, [])

  const endSession = useCallback(() => {
    guestSessionService.end()
    setSession(null)
  }, [])

  const can = useCallback(
    (capability: GuestCapability) => session?.capabilities.includes(capability) ?? false,
    [session],
  )

  const value = useMemo<SessionValue>(
    () => ({
      status: session ? 'guest' : 'anonymous',
      session,
      isGuest: session !== null,
      startGuestSession,
      endSession,
      can,
    }),
    [session, startGuestSession, endSession, can],
  )

  return <SessionContext value={value}>{children}</SessionContext>
}
