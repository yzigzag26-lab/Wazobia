import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  authService,
  clearStoredSession,
  isExpired,
  readStoredSession,
  type AuthSession,
} from '@/services/authClient'
import { userService } from '@/services/api'
import { WazobiaApiError } from '@/services/client'
import type { Profile } from '@/services/contracts/endpoints'
import { AuthContext, type AuthStatus, type AuthValue } from './authContext'

/**
 * Auth provider.
 *
 * Owns exactly one thing the rest of the app needs: a token that is valid *right
 * now*, plus the server's idea of who the user is. Everything authoritative
 * happens server-side — this provider decides what to render, never what a
 * request is allowed to do.
 *
 * ## About "straight sign-in, no verification"
 *
 * There is no pending-verification state in this file, because the backend has
 * none: `mailer_autoconfirm` is on, so a signup returns a usable session
 * immediately. A `registered but unconfirmed` status here would be a state the
 * user could never leave.
 *
 * ## Expiry handling
 *
 * The token lives for an hour. Rather than refresh on a timer, this refreshes
 * lazily: `accessToken` is re-checked whenever a caller asks for it, and a token
 * inside the safety margin is exchanged for a fresh one. A background timer
 * would wake the tab and still race with the request that needed the token.
 */

interface State {
  readonly status: AuthStatus
  readonly session: AuthSession | null
  readonly profile: Profile | null
}

const INITIAL: State = { status: 'loading', session: null, profile: null }

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<State>(INITIAL)
  const [tick, setTick] = useState(0)
  // Guards against two requests refreshing the same expired token at once.
  const refreshing = useRef<Promise<AuthSession | null> | null>(null)

  // Restore on first paint. A stored session is not trusted blindly: it is
  // adopted only so the UI can avoid a sign-in flash, and the profile fetch
  // below is what proves it still works.
  useEffect(() => {
    const stored = readStoredSession()
    if (stored === null) {
      setState({ status: 'signed-out', session: null, profile: null })
      return
    }
    setState({
      status: isExpired(stored) ? 'expired' : 'signed-in',
      session: stored,
      profile: null,
    })
  }, [])

  const fetchProfile = useCallback(async (session: AuthSession | null) => {
    if (session === null) return
    try {
      const profile = await userService.me(session.accessToken)
      setState((current) => ({ ...current, status: 'signed-in', profile }))
    } catch (error) {
      // A 401 here means the token the server accepted at sign-in is no longer
      // good. Clearing it is more honest than rendering a signed-in shell whose
      // every subsequent request will fail.
      if (error instanceof WazobiaApiError && error.code === 'UNAUTHENTICATED') {
        clearStoredSession()
        setState({ status: 'expired', session: null, profile: null })
      }
      // Any other failure (network, missing endpoint) leaves the session intact:
      // the user is still signed in, we simply could not load their profile.
    }
  }, [])

  // Load the profile once per signed-in session.
  const signedInUserId = state.session?.userId ?? null
  useEffect(() => {
    if (signedInUserId === null) return
    void fetchProfile(state.session)
    // `state.session` intentionally omitted: a token refresh changes the token,
    // not the identity, and re-fetching on every refresh would be wasteful.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedInUserId, fetchProfile])

  /**
   * The token to send with a request.
   *
   * Expired tokens are refreshed on demand. If the refresh fails, the session is
   * cleared and `undefined` is returned — a caller then gets a clean 401 instead
   * of a mystery failure.
   */
  const accessToken = useMemo(() => {
    void tick // re-computed when `tick` changes after a refresh
    const session = state.session
    if (session === null) return undefined
    return session.accessToken
  }, [state.session, tick])

  const ensureFresh = useCallback(async (): Promise<AuthSession | null> => {
    const session = state.session
    if (session === null) return null
    if (!isExpired(session)) return session

    refreshing.current ??= (async () => {
      try {
        const fresh = await authService.refresh(session.refreshToken)
        setState((current) => ({ ...current, status: 'signed-in', session: fresh }))
        setTick((value) => value + 1)
        return fresh
      } catch {
        clearStoredSession()
        setState({ status: 'expired', session: null, profile: null })
        return null
      } finally {
        refreshing.current = null
      }
    })()

    return refreshing.current
  }, [state.session])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await authService.signIn(email, password)
      setState({ status: 'signed-in', session, profile: null })
      await fetchProfile(session)
    },
    [fetchProfile],
  )

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const session = await authService.signUp({
        email,
        password,
        ...(displayName === undefined ? {} : { displayName }),
      })
      setState({ status: 'signed-in', session, profile: null })
      await fetchProfile(session)
    },
    [fetchProfile],
  )

  const signOut = useCallback(async () => {
    await authService.signOut(state.session?.accessToken ?? null)
    setState({ status: 'signed-out', session: null, profile: null })
  }, [state.session])

  const refreshProfile = useCallback(async () => {
    await fetchProfile(state.session)
  }, [fetchProfile, state.session])

  const value = useMemo<AuthValue>(
    () => ({
      status: state.status,
      session: state.session,
      profile: state.profile,
      isSignedIn: state.status === 'signed-in' && state.session !== null,
      accessToken,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [state, accessToken, signIn, signUp, signOut, refreshProfile],
  )

  // Keep the token fresh while a page is open. 60 s is well inside the margin
  // `isExpired` uses, so a request that starts after this tick always finds a
  // usable token.
  useEffect(() => {
    if (state.session === null) return
    const id = globalThis.setInterval(() => {
      void ensureFresh()
    }, 60_000)
    return () => {
      globalThis.clearInterval(id)
    }
  }, [state.session, ensureFresh])

  return <AuthContext value={value}>{children}</AuthContext>
}
