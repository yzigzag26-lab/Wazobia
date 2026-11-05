/**
 * Supabase Auth over plain `fetch`.
 *
 * ## Why not `@supabase/supabase-js`
 *
 * The only thing this app needs from Supabase Auth is four endpoints: sign up,
 * sign in with password, refresh, and sign out. The official client is ~40 kB
 * gzipped and brings a realtime client, a storage client and a PostgREST builder
 * along with it. That is a poor trade for four `fetch` calls, and the whole
 * point of `src/services/client.ts` is that the app has exactly one outbound
 * HTTP boundary.
 *
 * ## What this file is careful about
 *
 *   * The access token is never logged, never put in a URL, and never written
 *     anywhere except the storage key below.
 *   * A failed refresh clears the session rather than leaving a dead token in
 *     place for the next request to fail with a confusing 401.
 *   * Error messages are the server's own copy where it has any, otherwise a
 *     reviewed local string. Supabase's raw `error_description` is passed
 *     through only after being mapped, because it can be terse to the point of
 *     useless ("Invalid login credentials") and occasionally leaks internals.
 *
 * ## Straight sign-in, no email verification
 *
 * The project is configured with `mailer_autoconfirm: true` (migration
 * `0004_auth_protection.sql` documents the surrounding decision). Signup returns
 * an access token immediately, so the user is signed in the moment the form is
 * submitted. This file does not implement, and must not be extended with, a
 * "check your email" branch: there is no verification step to wait for.
 *
 * That is a deliberate product trade: lower friction, at the cost of not proving
 * the address is real. Nothing in this version sends email, so the trade does
 * not create a spam vector.
 */

import { env } from '@/config/env'

/** The stored session. Shape mirrors Supabase's token response, narrowed. */
export interface AuthSession {
  readonly accessToken: string
  readonly refreshToken: string
  /** Access token expiry, epoch milliseconds. */
  readonly expiresAt: number
  readonly userId: string
  readonly email: string | null
}

export const AUTH_STORAGE_KEY = 'wazobia.auth-session.v1'

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'RATE_LIMITED'
  | 'NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode, message: string, options: { cause?: unknown } = {}) {
    super(message, options)
    this.name = 'AuthError'
    this.code = code
  }
}

const MESSAGES: Readonly<Record<AuthErrorCode, string>> = {
  INVALID_CREDENTIALS: 'That email and password do not match an account.',
  EMAIL_TAKEN: 'An account with that email already exists. Try signing in instead.',
  WEAK_PASSWORD: 'Please choose a password with at least 8 characters.',
  INVALID_EMAIL: 'That does not look like an email address.',
  RATE_LIMITED: 'Too many attempts. Please wait a minute and try again.',
  // Names the two variables. "Not configured" alone left a developer with
  // nothing to act on — this error is only ever seen by whoever is running the
  // build, never by an end user, so being specific costs nothing.
  NOT_CONFIGURED:
    'Sign-in is not configured for this build. Set VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY, then rebuild — Vite inlines them at build time, ' +
    'so changing them without a rebuild has no effect.',
  NETWORK_ERROR:
    'We could not reach the sign-in service. Check your connection — or, if you ' +
    'are running locally, check that VITE_SUPABASE_URL points at a reachable project.',
  UNKNOWN: 'Something went wrong while signing you in. Please try again.',
}

function messageFor(code: AuthErrorCode): string {
  return MESSAGES[code]
}

/** The minimum the UI enforces, above Supabase's own configured minimum. */
export const MIN_PASSWORD_LENGTH = 8

/** Earliest a caller should trust the cached token (60s of safety margin). */
const EXPIRY_MARGIN_MS = 60_000

interface RawSession {
  access_token?: unknown
  refresh_token?: unknown
  expires_in?: unknown
  user?: { id?: unknown; email?: unknown } | undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toSession(raw: unknown, nowMs: number): AuthSession | null {
  if (!isRecord(raw)) return null
  const candidate = raw as RawSession
  if (typeof candidate.access_token !== 'string') return null
  if (typeof candidate.refresh_token !== 'string') return null

  const expiresIn = typeof candidate.expires_in === 'number' ? candidate.expires_in : 3600
  const userId = candidate.user?.id
  if (typeof userId !== 'string') return null

  return {
    accessToken: candidate.access_token,
    refreshToken: candidate.refresh_token,
    expiresAt: nowMs + expiresIn * 1000,
    userId,
    email: typeof candidate.user?.email === 'string' ? candidate.user.email : null,
  }
}

/** Map Supabase's error vocabulary onto ours, honestly. */
function mapAuthError(status: number, payload: unknown): AuthError {
  const body = isRecord(payload) ? payload : {}
  const code = typeof body['error_code'] === 'string' ? body['error_code'] : ''
  const description =
    typeof body['msg'] === 'string'
      ? body['msg']
      : typeof body['error_description'] === 'string'
        ? body['error_description']
        : typeof body['message'] === 'string'
          ? body['message']
          : ''
  const lower = `${code} ${description}`.toLowerCase()

  if (status === 429 || lower.includes('rate limit') || lower.includes('too many')) {
    return new AuthError('RATE_LIMITED', messageFor('RATE_LIMITED'))
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return new AuthError('EMAIL_TAKEN', messageFor('EMAIL_TAKEN'))
  }
  if (lower.includes('password') && lower.includes('least')) {
    return new AuthError('WEAK_PASSWORD', messageFor('WEAK_PASSWORD'))
  }
  if (lower.includes('invalid') && (lower.includes('email') || lower.includes('format'))) {
    return new AuthError('INVALID_EMAIL', messageFor('INVALID_EMAIL'))
  }
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_grant') ||
    status === 400
  ) {
    return new AuthError('INVALID_CREDENTIALS', messageFor('INVALID_CREDENTIALS'))
  }
  return new AuthError('UNKNOWN', messageFor('UNKNOWN'))
}

function authUrl(path: string): string | null {
  const base = env.supabaseUrl
  if (!base) return null
  return `${base.replace(/\/$/, '')}/auth/v1/${path}`
}

function authHeaders(accessToken?: string): Record<string, string> {
  const anonKey = env.supabaseAnonKey ?? ''
  return {
    'content-type': 'application/json',
    apikey: anonKey,
    ...(accessToken === undefined ? {} : { authorization: `Bearer ${accessToken}` }),
  }
}

/**
 * Give up on an auth request after this long.
 *
 * `fetch` has no default timeout. A request to a host that accepts the
 * connection but never answers — a proxy, a captive portal, a paused Supabase
 * project — leaves the promise pending forever, and the login form sits on
 * "Signing in…" with no error and no escape. That is indistinguishable from
 * "sign-in does not work", and it is the exact symptom this constant fixes.
 */
const AUTH_TIMEOUT_MS = 15_000

/**
 * Race a promise against a deadline.
 *
 * Passing `signal` to `fetch` is not sufficient on its own. The signal only
 * cancels the request if the implementation honours it; a stub, a test double,
 * or proxy middleware that swallows the signal leaves the promise pending and
 * the caller waiting forever. Racing makes the guarantee ours: the returned
 * promise ALWAYS settles, no matter what the callee does.
 */
async function withTimeout<T>(work: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined

  const deadline = new Promise<never>((_resolve, reject) => {
    timer = globalThis.setTimeout(() => {
      reject(new AuthError('NETWORK_ERROR', message))
    }, ms)
  })

  try {
    return await Promise.race([work, deadline])
  } finally {
    if (timer !== undefined) globalThis.clearTimeout(timer)
  }
}

async function post(path: string, body: unknown): Promise<unknown> {
  const url = authUrl(path)
  const anonKey = env.supabaseAnonKey

  if (url === null || !anonKey) {
    // Distinguish "wrong URL" from "missing key": the two have different fixes,
    // and a single message sent people looking in the wrong place.
    const missing: string[] = []
    if (env.supabaseUrl === undefined) missing.push('VITE_SUPABASE_URL')
    if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY')
    // A URL that is present but not absolute produces authUrl() === null.
    if (env.supabaseUrl !== undefined && url === null) {
      missing.length = 0
      missing.push('VITE_SUPABASE_URL (not an absolute https:// URL)')
    }

    throw new AuthError(
      'NOT_CONFIGURED',
      `${messageFor('NOT_CONFIGURED')} Missing: ${missing.join(', ')}.`,
    )
  }

  let response: Response
  try {
    response = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
      }),
      AUTH_TIMEOUT_MS,
      `The sign-in service did not respond within ${String(AUTH_TIMEOUT_MS / 1000)} seconds. Check your connection and try again.`,
    )
  } catch (cause) {
    if (cause instanceof AuthError) throw cause
    throw new AuthError('NETWORK_ERROR', messageFor('NETWORK_ERROR'), { cause })
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw mapAuthError(response.status, payload)
  return payload
}

/**
 * Read the stored session, discarding anything malformed.
 *
 * A corrupt entry is removed rather than partially trusted: a half-parsed
 * session would produce requests with a stale or empty token.
 */
export function readStoredSession(nowMs: number = Date.now()): AuthSession | null {
  if (typeof globalThis.localStorage === 'undefined') return null
  const raw = globalThis.localStorage.getItem(AUTH_STORAGE_KEY)
  if (raw === null) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) throw new Error('not an object')
    const session = toSession(
      {
        access_token: parsed['accessToken'],
        refresh_token: parsed['refreshToken'],
        expires_in: 0,
        user: { id: parsed['userId'], email: parsed['email'] },
      },
      typeof parsed['expiresAt'] === 'number' ? parsed['expiresAt'] : nowMs,
    )
    if (session === null) throw new Error('incomplete session')
    // `expires_in: 0` above means the reconstructed value is exactly the stored
    // `expiresAt`; restore it rather than trusting the conversion.
    return { ...session, expiresAt: parsed['expiresAt'] as number }
  } catch {
    globalThis.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function writeStoredSession(session: AuthSession): void {
  if (typeof globalThis.localStorage === 'undefined') return
  globalThis.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  if (typeof globalThis.localStorage === 'undefined') return
  globalThis.localStorage.removeItem(AUTH_STORAGE_KEY)
}

/** True when the token is past (or within a minute of) its expiry. */
export function isExpired(session: AuthSession, nowMs: number = Date.now()): boolean {
  return session.expiresAt - EXPIRY_MARGIN_MS <= nowMs
}

export interface SignUpInput {
  readonly email: string
  readonly password: string
  readonly displayName?: string | undefined
}

export const authService = {
  /** Create an account. The returned session is already usable. */
  async signUp(input: SignUpInput): Promise<AuthSession> {
    const payload = await post('signup', {
      email: input.email.trim(),
      password: input.password,
      // `display_name` is read by the `handle_new_user` trigger to populate
      // `profiles.display_name` (migration 0001, clamped in 0004).
      ...(input.displayName === undefined || input.displayName.trim().length === 0
        ? {}
        : { data: { display_name: input.displayName.trim() } }),
    })

    const session = toSession(payload, Date.now())
    if (session === null) {
      // With `mailer_autoconfirm: true` signup always returns a session. If it
      // does not, verification was silently turned back on — which would leave
      // the user stuck on a form that says they are signed in when they are
      // not. Refuse rather than pretend.
      throw new AuthError(
        'UNKNOWN',
        'That account was created but could not be signed in automatically. Try signing in.',
      )
    }

    writeStoredSession(session)
    return session
  },

  /** Sign in with email + password. No verification step. */
  async signIn(email: string, password: string): Promise<AuthSession> {
    const payload = await post('token?grant_type=password', {
      email: email.trim(),
      password,
    })

    const session = toSession(payload, Date.now())
    if (session === null) {
      throw new AuthError('UNKNOWN', messageFor('UNKNOWN'))
    }

    writeStoredSession(session)
    return session
  },

  /** Exchange a refresh token for a fresh access token. */
  async refresh(refreshToken: string): Promise<AuthSession> {
    let payload: unknown
    try {
      payload = await post('token?grant_type=refresh_token', {
        refresh_token: refreshToken,
      })
    } catch (error) {
      // A rejected refresh token means the session is over. Clearing it here
      // rather than only on a malformed response is the difference between one
      // failed request and every subsequent request retrying a dead token.
      clearStoredSession()
      throw error
    }

    const session = toSession(payload, Date.now())
    if (session === null) {
      clearStoredSession()
      throw new AuthError('UNKNOWN', messageFor('UNKNOWN'))
    }

    writeStoredSession(session)
    return session
  },

  /** Best-effort server-side revocation. Local state is cleared regardless. */
  async signOut(accessToken: string | null): Promise<void> {
    clearStoredSession()
    if (accessToken === null) return

    const url = authUrl('logout')
    if (url === null) return

    try {
      await fetch(url, {
        method: 'POST',
        headers: authHeaders(accessToken),
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
      })
    } catch {
      // Signing out locally is what the user asked for; a failed server call
      // must not strand them in a signed-in UI.
    }
  },
}
