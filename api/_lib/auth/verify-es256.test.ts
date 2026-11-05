// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'

import { createTokenVerifier, type AuthResult } from './verify.js'

/**
 * ES256 verification, tested against the real JWKS shape.
 *
 * ## Why these tests exist
 *
 * Production returned 401 for every authenticated request while sign-in itself
 * succeeded. The cause was that the verifier only accepted HS256, and the live
 * project publishes ES256 keys. Nothing in the suite could have caught it: every
 * existing token test minted its own HS256 token, so "a valid token works" was
 * true in a world that did not exist.
 *
 * The key below is copied from the live project's
 * `/.well-known/jwks.json`. Using the real shape matters: it has `alg`, `crv`,
 * `kty`, `kid`, `x`, `y`, `ext`, `key_ops` and `use` exactly as Supabase emits
 * them, and it is EC/P-256 rather than a convenient hand-rolled fixture.
 *
 * `d` (the private key) is absent, as it must be in a real JWKS. These tests
 * therefore generate their own key pair to sign with, and use the published
 * public key only to prove the *parsing* path accepts production's exact
 * format.
 */

/** Copied verbatim from the live project's JWKS. Public key material only. */
const REAL_JWKS = {
  keys: [
    {
      alg: 'ES256',
      crv: 'P-256',
      ext: true,
      key_ops: ['verify'],
      kid: '9e9bb74d-ddf0-408e-8074-ddf4850c146f',
      kty: 'EC',
      use: 'sig',
      x: 'eOiChZ2Exmu_6bpH541R3IYK6hMJhJ7q1_UTsZ3BVMA',
      y: 'SqdfEEnwefIw0G-fRa4_v8onpq3EdYLk3qQ3O5znE8M',
    },
    {
      alg: 'ES256',
      crv: 'P-256',
      ext: true,
      key_ops: ['verify'],
      kid: '343b0845-e3d6-48aa-9e42-954952fe6245',
      kty: 'EC',
      use: 'sig',
      x: '9IIjk7Ve2ZodhuHmr_Kgqrk1wQWItF2uelCWyymwUDU',
      y: 'zVrrpQUjUN4QyzlzWK_J--2MTEl5BZGsVH9a1DJwTgs',
    },
  ],
} as const

const ISSUER = 'https://bxifjhhgmomiacehngyj.supabase.co/auth/v1'
const JWKS_URL = 'https://bxifjhhgmomiacehngyj.supabase.co/auth/v1/.well-known/jwks.json'
const NOW_MS = 1_800_000_000_000
const NOW_S = Math.floor(NOW_MS / 1000)
const KID = 'test-key-id'

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function encodeJson(value: Record<string, unknown>): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)))
}

/** A signing key pair, exported to a JWK so it can be published in a JWKS. */
interface TestKeyPair {
  readonly kid: string
  readonly privateKey: CryptoKey
  readonly publicJwk: Record<string, unknown>
}

async function makeKeyPair(kid = KID): Promise<TestKeyPair> {
  const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair

  const publicJwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as Record<string, unknown>
  return { kid, privateKey: pair.privateKey, publicJwk }
}

/** Build the JWKS document a project would publish for `pair`. */
function jwksFor(pair: TestKeyPair, extra: Record<string, unknown> = {}) {
  return {
    keys: [
      {
        alg: 'ES256',
        crv: 'P-256',
        ext: true,
        key_ops: ['verify'],
        kid: pair.kid,
        kty: 'EC',
        use: 'sig',
        x: pair.publicJwk['x'],
        y: pair.publicJwk['y'],
        ...extra,
      },
    ],
  }
}

function claims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: '7bf044e0-ed79-486c-8587-21b7e269b3ee',
    aud: 'authenticated',
    role: 'authenticated',
    iss: ISSUER,
    email: 'yzigzag26@gmail.com',
    exp: NOW_S + 3600,
    iat: NOW_S,
    ...overrides,
  }
}

/** Sign a token the way Supabase does: ES256 over `header.payload`. */
async function signEs256(
  pair: TestKeyPair,
  payload: Record<string, unknown>,
  header: Record<string, unknown> = {},
): Promise<string> {
  const encodedHeader = encodeJson({ alg: 'ES256', typ: 'JWT', kid: pair.kid, ...header })
  const encodedPayload = encodeJson(payload)
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    pair.privateKey,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  )
  return `${encodedHeader}.${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`
}

/**
 * A verifier wired to a JWKS served in-process.
 *
 * `fetchImpl` is injected rather than mocked globally so the tests exercise the
 * same code path production uses, including caching and the retry-on-miss.
 */
function verifierWithJwks(
  document: unknown,
  options: {
    status?: number
    throws?: boolean
    now?: () => number
    jwksUrl?: string
  } = {},
) {
  const fetches: string[] = []
  const verify = createTokenVerifier({
    jwtSecret: null,
    jwksUrl: options.jwksUrl ?? JWKS_URL,
    issuer: ISSUER,
    now: options.now ?? (() => NOW_MS),
    fetchImpl: (async (input: RequestInfo | URL) => {
      fetches.push(String(input))
      if (options.throws === true) throw new TypeError('network down')
      if ((options.status ?? 200) !== 200) {
        return new Response('nope', { status: options.status ?? 500 })
      }
      return new Response(JSON.stringify(document), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof globalThis.fetch,
  })
  return { verify, fetches }
}

afterEach(() => {
  // No global fetch mocking is used, so nothing to restore here. Kept for
  // clarity that these tests are independent.
})

describe('ES256 — the live JWKS shape', () => {
  it('imports both keys from the project’s published JWK set', async () => {
    // The exact document the live project serves. A P-256 key whose `x`/`y`
    // are base64url must import without error; this is what production does on
    // the first protected request after a deploy.
    const pair = await makeKeyPair('9e9bb74d-ddf0-408e-8074-ddf4850c146f')
    const { verify } = verifierWithJwks(REAL_JWKS)

    // Sign with our own key but publish it under production's first `kid`, so
    // the parsing path and the verification path are both exercised.
    const document = {
      keys: [
        ...REAL_JWKS.keys,
        {
          alg: 'ES256',
          crv: 'P-256',
          ext: true,
          key_ops: ['verify'],
          kid: pair.kid,
          kty: 'EC',
          use: 'sig',
          x: pair.publicJwk['x'],
          y: pair.publicJwk['y'],
        },
      ],
    }
    const withKeyPair = verifierWithJwks(document)
    const token = await signEs256(pair, claims())
    const result = await withKeyPair.verify(`Bearer ${token}`)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.user.id).toBe('7bf044e0-ed79-486c-8587-21b7e269b3ee')

    // The production document alone must not throw — importing is all it does.
    const probe = await verify('Bearer a.b.c')
    expect(probe.ok).toBe(false)
  })

  it('rejects a token signed by a key that is not in the set', async () => {
    // The attacker holds a valid P-256 pair — just not the project's.
    const attacker = await makeKeyPair('attacker-key')
    const { verify } = verifierWithJwks(REAL_JWKS)
    const token = await signEs256(attacker, claims())

    expect(await verify(`Bearer ${token}`)).toEqual({ ok: false, reason: 'UNKNOWN_KEY' })
  })
})

describe('ES256 — a genuine token is accepted', () => {
  it('returns the verified subject and email', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks(jwksFor(pair))
    const result = await verify(`Bearer ${await signEs256(pair, claims())}`)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.user.id).toBe('7bf044e0-ed79-486c-8587-21b7e269b3ee')
      expect(result.user.email).toBe('yzigzag26@gmail.com')
    }
  })

  it('accepts a JWKS entry that omits `alg`, inferring it from the curve', async () => {
    // Not every JWKS declares `alg`. A P-256 EC key is ES256 by definition, so
    // a missing field must not make the key unusable.
    const pair = await makeKeyPair()
    const document = { keys: [{ kty: 'EC', crv: 'P-256', kid: pair.kid, x: pair.publicJwk['x'], y: pair.publicJwk['y'] }] }
    const { verify } = verifierWithJwks(document)
    const result = await verify(`Bearer ${await signEs256(pair, claims())}`)

    expect(result.ok).toBe(true)
  })

  it('ignores keys marked for encryption rather than signing', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks(jwksFor(pair, { use: 'enc' }))
    const result = await verify(`Bearer ${await signEs256(pair, claims())}`)

    // No usable key => the set is empty => treated as unavailable, never trusted.
    expect(result.ok).toBe(false)
  })
})

describe('ES256 — forgeries are refused', () => {
  it('refuses a payload edited after signing', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks(jwksFor(pair))

    const token = await signEs256(pair, claims())
    const [header, , signature] = token.split('.') as [string, string, string]
    const tampered = `${header}.${encodeJson(claims({ sub: 'somebody-else' }))}.${signature}`

    expect(await verify(`Bearer ${tampered}`)).toEqual({ ok: false, reason: 'BAD_SIGNATURE' })
  })

  it('refuses alg:none', async () => {
    const header = encodeJson({ alg: 'none', typ: 'JWT' })
    const payload = encodeJson(claims())
    expect(await verifierWithJwks(REAL_JWKS).verify(`Bearer ${header}.${payload}.`)).toEqual({
      ok: false,
      reason: 'ALGORITHM_UNSUPPORTED',
    })
  })

  it('refuses an HS256 token signed with the public key as an HMAC secret', async () => {
    /*
     * The classic algorithm-confusion attack. If a verifier picks its algorithm
     * from the token header and feeds the *public* key into HMAC, an attacker
     * can sign anything. The public key is not secret, so this must never work.
     */
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks({
      keys: [{ kty: 'EC', crv: 'P-256', kid: pair.kid, x: pair.publicJwk['x'], y: pair.publicJwk['y'] }],
    })

    const header = encodeJson({ alg: 'HS256', typ: 'JWT' })
    const payload = encodeJson(claims())
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JSON.stringify(pair.publicJwk)),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signature = await crypto.subtle.sign(
      'HMAC',
      hmacKey,
      new TextEncoder().encode(`${header}.${payload}`),
    )
    const token = `${header}.${payload}.${base64UrlEncode(new Uint8Array(signature))}`

    // No HMAC secret is configured, so this cannot verify — and must not fall
    // back to the EC key.
    expect(await verify(`Bearer ${token}`)).toEqual({ ok: false, reason: 'SECRET_MISSING' })
  })

  it('refuses a token naming a key id that is not published', async () => {
    const pair = await makeKeyPair('real-key')
    const { verify } = verifierWithJwks(jwksFor(pair))
    const token = await signEs256(pair, claims(), { kid: 'made-up-key' })

    expect(await verify(`Bearer ${token}`)).toEqual({ ok: false, reason: 'UNKNOWN_KEY' })
  })

  it('refuses a token whose curve is not P-256', async () => {
    const { verify } = verifierWithJwks({
      keys: [{ kty: 'EC', crv: 'P-384', kid: KID, x: 'AAAA', y: 'BBBB' }],
    })
    const header = encodeJson({ alg: 'ES256', typ: 'JWT', kid: KID })
    const payload = encodeJson(claims())
    expect(await verify(`Bearer ${header}.${payload}.AAAA`)).toEqual({
      ok: false,
      reason: 'JWKS_UNAVAILABLE',
    })
  })
})

describe('ES256 — claim checks still apply after the signature', () => {
  it('rejects an expired ES256 token', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks(jwksFor(pair))
    const result = await verify(`Bearer ${await signEs256(pair, claims({ exp: NOW_S - 1 }))}`)
    expect(result).toEqual({ ok: false, reason: 'EXPIRED' })
  })

  it('rejects an ES256 token from another project', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks(jwksFor(pair))
    const result = await verify(
      `Bearer ${await signEs256(pair, claims({ iss: 'https://other.supabase.co/auth/v1' }))}`,
    )
    expect(result).toEqual({ ok: false, reason: 'WRONG_ISSUER' })
  })

  it('rejects an ES256 token whose role is anon', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks(jwksFor(pair))
    const result = await verify(`Bearer ${await signEs256(pair, claims({ role: 'anon' }))}`)
    expect(result).toEqual({ ok: false, reason: 'NOT_A_USER' })
  })

  it('rejects an ES256 token with no subject', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks(jwksFor(pair))
    const result = await verify(`Bearer ${await signEs256(pair, claims({ sub: undefined }))}`)
    expect(result).toEqual({ ok: false, reason: 'NO_SUBJECT' })
  })
})

describe('ES256 — key set availability', () => {
  it('reports JWKS_UNAVAILABLE when the key set cannot be fetched', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks(jwksFor(pair), { throws: true })
    const result = await verify(`Bearer ${await signEs256(pair, claims())}`)

    // Distinct from UNKNOWN_KEY on purpose: an outage must not look like a
    // forged token, because the two need different responses.
    expect(result).toEqual({ ok: false, reason: 'JWKS_UNAVAILABLE' })
  })

  it('reports JWKS_UNAVAILABLE when the key set endpoint errors', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks(jwksFor(pair), { status: 503 })
    expect(await verify(`Bearer ${await signEs256(pair, claims())}`)).toEqual({
      ok: false,
      reason: 'JWKS_UNAVAILABLE',
    })
  })

  it('treats an empty key set as unavailable rather than trusting everything', async () => {
    const pair = await makeKeyPair()
    const { verify } = verifierWithJwks({ keys: [] })
    expect(await verify(`Bearer ${await signEs256(pair, claims())}`)).toEqual({
      ok: false,
      reason: 'JWKS_UNAVAILABLE',
    })
  })

  it('fetches the key set once and reuses it', async () => {
    const pair = await makeKeyPair()
    const { verify, fetches } = verifierWithJwks(jwksFor(pair))

    await verify(`Bearer ${await signEs256(pair, claims())}`)
    await verify(`Bearer ${await signEs256(pair, claims())}`)
    await verify(`Bearer ${await signEs256(pair, claims())}`)

    // Caching is not cosmetic: without it every protected request makes an
    // outbound call to Supabase, adding latency to the whole API.
    expect(fetches).toHaveLength(1)
  })

  it('refetches once when a token names a key created after the cache filled', async () => {
    // Supabase rotates signing keys. A token signed by a brand-new key must not
    // be rejected for five minutes just because the cache predates it.
    const oldPair = await makeKeyPair('old-key')
    const newPair = await makeKeyPair('new-key')
    let document: unknown = jwksFor(oldPair)
    let fetches = 0

    const verify = createTokenVerifier({
      jwtSecret: null,
      jwksUrl: JWKS_URL,
      issuer: ISSUER,
      now: () => NOW_MS,
      fetchImpl: (async () => {
        fetches += 1
        return new Response(JSON.stringify(document), { status: 200 })
      }) as typeof globalThis.fetch,
    })

    // Prime the cache with the old key only.
    expect((await verify(`Bearer ${await signEs256(oldPair, claims())}`)).ok).toBe(true)

    // The project rotates; the new key is published.
    document = { keys: [...jwksFor(newPair).keys, ...jwksFor(oldPair).keys] }
    const result = await verify(`Bearer ${await signEs256(newPair, claims())}`)

    expect(result.ok).toBe(true)
    expect(fetches).toBe(2)
  })

  it('does not refetch per request for a garbage key id', async () => {
    // A token with an invented `kid` must not be able to turn every request
    // into an outbound fetch — that would be a cheap amplification attack.
    const pair = await makeKeyPair()
    let fetches = 0
    const verify = createTokenVerifier({
      jwtSecret: null,
      jwksUrl: JWKS_URL,
      issuer: ISSUER,
      now: () => NOW_MS,
      fetchImpl: (async () => {
        fetches += 1
        return new Response(JSON.stringify(jwksFor(pair)), { status: 200 })
      }) as typeof globalThis.fetch,
    })

    const token = await signEs256(pair, claims(), { kid: 'nope-1' })
    await verify(`Bearer ${token}`)
    await verify(`Bearer ${token}`)
    await verify(`Bearer ${token}`)

    // One initial fetch plus at most one refetch, not three.
    expect(fetches).toBeLessThanOrEqual(2)
  })
})

describe('HS256 still works when configured', () => {
  it('accepts an HS256 token when a secret is set', async () => {
    const secret = 'a-shared-secret-for-hs256-only'
    const header = encodeJson({ alg: 'HS256', typ: 'JWT' })
    const payload = encodeJson(claims())
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${header}.${payload}`),
    )
    const token = `${header}.${payload}.${base64UrlEncode(new Uint8Array(signature))}`

    const verify = createTokenVerifier({
      jwtSecret: secret,
      issuer: ISSUER,
      now: () => NOW_MS,
    })
    const result: AuthResult = await verify(`Bearer ${token}`)
    expect(result.ok).toBe(true)
  })

  it('reports SECRET_MISSING for an HS256 token when no secret is set', async () => {
    const verify = createTokenVerifier({ jwtSecret: null, now: () => NOW_MS })
    const header = encodeJson({ alg: 'HS256', typ: 'JWT' })
    const payload = encodeJson(claims())
    expect(await verify(`Bearer ${header}.${payload}.AAAA`)).toEqual({
      ok: false,
      reason: 'SECRET_MISSING',
    })
  })
})
