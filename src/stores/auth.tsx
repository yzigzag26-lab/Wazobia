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
import type { Profile, ProfileUpdate } from '@/services/contracts/endpoints'
import { useProfile } from '@/hooks/useProfile'
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
  /**
   * A problem that affects the signed-in experience without ending the session.
   *
   * Distinct from `status: 'expired'` on purpose. "Your session ended" and "you
   * are signed in but the server is unhappy" call for different UI, and
   * conflating them is what sent users round the sign-in loop.
   */
  readonly sessionError: string | null
}

const INITIAL: State = {
  status: 'loading',
  session: null,
  profile: null,
  sessionError: null,
}

/**
 * Abort a profile request that takes too long.
 *
 * 8 seconds is generous for a row lookup. `signIn` awaits the profile before
 * returning, so an unbounded request here keeps the login button on
 * "Signing in…" while the user is, in fact, already authenticated — the
 * "loads but never arrives" symptom.
 *
 * The race is explicit rather than relying on the AbortSignal alone: a signal
 * only helps if the callee honours it.
 */
const PROFILE_TIMEOUT_MS = 8_000

function withProfileTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = globalThis.setTimeout(() => {
      reject(new Error('profile lookup timed out'))
    }, PROFILE_TIMEOUT_MS)
  })

  return Promise.race([work, deadline]).finally(() => {
    if (timer !== undefined) globalThis.clearTimeout(timer)
  })
}

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  // The device-local store still holds the onboarding answers (there is no
  // server table for them) and a mirror of the name used by Learn surfaces.
  const { setDetails: setLocalDetails } = useProfile()
  const [state, setState] = useState<State>(INITIAL)
  const [tick, setTick] = useState(0)
  // Guards against two requests refreshing the same expired token at once.
  const refreshing = useRef<Promise<AuthSession | null> | null>(null)

  /**
   * Restore on first paint.
   *
   * An expired *access* token is not an expired *session*. Supabase issues a
   * refresh token alongside it, and the previous version of this effect marked
   * such a session `expired` and sent the user to /login — where signing in
   * "worked" but bounced straight back, because the stored session was never
   * refreshed. Refreshing here is the difference between a returning user
   * landing in the app and landing on a sign-in form that appears broken.
   */
  useEffect(() => {
    let cancelled = false

    async function restore() {
      const stored = readStoredSession()

      if (stored === null) {
        if (!cancelled) setState({ status: 'signed-out', session: null, profile: null, sessionError: null })
        return
      }

      if (!isExpired(stored)) {
        if (!cancelled) {
          setState({ status: 'signed-in', session: stored, profile: null, sessionError: null })
        }
        return
      }

      // Expired access token: spend the refresh token before giving up.
      if (stored.refreshToken.length === 0) {
        clearStoredSession()
        if (!cancelled) setState({ status: 'signed-out', session: null, profile: null, sessionError: null })
        return
      }

      try {
        const fresh = await authService.refresh(stored.refreshToken)
        if (!cancelled) setState({ status: 'signed-in', session: fresh, profile: null, sessionError: null })
      } catch {
        // `authService.refresh` already clears storage on failure. That is a
        // real sign-out: the refresh token was rejected or the network is down
        // and we cannot prove the session.
        if (!cancelled) setState({ status: 'signed-out', session: null, profile: null, sessionError: null })
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Load the profile for a session.
   *
   * Bounded by a timeout on purpose. `signIn` awaits this before returning, so
   * a `/users/me` request that never settles would keep the login form on
   * "Signing in…" indefinitely — the session is valid, but the user never
   * arrives. A profile is decoration; failing to load one must never block
   * navigation.
   */
  const fetchProfile = useCallback(async (session: AuthSession | null) => {
    if (session === null) return
    try {
      const profile = await withProfileTimeout(
        userService.me(session.accessToken, AbortSignal.timeout(PROFILE_TIMEOUT_MS)),
      )
      setState((current) => ({ ...current, status: 'signed-in', profile, sessionError: null }))
    } catch (error) {
      /*
       * A 401 does NOT by itself mean the session is dead, and treating it that
       * way was actively harmful.
       *
       * Supabase had just issued this token, so a 401 here is far more likely
       * to be a server-side problem — an endpoint rejecting every token, a
       * mismatched signing configuration, a bad deploy — than a genuinely
       * revoked session. Destroying the session in that case produces a loop
       * the user cannot escape: sign in, land, get bounced to /login, forever.
       *
       * So: keep the session and surface it. `sessionError` is what the UI uses
       * to explain a signed-in-but-unloadable state. Only a token that Supabase
       * itself rejects (during a refresh) is a real sign-out.
       */
      if (error instanceof WazobiaApiError && error.code === 'UNAUTHENTICATED') {
        setState((current) => ({
          ...current,
          status: current.session === null ? 'expired' : 'signed-in',
          sessionError: 'The server could not verify your session. You are still signed in.',
        }))
        return
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
   * Settle the session to a currently-valid token.
   *
   * This is the function every request path waits on. It existed before but was
   * never called — `accessToken` was a `useMemo` over the stored value, so a
   * request could start with a token that had already expired and come back
   * 401. That is the failure mode that looks like "signed in but nothing works".
   *
   * Concurrent callers share one refresh: `refreshing.current` holds the
   * in-flight promise so a page firing three requests does not trigger three
   * refreshes and invalidate its own token (Supabase rotates refresh tokens).
   */
  const settleSession = useCallback(async (): Promise<AuthSession | null> => {
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
        setState({ status: 'signed-out', session: null, profile: null, sessionError: null })
        return null
      } finally {
        refreshing.current = null
      }
    })()

    return refreshing.current
  }, [state.session])

  /**
   * The token to read right now, without waiting.
   *
   * For rendering only. Anything that is about to make a request must call
   * `getAccessToken()` instead, which refreshes first when needed.
   */
  const accessToken = useMemo(() => {
    void tick // re-read after a refresh swaps the session object
    return state.session?.accessToken
  }, [state.session, tick])

  /** Await a valid bearer token, refreshing if the current one is stale. */
  const getAccessToken = useCallback(async (): Promise<string | undefined> => {
    const settled = await settleSession()
    return settled?.accessToken
  }, [settleSession])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await authService.signIn(email, password)
      setState({ status: 'signed-in', session, profile: null, sessionError: null })
      await fetchProfile(session)
    },
    [fetchProfile],
  )

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string, username?: string) => {
      const session = await authService.signUp({
        email,
        password,
        ...(displayName === undefined ? {} : { displayName }),
        ...(username === undefined ? {} : { username }),
      })
      setState({ status: 'signed-in', session, profile: null, sessionError: null })
      await fetchProfile(session)
    },
    [fetchProfile],
  )

  const signOut = useCallback(async () => {
    await authService.signOut(state.session?.accessToken ?? null)
    setState({ status: 'signed-out', session: null, profile: null, sessionError: null })
  }, [state.session])

  const refreshProfile = useCallback(async () => {
    await fetchProfile(state.session)
  }, [fetchProfile, state.session])

  /**
   * Save details to the account and adopt whatever the server stored.
   *
   * The returned profile is the server's row, not the values that were sent.
   * That distinction is the whole point: the previous profile form wrote to
   * `localStorage` and then rendered its own input back as if it were saved, so
   * it could report success for a write that never happened.
   */
  const updateProfile = useCallback(
    async (update: ProfileUpdate): Promise<Profile> => {
      const token = await getAccessToken()
      if (token === undefined) {
        throw new Error('You need to be signed in to save changes.')
      }

      const saved = await userService.update(update, token)
      setState((current) => ({ ...current, profile: saved, sessionError: null }))
      // Keep the device-local mirror in step so the Learn surfaces, which read
      // the learner's name from it, do not show a stale one.
      setLocalDetails({
        fullName: saved.display_name,
        username: saved.username ?? '',
      })
      return saved
    },
    // `setLocalDetails` is a `useCallback` with no dependencies inside
    // ProfileProvider, so its identity is stable and adding it cannot cause a
    // re-render loop. Listing it is honest; suppressing the rule would hide a
    // real dependency if that ever stopped being true.
    [getAccessToken, setLocalDetails],
  )

  const value = useMemo<AuthValue>(
    () => ({
      status: state.status,
      session: state.session,
      profile: state.profile,
      isSignedIn: state.status === 'signed-in' && state.session !== null,
      sessionError: state.sessionError,
      accessToken,
      getAccessToken,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [
      state,
      accessToken,
      getAccessToken,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
    ],
  )

  // Keep the token fresh while a page is open. 60 s is well inside the margin
  // `isExpired` uses, so a request that starts after this tick always finds a
  // usable token.
  useEffect(() => {
    if (state.session === null) return
    const id = globalThis.setInterval(() => {
      void settleSession()
    }, 60_000)
    return () => {
      globalThis.clearInterval(id)
    }
  }, [state.session, settleSession])

  return <AuthContext value={value}>{children}</AuthContext>
}
