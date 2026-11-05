// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

import { createUsersMeHandler, readProfileUpdate } from './me-handler.js'
import { ProfileWriteError } from '../auth/users.js'
import type { Profile, ProfileUpdate, UserLookup } from '../auth/users.js'
import type { AuthenticatedUser } from '../auth/verify.js'
import type { HttpRequest } from '../http.js'

/**
 * The profile write path.
 *
 * It did not exist before: the profile form wrote to `localStorage` and reported
 * success, so nothing a user edited reached their account. These tests exist
 * because "it says saved" and "it was saved" are different claims, and only one
 * of them is testable from the UI alone.
 */

const CALLER: AuthenticatedUser = {
  id: '586cc68a-9dfc-4e5e-9a33-13f0ffed97f1',
  email: 'yzigzag26@gmail.com',
  claims: {},
}

const STORED: Profile = {
  id: CALLER.id,
  display_name: 'Zigzag Y',
  username: 'zigzag',
  preferred_language: 'yo',
  email: CALLER.email,
  roles: ['learner'],
  created_at: '2026-11-04T22:52:10.000Z',
}

function request(overrides: Partial<HttpRequest> = {}): HttpRequest {
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

function lookup(overrides: Partial<UserLookup> = {}): UserLookup {
  return {
    getProfile: async () => STORED,
    getRoles: async () => ['learner'],
    updateProfile: async (_id, _auth, update: ProfileUpdate) => ({ ...STORED, ...update }),
    ...overrides,
  }
}

describe('readProfileUpdate', () => {
  it('accepts a display name and trims it', () => {
    const result = readProfileUpdate({ display_name: '  Adaeze Okonkwo  ' })
    expect(result).toEqual({ ok: true, update: { display_name: 'Adaeze Okonkwo' } })
  })

  it('lower-cases a username and preserves a legitimate full stop', () => {
    const result = readProfileUpdate({ username: 'Ada.Okonkwo' })
    expect(result).toEqual({ ok: true, update: { username: 'ada.okonkwo' } })
  })

  it('treats null as "clear this field"', () => {
    expect(readProfileUpdate({ username: null })).toEqual({ ok: true, update: { username: null } })
  })

  it('rejects an empty display name', () => {
    const result = readProfileUpdate({ display_name: '   ' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.problems[0]?.field).toBe('display_name')
  })

  it('rejects a display name over 80 characters', () => {
    const result = readProfileUpdate({ display_name: 'a'.repeat(81) })
    expect(result.ok).toBe(false)
  })

  it('rejects a username that is too short or too long', () => {
    expect(readProfileUpdate({ username: 'ab' }).ok).toBe(false)
    expect(readProfileUpdate({ username: 'a'.repeat(25) }).ok).toBe(false)
  })

  it('rejects a username with characters the format does not allow', () => {
    for (const bad of ['has space', 'hyphen-no', 'slash/no', 'bang!', 'emoji😀']) {
      expect(readProfileUpdate({ username: bad }).ok).toBe(false)
    }
  })

  it('rejects unknown fields rather than dropping them', () => {
    // Silently ignoring a field a client believed it sent is how "I changed it
    // and nothing happened" bugs are born.
    const result = readProfileUpdate({ role: 'admin' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.problems[0]?.field).toBe('role')
  })

  it('rejects an attempt to set the email through this endpoint', () => {
    const result = readProfileUpdate({ email: 'someone@else.com' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.problems[0]?.field).toBe('email')
  })

  it('rejects a non-object body', () => {
    expect(readProfileUpdate(null).ok).toBe(false)
    expect(readProfileUpdate([]).ok).toBe(false)
    expect(readProfileUpdate('nope').ok).toBe(false)
  })
})

function handler(overrides: Partial<UserLookup> = {}) {
  return createUsersMeHandler({ users: lookup(overrides) })
}

describe('PATCH /users/me', () => {
  it('writes to the CALLER, never to an id from the request', async () => {
    const updateProfile = vi.fn(async (_id: string, _a: string | null, update: ProfileUpdate) => ({
      ...STORED,
      ...update,
    }))
    const response = await handler({ updateProfile })(
      request({ method: 'PATCH', body: { display_name: 'New Name' } }),
      CALLER,
    )

    expect(response.status).toBe(200)
    // The id comes from the verified token. A body carrying someone else's id is
    // rejected as an unknown field, and could never reach the query anyway.
    expect(updateProfile).toHaveBeenCalledWith(
      CALLER.id,
      'Bearer token',
      { display_name: 'New Name' },
      CALLER.email,
    )
  })

  it('rejects an attempt to include an id in the body', async () => {
    const updateProfile = vi.fn()
    const response = await handler({ updateProfile })(
      request({ method: 'PATCH', body: { id: 'someone-else', display_name: 'X' } }),
      CALLER,
    )
    expect(response.status).toBe(400)
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('returns the stored row so the UI renders the server’s value', async () => {
    const response = await handler()(
      request({ method: 'PATCH', body: { display_name: 'From Server' } }),
      CALLER,
    )
    const body = response.body as { data: Profile }
    expect(body.data.display_name).toBe('From Server')
  })

  it('reports a taken username as 409', async () => {
    const response = await handler({
      updateProfile: async () => {
        throw new ProfileWriteError('CONFLICT', 'That username is already taken.')
      },
    })(request({ method: 'PATCH', body: { username: 'taken' } }), CALLER)

    expect(response.status).toBe(409)
    const body = response.body as { error: { code: string; message: string } }
    expect(body.error.code).toBe('CONFLICT')
    expect(body.error.message).toContain('already taken')
  })

  it('reports a constraint violation as a semantic error, not a 500', async () => {
    const response = await handler({
      updateProfile: async () => {
        throw new ProfileWriteError('INVALID', 'That change was rejected as invalid.')
      },
    })(request({ method: 'PATCH', body: { username: 'ok.name' } }), CALLER)

    expect(response.status).toBe(422)
    const body = response.body as { error: { code: string } }
    expect(body.error.code).toBe('SEMANTIC_ERROR')
  })

  it('never reports success for a write that matched no row', async () => {
    const response = await handler({ updateProfile: async () => null })(
      request({ method: 'PATCH', body: { display_name: 'Ghost' } }),
      CALLER,
    )
    expect(response.status).toBe(404)
  })

  it('returns 500 without leaking internals when the database fails', async () => {
    const response = await handler({
      updateProfile: async () => {
        throw new Error('PostgREST said no: connection refused to db-1.internal')
      },
    })(request({ method: 'PATCH', body: { display_name: 'X' } }), CALLER)

    expect(response.status).toBe(500)
    const serialised = JSON.stringify(response.body)
    expect(serialised).not.toContain('PostgREST')
    expect(serialised).not.toContain('db-1.internal')
  })

  it('rejects the write before validating when rate limited', async () => {
    const updateProfile = vi.fn()
    const response = await createUsersMeHandler({
      users: lookup({ updateProfile }),
      rateLimiter: async () => ({ allowed: false, retryAfterSeconds: 30 }),
    })(request({ method: 'PATCH', body: { display_name: 'X' } }), CALLER)

    expect(response.status).toBe(429)
    expect(updateProfile).not.toHaveBeenCalled()
  })
})

describe('GET /users/me', () => {
  it('passes the verified email through, so the client need not guess it', async () => {
    const getProfile = vi.fn(async () => STORED)
    const response = await createUsersMeHandler({ users: lookup({ getProfile }) })(
      request({ method: 'GET' }),
      CALLER,
    )

    expect(response.status).toBe(200)
    const body = response.body as { data: Profile }
    expect(body.data.email).toBe('yzigzag26@gmail.com')
    expect(body.data.username).toBe('zigzag')
  })

  it('still reports a missing profile as 404 rather than inventing one', async () => {
    const response = await createUsersMeHandler({
      users: lookup({ getProfile: async () => null }),
    })(request({ method: 'GET' }), CALLER)

    expect(response.status).toBe(404)
  })

  it('rejects methods it does not implement', async () => {
    const response = await createUsersMeHandler({ users: lookup() })(
      request({ method: 'DELETE' }),
      CALLER,
    )
    expect(response.status).toBe(405)
    expect(response.headers['allow']).toContain('PATCH')
  })
})
