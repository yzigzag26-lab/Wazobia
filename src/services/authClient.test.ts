import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AUTH_STORAGE_KEY,
  AuthError,
  authService,
  clearStoredSession,
  isExpired,
  readStoredSession,
  writeStoredSession,
  type AuthSession,
} from './authClient'

/**
 * These tests are about the client half of sign-in, which is where the session
 * token actually lives. The properties that matter:
 *
 *   * a corrupt stored session is discarded, never half-trusted
 *   * signup with no returned session is an error, not a silent success
 *   * signing out clears local state even if the network call fails
 */

vi.mock('@/config/env', () => ({
  env: {
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
    isProduction: false,
    apiOrigin: undefined,
    apiVersion: 'v1',
    appVersion: '0.0.0',
  },
}))

const NOW = 1_800_000_000_000

function session(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: NOW + 3_600_000,
    userId: 'user-1',
    email: 'ada@example.com',
    ...overrides,
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function tokenPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    access_token: 'new-access',
    refresh_token: 'new-refresh',
    expires_in: 3600,
    user: { id: 'user-1', email: 'ada@example.com' },
    ...overrides,
  }
}

beforeEach(() => {
  globalThis.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  globalThis.localStorage.clear()
})

describe('stored session', () => {
  it('round-trips a session', () => {
    writeStoredSession(session())
    expect(readStoredSession(NOW)).toEqual(session())
  })

  it('returns null when nothing is stored', () => {
    expect(readStoredSession(NOW)).toBeNull()
  })

  it('discards malformed JSON and removes the entry', () => {
    globalThis.localStorage.setItem(AUTH_STORAGE_KEY, '{not json')
    expect(readStoredSession(NOW)).toBeNull()
    // Leaving the bad value in place would make every reload do this again.
    expect(globalThis.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
  })

  it('discards a session missing its token', () => {
    globalThis.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ refreshToken: 'r', expiresAt: NOW, userId: 'u', email: null }),
    )
    expect(readStoredSession(NOW)).toBeNull()
  })

  it('clearStoredSession removes the entry', () => {
    writeStoredSession(session())
    clearStoredSession()
    expect(readStoredSession(NOW)).toBeNull()
  })
})

describe('isExpired', () => {
  it('is false well before expiry', () => {
    expect(isExpired(session(), NOW)).toBe(false)
  })

  it('is true once inside the safety margin', () => {
    // A token with 30 s left is treated as expired, so a request cannot start
    // with 200 ms of validity and fail mid-flight.
    expect(isExpired(session({ expiresAt: NOW + 30_000 }), NOW)).toBe(true)
  })

  it('is true for a token that already expired', () => {
    expect(isExpired(session({ expiresAt: NOW - 1 }), NOW)).toBe(true)
  })
})

describe('signUp', () => {
  it('stores and returns the session the server issued', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, tokenPayload()))

    const result = await authService.signUp({ email: 'ada@example.com', password: 'correct1A' })

    expect(result.accessToken).toBe('new-access')
    expect(readStoredSession(Date.now())?.accessToken).toBe('new-access')
  })

  it('sends the display name as metadata for the profile trigger', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, tokenPayload()))

    await authService.signUp({
      email: 'ada@example.com',
      password: 'correct1A',
      displayName: 'Adaeze Okonkwo',
    })

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body['data']).toEqual({ display_name: 'Adaeze Okonkwo' })
  })

  it('omits the metadata key entirely when no name was given', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, tokenPayload()))

    await authService.signUp({ email: 'ada@example.com', password: 'correct1A' })

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect('data' in body).toBe(false)
  })

  it('fails loudly when signup returns no session', async () => {
    // This is exactly what happens if email confirmation is switched back on.
    // Silently reporting success would leave the user in a signed-in-looking
    // UI whose every request 401s.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, { user: { id: 'u' } }))

    await expect(
      authService.signUp({ email: 'ada@example.com', password: 'correct1A' }),
    ).rejects.toBeInstanceOf(AuthError)
    expect(readStoredSession(Date.now())).toBeNull()
  })

  it('maps a duplicate email to EMAIL_TAKEN', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(400, { msg: 'User already registered' }),
    )

    await expect(
      authService.signUp({ email: 'ada@example.com', password: 'correct1A' }),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' })
  })

  it('maps a short password to WEAK_PASSWORD', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(422, { msg: 'Password should be at least 8 characters' }),
    )

    await expect(
      authService.signUp({ email: 'ada@example.com', password: 'short' }),
    ).rejects.toMatchObject({ code: 'WEAK_PASSWORD' })
  })
})

describe('configuration failures', () => {
  it('names the missing variables instead of saying "not configured"', async () => {
    // The original message left a developer with nothing to act on. This case
    // pins the specific guidance, because "sign-in is not configured" was the
    // exact error reported from a build with no .env at all.
    vi.resetModules()
    vi.doMock('@/config/env', () => ({
      env: {
        supabaseUrl: undefined,
        supabaseAnonKey: undefined,
        isProduction: false,
        apiOrigin: undefined,
        apiVersion: 'v1',
        appVersion: '0.0.0',
      },
    }))

    const fresh = await import('./authClient')
    const error = await fresh.authService
      .signIn('ada@example.com', 'correct1A')
      .catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(fresh.AuthError)
    const authError = error as InstanceType<typeof fresh.AuthError>
    expect(authError.code).toBe('NOT_CONFIGURED')
    expect(authError.message).toContain('VITE_SUPABASE_URL')
    expect(authError.message).toContain('VITE_SUPABASE_ANON_KEY')
    // It must also explain *why* a rebuild is needed, since that is the part
    // people miss: the values are inlined at build time.
    expect(authError.message.toLowerCase()).toContain('rebuild')

    vi.doUnmock('@/config/env')
    vi.resetModules()
  })

  it('does not make a network call when unconfigured', async () => {
    vi.resetModules()
    vi.doMock('@/config/env', () => ({
      env: {
        supabaseUrl: undefined,
        supabaseAnonKey: undefined,
        isProduction: false,
        apiOrigin: undefined,
        apiVersion: 'v1',
        appVersion: '0.0.0',
      },
    }))
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const fresh = await import('./authClient')
    await fresh.authService.signIn('ada@example.com', 'correct1A').catch(() => undefined)

    expect(fetchSpy).not.toHaveBeenCalled()

    vi.doUnmock('@/config/env')
    vi.resetModules()
  })
})

describe('signIn', () => {
  it('posts to the password grant and stores the session', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, tokenPayload()))

    const result = await authService.signIn('ada@example.com', 'correct1A')

    expect(result.accessToken).toBe('new-access')
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('grant_type=password')
  })

  it('maps invalid credentials to a message that does not confirm account existence', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' }),
    )

    const error = await authService.signIn('ada@example.com', 'wrong').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(AuthError)
    expect((error as AuthError).code).toBe('INVALID_CREDENTIALS')
    // "no such account" vs "wrong password" would let anyone enumerate users.
    expect((error as AuthError).message).not.toMatch(/no such|not found|unknown account/i)
  })

  it('reports a network failure as NETWORK_ERROR', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('failed to fetch'))

    await expect(authService.signIn('ada@example.com', 'correct1A')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })

  it('reports rate limiting distinctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(429, { msg: 'Request rate limit reached' }),
    )

    await expect(authService.signIn('ada@example.com', 'correct1A')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    })
  })
})

describe('refresh', () => {
  it('replaces the stored session', async () => {
    writeStoredSession(session({ accessToken: 'old' }))
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, tokenPayload()))

    const result = await authService.refresh('refresh-token')

    expect(result.accessToken).toBe('new-access')
    expect(readStoredSession(Date.now())?.accessToken).toBe('new-access')
  })

  it('clears the stored session when the refresh fails', async () => {
    // A dead refresh token means the session is over. Keeping it would leave a
    // token in storage that every request tries and fails to use.
    writeStoredSession(session())
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(400, { msg: 'invalid refresh token' }))

    await expect(authService.refresh('refresh-token')).rejects.toBeInstanceOf(AuthError)
    expect(readStoredSession(Date.now())).toBeNull()
  })
})

describe('signOut', () => {
  it('clears local state even when the server call fails', async () => {
    writeStoredSession(session())
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))

    await authService.signOut('access-token')

    expect(readStoredSession(Date.now())).toBeNull()
  })

  it('clears local state when there was no token', async () => {
    writeStoredSession(session())
    await authService.signOut(null)
    expect(readStoredSession(Date.now())).toBeNull()
  })

  it('revokes server-side when it can', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, {}))
    await authService.signOut('access-token')
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('/auth/v1/logout')
  })
})
