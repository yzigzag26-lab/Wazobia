// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { createUsersMeHandler } from './me-handler.js'
import type { UserLookup, Profile } from '../auth/users.js'
import type { AuthenticatedUser } from '../auth/verify.js'
import type { HttpRequest } from '../http.js'
import type { RateLimiter } from '../rate-limit.js'

const CALLER: AuthenticatedUser = {
  id: 'e7a1c0d2-0000-4000-8000-000000000001',
  email: 'ada@example.com',
  claims: {},
}

const PROFILE: Profile = {
  id: CALLER.id,
  display_name: 'Adaeze Okonkwo',
  preferred_language: 'yo',
  roles: ['learner'],
  created_at: '2026-01-01T00:00:00.000Z',
}

function get(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    method: 'GET',
    params: {},
    query: {},
    body: undefined,
    authorization: 'Bearer token',
    requestIdHeader: null,
    ...overrides,
  }
}

function lookupReturning(profile: Profile | null): UserLookup {
  return {
    getProfile: async () => profile,
    getRoles: async () => profile?.roles ?? [],
  }
}

const refusingLimiter: RateLimiter = async () => ({ allowed: false, retryAfterSeconds: 42 })

function lookupThrowing(): UserLookup {
  return {
    getProfile: async () => {
      throw new Error('rest 500')
    },
    getRoles: async () => [],
  }
}

describe('GET /users/me', () => {
  it('returns the caller profile inside a success envelope', async () => {
    const run = createUsersMeHandler({ users: lookupReturning(PROFILE) })
    const result = await run(get(), CALLER)
    const body = result.body as { success: boolean; data: Profile }

    expect(result.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(PROFILE)
  })

  it('includes the roles the server resolved, not a client claim', async () => {
    const run = createUsersMeHandler({ users: lookupReturning(PROFILE) })
    const result = await run(get(), CALLER)
    const body = result.body as { data: Profile }
    expect(body.data.roles).toEqual(['learner'])
  })

  it('returns 404 rather than inventing a profile from the token', async () => {
    // A profile row missing from the database must not be papered over with
    // the JWT's email. The UI would then persist a name nobody holds.
    const run = createUsersMeHandler({ users: lookupReturning(null) })
    const result = await run(get(), CALLER)
    const body = result.body as { success: boolean; error: { code: string } }

    expect(result.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('returns INTERNAL_ERROR without leaking the database error text', async () => {
    const run = createUsersMeHandler({ users: lookupThrowing() })
    const result = await run(get(), CALLER)
    const body = result.body as { error: { code: string; message: string } }

    expect(result.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(body.error.message).not.toContain('rest 500')
  })

  it('rejects a non-GET method', async () => {
    const run = createUsersMeHandler({ users: lookupReturning(PROFILE) })
    const result = await run(get({ method: 'POST' }), CALLER)
    expect(result.status).toBe(405)
  })

  it('marks the response uncacheable', async () => {
    const run = createUsersMeHandler({ users: lookupReturning(PROFILE) })
    const result = await run(get(), CALLER)
    // A personalised body in a shared cache would show one user's profile to
    // another. `no-store` is not a nicety here.
    expect(result.headers['cache-control']).toBe('no-store')
  })

  it('returns 429 with retry-after when the limiter refuses', async () => {
    const run = createUsersMeHandler({
      users: lookupReturning(PROFILE),
      rateLimiter: refusingLimiter,
    })
    const result = await run(get(), CALLER)
    const body = result.body as { error: { code: string } }

    expect(result.status).toBe(429)
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(result.headers['retry-after']).toBe('42')
  })

  it('never calls the lookup when the limiter refuses', async () => {
    let called = false
    const users: UserLookup = {
      getProfile: async () => {
        called = true
        return PROFILE
      },
      getRoles: async () => [],
    }
    const run = createUsersMeHandler({ users, rateLimiter: refusingLimiter })
    await run(get(), CALLER)
    expect(called).toBe(false)
  })
})
