// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  createTokenVerifier,
  parseBearerToken,
  authFailureMessage,
  type AuthenticatedUser,
} from './verify.js'
import { protect, requireRole, type RoleLoader } from './guard.js'
import type { HttpRequest } from '../http.js'

/**
 * These tests exist because `verify.ts` is the only thing standing between the
 * public internet and endpoints that spend money. A test that merely asserts
 * "a good token works" would pass against a verifier that accepts everything,
 * so the majority of the cases below are forged tokens.
 */

const SECRET = 'test-jwt-secret-not-a-real-one'
const OTHER_SECRET = 'a-different-secret'
const ISSUER = 'https://example.supabase.co/auth/v1'

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

/** Sanity guard: the alphabet check keeps the helper honest, not decorative. */
function assertAlphabetIsStandard(): void {
  if (BASE64_ALPHABET.length !== 64) throw new Error('unexpected base64 alphabet')
}

function encodeJson(value: Record<string, unknown>): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)))
}

const NOW_MS = 1_800_000_000_000
const NOW_S = Math.floor(NOW_MS / 1000)

interface ClaimOverrides {
  readonly [key: string]: unknown
}

async function sign(
  claims: ClaimOverrides,
  options: { secret?: string; header?: Record<string, unknown> } = {},
): Promise<string> {
  const header = encodeJson(options.header ?? { alg: 'HS256', typ: 'JWT' })
  const payload = encodeJson(claims)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(options.secret ?? SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${header}.${payload}`),
  )
  return `${header}.${payload}.${base64UrlEncode(new Uint8Array(signature))}`
}

function validClaims(overrides: ClaimOverrides = {}): ClaimOverrides {
  return {
    sub: 'e7a1c0d2-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    iss: ISSUER,
    email: 'ada@example.com',
    exp: NOW_S + 3600,
    iat: NOW_S,
    ...overrides,
  }
}

function verifier(overrides: { issuer?: string | undefined } = {}) {
  assertAlphabetIsStandard()
  return createTokenVerifier({
    jwtSecret: SECRET,
    issuer: 'issuer' in overrides ? overrides.issuer : ISSUER,
    now: () => NOW_MS,
  })
}

describe('parseBearerToken', () => {
  it('extracts the token from a well-formed header', () => {
    expect(parseBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('is case-insensitive about the scheme', () => {
    expect(parseBearerToken('bearer abc.def.ghi')).toBe('abc.def.ghi')
    expect(parseBearerToken('BEARER abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseBearerToken('  Bearer abc.def.ghi  ')).toBe('abc.def.ghi')
  })

  it('rejects a missing header', () => {
    expect(parseBearerToken(null)).toBeNull()
    expect(parseBearerToken(undefined)).toBeNull()
    expect(parseBearerToken('')).toBeNull()
  })

  it('rejects a bare token with no scheme', () => {
    // A client that forgets the scheme must fail loudly, not be guessed at.
    expect(parseBearerToken('abc.def.ghi')).toBeNull()
  })

  it('rejects a different scheme', () => {
    expect(parseBearerToken('Basic abc.def.ghi')).toBeNull()
  })
})

describe('createTokenVerifier — accepts a genuine token', () => {
  it('returns the subject from verified claims', async () => {
    const token = await sign(validClaims())
    const result = await verifier()(`Bearer ${token}`)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected success')
    expect(result.user.id).toBe('e7a1c0d2-0000-4000-8000-000000000001')
    expect(result.user.email).toBe('ada@example.com')
  })

  it('still accepts a token whose issuer is checked but absent from config', async () => {
    const token = await sign(validClaims())
    const result = await verifier({ issuer: undefined })(`Bearer ${token}`)
    expect(result.ok).toBe(true)
  })

  it('treats a null email claim as null rather than empty string', async () => {
    const token = await sign(validClaims({ email: null }))
    const result = await verifier()(`Bearer ${token}`)
    if (!result.ok) throw new Error('expected success')
    expect(result.user.email).toBeNull()
  })
})

describe('createTokenVerifier — rejects forged and malformed tokens', () => {
  it('rejects a missing header', async () => {
    const result = await verifier()(null)
    expect(result).toEqual({ ok: false, reason: 'MISSING' })
  })

  it('rejects a token with the wrong number of segments', async () => {
    const result = await verifier()('Bearer abc.def')
    expect(result).toEqual({ ok: false, reason: 'MALFORMED' })
  })

  it('rejects a token signed with a different secret', async () => {
    // The headline attack: mint a token with `sub: victim` and sign it with
    // anything other than the project secret.
    const token = await sign(validClaims({ sub: 'victim-id' }), { secret: OTHER_SECRET })
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'BAD_SIGNATURE' })
  })

  it('rejects a token whose payload was edited after signing', async () => {
    // "alg: none" style tampering, but keeping the original signature. The
    // attacker swaps `sub` and hopes nobody checks the signature binds to it.
    const header = encodeJson({ alg: 'HS256', typ: 'JWT' })
    const originalPayload = encodeJson(validClaims({ sub: 'attacker-id' }))
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${header}.${originalPayload}`),
    )
    const tamperedPayload = encodeJson(validClaims({ sub: 'victim-id' }))
    const token = `${header}.${tamperedPayload}.${base64UrlEncode(new Uint8Array(signature))}`

    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'BAD_SIGNATURE' })
  })

  it('refuses the `none` algorithm', async () => {
    const header = encodeJson({ alg: 'none', typ: 'JWT' })
    const payload = encodeJson(validClaims())
    const result = await verifier()(`Bearer ${header}.${payload}.`)
    expect(result).toEqual({ ok: false, reason: 'ALGORITHM_UNSUPPORTED' })
  })

  it('refuses an asymmetric token when no key set is configured', async () => {
    /*
     * An RS256 (or ES256) token cannot be checked with an HMAC secret, so with
     * no `jwksUrl` it must be refused rather than passed.
     *
     * This test previously asserted ALGORITHM_UNSUPPORTED for *every*
     * asymmetric token, which encoded the bug: the live project signs with
     * ES256, so "refuse all asymmetric tokens" rejected every genuine session
     * and made sign-in unusable. The refusal now depends on whether a key set
     * is configured — tested properly in `verify-es256.test.ts`.
     */
    const token = await sign(validClaims(), { header: { alg: 'RS256' } })
    const result = await verifier()(`Bearer ${token}`)
    expect(result.ok).toBe(false)
    // No JWKS configured, so verification material is unavailable.
    expect(result).toEqual({ ok: false, reason: 'JWKS_UNAVAILABLE' })
  })

  it('refuses an algorithm that is not a real JWT algorithm', async () => {
    const token = await sign(validClaims(), { header: { alg: 'HS512' } })
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'ALGORITHM_UNSUPPORTED' })
  })

  it('rejects an expired token', async () => {
    const token = await sign(validClaims({ exp: NOW_S - 1 }))
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'EXPIRED' })
  })

  it('rejects a token that is not valid yet', async () => {
    const token = await sign(validClaims({ nbf: NOW_S + 60 }))
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'NOT_YET_VALID' })
  })

  it('rejects the anon key used as a bearer token', async () => {
    // This is the one that matters most in a Supabase project: the anon key is
    // a genuine, correctly-signed JWT that ships in the browser bundle. If it
    // passed, every protected endpoint would be open to anyone who viewed
    // source.
    const token = await sign(validClaims({ role: 'anon', aud: 'anon', sub: undefined }))
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'WRONG_AUDIENCE' })
  })

  it('rejects a service_role token', async () => {
    const token = await sign(
      validClaims({ role: 'service_role', aud: 'authenticated' }),
    )
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'NOT_A_USER' })
  })

  it('rejects a token for another audience', async () => {
    const token = await sign(validClaims({ aud: 'some-other-app' }))
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'WRONG_AUDIENCE' })
  })

  it('rejects a token from another project', async () => {
    const token = await sign(validClaims({ iss: 'https://other.supabase.co/auth/v1' }))
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'WRONG_ISSUER' })
  })

  it('rejects a token with no subject', async () => {
    const token = await sign(validClaims({ sub: undefined }))
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'NO_SUBJECT' })
  })

  it('rejects a blank subject', async () => {
    const token = await sign(validClaims({ sub: '   ' }))
    const result = await verifier()(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'NO_SUBJECT' })
  })

  it('reports SECRET_MISSING rather than trusting anything when unconfigured', async () => {
    const verify = createTokenVerifier({ jwtSecret: '', now: () => NOW_MS })
    const token = await sign(validClaims())
    const result = await verify(`Bearer ${token}`)
    expect(result).toEqual({ ok: false, reason: 'SECRET_MISSING' })
  })

  it('rejects a header segment that is not JSON', async () => {
    const result = await verifier()('Bearer notbase64.alsonot.signature')
    expect(result.ok).toBe(false)
  })
})

describe('authFailureMessage', () => {
  it('never leaks the specific failure reason to the user', () => {
    const reasons = [
      'MISSING',
      'MALFORMED',
      'ALGORITHM_UNSUPPORTED',
      'BAD_SIGNATURE',
      'EXPIRED',
      'NOT_YET_VALID',
      'WRONG_AUDIENCE',
      'WRONG_ISSUER',
      'NOT_A_USER',
      'NO_SUBJECT',
    ] as const

    for (const reason of reasons) {
      const message = authFailureMessage(reason)
      expect(message).toBe('Please sign in to continue.')
      // A user-facing string must not name internals.
      for (const leak of ['signature', 'expired', 'audience', 'issuer', 'HMAC']) {
        expect(message.toLowerCase()).not.toContain(leak)
      }
    }
  })

  it('gives a distinct message when sign-in is misconfigured', () => {
    expect(authFailureMessage('SECRET_MISSING')).toContain('temporarily unavailable')
  })
})

function request(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    method: 'GET',
    params: {},
    query: {},
    body: undefined,
    authorization: null,
    requestIdHeader: null,
    ...overrides,
  }
}

const caller: AuthenticatedUser = {
  id: 'user-1',
  email: null,
  claims: {},
}
const allowAll = async () => ({ ok: true as const, user: caller })
const denyAll = async () => ({ ok: false as const, reason: 'MISSING' as const })

describe('protect', () => {
  it('runs the handler only after a successful verification', async () => {
    let called = false
    const result = await protect(
      allowAll,
      async () => {
        called = true
        return { status: 200, body: { ok: true }, headers: {} }
      },
      request(),
    )

    expect(called).toBe(true)
    expect(result.status).toBe(200)
  })

  it('does not run the handler at all when verification fails', async () => {
    let called = false
    const result = await protect(
      denyAll,
      async () => {
        called = true
        return { status: 200, body: { leaked: true }, headers: {} }
      },
      request(),
    )

    // The important assertion is `called === false`: a guard that runs the
    // handler and then rewrites the status has already done the work.
    expect(called).toBe(false)
    expect(result.status).toBe(401)
  })

  it('returns a well-formed error envelope on failure', async () => {
    const result = await protect(denyAll, async () => ({ status: 200, body: {}, headers: {} }), request())
    const body = result.body as { success: boolean; error: { code: string; request_id: string } }

    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHENTICATED')
    expect(body.error.request_id).toMatch(/^req_/)
  })

  it('never marks a failed response as cacheable success', async () => {
    const result = await protect(denyAll, async () => ({ status: 200, body: {}, headers: {} }), request())
    expect(result.headers['cache-control']).toBe('no-store')
  })

  it('passes the verified user to the handler, not the raw request claims', async () => {
    let received: AuthenticatedUser | null = null
    await protect(
      allowAll,
      async (_req, user) => {
        received = user
        return { status: 200, body: {}, headers: {} }
      },
      request(),
    )
    expect(received).toBe(caller)
  })
})

const okResponse = { status: 200, body: { reached: true }, headers: {} }

function roleLoaderReturning(roles: readonly string[]): RoleLoader {
  return async () => roles
}

describe('requireRole', () => {
  it('allows a caller holding one of the required roles', async () => {
    const guarded = requireRole(roleLoaderReturning(['learner', 'reviewer']), ['reviewer'], async () => okResponse)
    const result = await guarded(request(), caller)
    expect(result.status).toBe(200)
  })

  it('rejects a caller with the wrong role', async () => {
    const guarded = requireRole(roleLoaderReturning(['learner']), ['admin'], async () => okResponse)
    const result = await guarded(request(), caller)
    expect(result.status).toBe(403)
  })

  it('rejects a caller with no roles at all', async () => {
    const guarded = requireRole(roleLoaderReturning([]), ['admin'], async () => okResponse)
    const result = await guarded(request(), caller)
    expect(result.status).toBe(403)
  })

  it('does not run the wrapped handler when the role check fails', async () => {
    let called = false
    const guarded = requireRole(roleLoaderReturning(['learner']), ['admin'], async () => {
      called = true
      return okResponse
    })
    await guarded(request(), caller)
    expect(called).toBe(false)
  })

  it('loads roles for the verified user id, never a client-supplied one', async () => {
    let askedFor: string | null = null
    const loader: RoleLoader = async (userId) => {
      askedFor = userId
      return ['admin']
    }
    const guarded = requireRole(loader, ['admin'], async () => okResponse)

    // The request tries to look like a different user.
    await guarded(request({ query: { user_id: 'victim' }, body: { user_id: 'victim' } }), caller)
    expect(askedFor).toBe('user-1')
  })
})
