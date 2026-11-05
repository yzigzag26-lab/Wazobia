import { createContext } from 'react'
import type { AuthSession } from '@/services/authClient'
import type { Profile, ProfileUpdate } from '@/services/contracts/endpoints'

/**
 * Auth context — object only, so the provider file exports a component alone and
 * Fast Refresh keeps working (same convention as `sessionContext.ts`).
 *
 * `status` has four values rather than a boolean because "we have not checked
 * yet" is a real state and rendering a sign-in form during it would flash for
 * every returning user.
 */

export type AuthStatus =
  /** Reading the stored session on first paint. */
  | 'loading'
  /** No session. Public pages still work. */
  | 'signed-out'
  /** A session exists and a token is available for requests. */
  | 'signed-in'
  /** A session exists but could not be refreshed; treat as signed out. */
  | 'expired'

export interface AuthValue {
  readonly status: AuthStatus
  readonly session: AuthSession | null
  /** The signed-in user's server-side profile, once fetched. */
  readonly profile: Profile | null
  readonly isSignedIn: boolean
  /**
   * A problem affecting the signed-in experience that does NOT end the session,
   * e.g. the API rejecting a token Supabase considers valid.
   *
   * Shown as a banner rather than treated as a sign-out: destroying the session
   * on one server-side 401 traps the user in a sign-in loop they cannot escape.
   */
  readonly sessionError: string | null
  /**
   * The stored bearer token, for RENDERING only.
   *
   * It may already be expired. Anything about to make a request must await
   * `getAccessToken()` instead.
   */
  readonly accessToken: string | undefined
  /**
   * Resolve a token that is valid right now, refreshing first if the stored one
   * has expired. Returns `undefined` when signed out.
   */
  readonly getAccessToken: () => Promise<string | undefined>
  readonly signIn: (email: string, password: string) => Promise<void>
  readonly signUp: (
    email: string,
    password: string,
    displayName?: string,
    username?: string,
  ) => Promise<void>
  readonly signOut: () => Promise<void>
  /** Re-read `/users/me`. */
  readonly refreshProfile: () => Promise<void>
  /**
   * Save details to the ACCOUNT and adopt the server's stored values.
   *
   * Resolves with the row the database now holds, which is what the UI must
   * render. Rejects with a `WazobiaApiError` so the form can show the server's
   * validation message — including "that username is taken", which no client
   * can decide on its own.
   */
  readonly updateProfile: (update: ProfileUpdate) => Promise<Profile>
}

export const AuthContext = createContext<AuthValue | null>(null)
