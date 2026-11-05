/**
 * Verification of Supabase access tokens.
 *
 * ## Two signing schemes, both real
 *
 * A Supabase project signs user tokens in one of two ways, and which one you
 * get is a project setting — not something this code controls:
 *
 *   * **HS256** (legacy) — one shared secret, `SUPABASE_JWT_SECRET`, symmetric.
 *     Signing and verifying use the same value, so the secret must never leave
 *     the server.
 *   * **ES256** (current default for new projects) — a P-256 key pair. Supabase
 *     holds the private half and publishes the public half at
 *     `GET /auth/v1/.well-known/jwks.json`. Nothing secret is shared, and the
 *     project can rotate keys without redeploying the API.
 *
 * ## Why this module was rewritten
 *
 * v1 accepted HS256 only and refused everything else. That was the correct
 * security stance and the wrong operational one: a deployment whose project
 * signs with ES256 rejected **every genuine token**, so sign-in succeeded and
 * then every protected call returned 401. The symptom was "sign-in loads but
 * never reaches the dashboard", which looks like an auth bug and is really a
 * signing-scheme mismatch.
 *
 * So both schemes are supported, and the algorithm is chosen from the token's
 * own header — but never *trusted* from it:
 *
 *   * `alg` must be HS256, ES256, or RS256. `none` is always refused.
 *   * For ES256/RS256 the `kid` must match a key in the fetched JWKS. A token
 *     naming an unknown `kid` is refused, not retried against every key.
 *   * The key is fetched from the project's own JWKS endpoint, which is the
 *     authority. A token cannot redirect that fetch.
 *
 * The classic JWT attacks this defends against are in the tests: `alg: none`,
 * HMAC-signed-with-the-public-key, wrong `kid`, and a signature lifted from a
 * different token.
 */

import type { webcrypto } from 'node:crypto'

/** The verified caller. Nothing here is client-asserted. */
export interface AuthenticatedUser {
  readonly id: string
  readonly email: string | null
  /** Raw claims, already signature-verified. */
  readonly claims: Readonly<Record<string, unknown>>
}

export type AuthFailureReason =
  | 'MISSING'
  | 'MALFORMED'
  | 'ALGORITHM_UNSUPPORTED'
  | 'BAD_SIGNATURE'
  | 'EXPIRED'
  | 'NOT_YET_VALID'
  | 'WRONG_AUDIENCE'
  | 'WRONG_ISSUER'
  | 'NOT_A_USER'
  | 'NO_SUBJECT'
  | 'SECRET_MISSING'
  | 'JWKS_UNAVAILABLE'
  | 'UNKNOWN_KEY'

export type AuthResult =
  | { readonly ok: true; readonly user: AuthenticatedUser }
  | { readonly ok: false; readonly reason: AuthFailureReason }

/**
 * A public key, already parsed.
 *
 * `alg` decides which WebCrypto parameters verify a signature with it.
 */
interface VerificationKey {
  readonly alg: 'ES256' | 'RS256'
  readonly key: ImportedCryptoKey
}

export interface TokenVerifierConfig {
  /**
   * Shared HMAC secret. Only consulted for HS256 tokens. `null` when the
   * deployment has not set one — which is expected for ES256 projects, where
   * there is no shared secret to set.
   */
  readonly jwtSecret?: string | null | undefined
  /**
   * Project JWKS URL, e.g. `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`.
   * When absent, asymmetric tokens cannot be verified and are refused.
   */
  readonly jwksUrl?: string | undefined
  /** Expected `iss`, e.g. `https://<ref>.supabase.co/auth/v1`. Optional. */
  readonly issuer?: string | undefined
  /** Injected for tests; defaults to `Date.now`. */
  readonly now?: (() => number) | undefined
  /** Injected for tests; defaults to the global `fetch`. */
  readonly fetchImpl?: typeof globalThis.fetch | undefined
}

const TEXT_ENCODER = new TextEncoder()

/** A key type derived rather than named — see the note in `verify.ts` history. */
type ImportedCryptoKey = Awaited<ReturnType<typeof globalThis.crypto.subtle.importKey>>

/**
 * The JWK shape `importKey` accepts.
 *
 * `api/tsconfig.json` deliberately has no DOM lib, so the DOM's global
 * `JsonWebKey` interface is not in scope. Node publishes the same structure
 * under `webcrypto`, which is the correct source for a server-only module.
 */
type JwkInput = webcrypto.JsonWebKey

/* -------------------------------------------------------------------------- */
/* base64url                                                                   */
/* -------------------------------------------------------------------------- */

export function decodeBase64Url(value: string): Uint8Array | null {
  const normalised = value.replaceAll('-', '+').replaceAll('_', '/')
  // Reject anything that is not base64 at all before handing it to atob, which
  // is lenient about some inputs and throws on others.
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalised)) return null
  const padded = normalised.padEnd(normalised.length + ((4 - (normalised.length % 4)) % 4), '=')
  try {
    const binary = globalThis.atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

function decodeJson(segment: string): Record<string, unknown> | null {
  const bytes = decodeBase64Url(segment)
  if (bytes === null) return null
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

/** Extract the token from an `Authorization` header value. */
export function parseBearerToken(header: string | null | undefined): string | null {
  if (typeof header !== 'string') return null
  // Scheme is case-insensitive per RFC 7235; clients are not always careful.
  const match = /^Bearer[ ]+(\S+)$/i.exec(header.trim())
  return match?.[1] ?? null
}

/* -------------------------------------------------------------------------- */
/* JWKS                                                                        */
/* -------------------------------------------------------------------------- */

/** One entry from a JWKS document. Only the fields we use are typed. */
interface JwkEntry {
  readonly kty?: unknown
  readonly kid?: unknown
  readonly alg?: unknown
  readonly crv?: unknown
  readonly use?: unknown
}

/**
 * How long a fetched key set is trusted. Keys rotate rarely; five minutes keeps
 * a rotation visible without a redeploy, while removing the per-request fetch
 * that would otherwise add latency to every protected call.
 */
const JWKS_CACHE_MS = 5 * 60 * 1000

/**
 * On a `kid` miss, how long to wait before refetching.
 *
 * Supabase rotates signing keys. Without this, a token signed by a key created
 * seconds ago would be rejected until the cache expired — up to five minutes of
 * "invalid token" for a perfectly valid session. Refetching once on a miss
 * closes that window, and the dampening stops a token with a garbage `kid` from
 * turning every request into an outbound fetch.
 */
const JWKS_MISS_REFETCH_MS = 30 * 1000

const JWKS_TIMEOUT_MS = 5_000

interface JwksCache {
  keys: Map<string, VerificationKey>
  fetchedAt: number
}

/**
 * Build a verifier bound to one project.
 *
 * Returns a function so configuration is captured once and keys are imported
 * lazily — importing at module scope would break in an environment without
 * WebCrypto.
 */
export function createTokenVerifier(config: TokenVerifierConfig) {
  let hmacKeyPromise: Promise<ImportedCryptoKey> | null = null
  let jwksCache: JwksCache | null = null
  let jwksInFlight: Promise<Map<string, VerificationKey> | null> | null = null
  let lastMissRefetchAt = 0

  async function importHmacKey(): Promise<ImportedCryptoKey | null> {
    const secret = config.jwtSecret
    if (typeof secret !== 'string' || secret.length === 0) return null
    hmacKeyPromise ??= globalThis.crypto.subtle.importKey(
      'raw',
      TEXT_ENCODER.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    return hmacKeyPromise
  }

  /**
   * Import every usable key in a JWKS document.
   *
   * Keys are skipped rather than fatal: a project mid-rotation can publish one
   * key we cannot parse alongside one we can, and refusing the whole set would
   * turn a partial outage into a total one.
   */
  async function importJwks(document: unknown): Promise<Map<string, VerificationKey>> {
    const keys = new Map<string, VerificationKey>()
    const list =
      typeof document === 'object' && document !== null
        ? (document as { keys?: unknown }).keys
        : undefined
    if (!Array.isArray(list)) return keys

    // Pick out the entries worth attempting first, so the imports below can run
    // concurrently instead of one await at a time.
    const candidates: { kid: string; alg: 'ES256' | 'RS256'; entry: JwkEntry }[] = []
    for (const entry of list as JwkEntry[]) {
      if (typeof entry !== 'object' || entry === null) continue
      if (typeof entry.kid !== 'string') continue
      if (entry.use !== undefined && entry.use !== 'sig') continue
      if (entry.kty !== 'EC' && entry.kty !== 'RSA') continue

      // Prefer the documented algorithm; fall back to the curve/type, because
      // not every JWKS declares `alg` and a missing field is not an error.
      let alg: 'ES256' | 'RS256' | null = null
      if (entry.alg === 'ES256' || entry.alg === 'RS256') {
        alg = entry.alg
      } else if (entry.kty === 'EC' && entry.crv === 'P-256') {
        alg = 'ES256'
      } else if (entry.kty === 'RSA') {
        alg = 'RS256'
      }
      if (alg === null) continue

      candidates.push({ kid: entry.kid, alg, entry })
    }

    const imported = await Promise.all(
      candidates.map(async (candidate) => {
        // `api/tsconfig.json` deliberately has no DOM lib, so the DOM's
        // `RsaHashedImportParams` / `EcKeyImportParams` names do not exist here.
        // The shapes below are what `importKey` actually reads.
        const importParams =
          candidate.alg === 'ES256'
            ? ({ name: 'ECDSA', namedCurve: 'P-256' } as const)
            : ({ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } as const)

        try {
          const key = await globalThis.crypto.subtle.importKey(
            'jwk',
            // The JWKS entry is the JWK. Only the fields WebCrypto reads are
            // used; extra members are ignored by the implementation.
            candidate.entry as unknown as JwkInput,
            importParams,
            false,
            ['verify'],
          )
          return { kid: candidate.kid, alg: candidate.alg, key }
        } catch {
          // A key we cannot parse is skipped, not fatal: a project mid-rotation
          // can publish one unusable key alongside a usable one, and refusing
          // the whole set would turn a partial problem into a total outage.
          return null
        }
      }),
    )

    for (const result of imported) {
      if (result === null) continue
      keys.set(result.kid, { alg: result.alg, key: result.key })
    }

    return keys
  }

  /** Fetch and cache the key set. Returns `null` when it cannot be obtained. */
  async function loadJwks(force: boolean): Promise<Map<string, VerificationKey> | null> {
    if (config.jwksUrl === undefined || config.jwksUrl.length === 0) return null

    const now = config.now?.() ?? Date.now()
    if (!force && jwksCache !== null && now - jwksCache.fetchedAt < JWKS_CACHE_MS) {
      return jwksCache.keys
    }

    // Collapse concurrent fetches. A burst of parallel requests after a deploy
    // must not become a burst of outbound fetches to Supabase.
    jwksInFlight ??= (async () => {
      const doFetch = config.fetchImpl ?? globalThis.fetch
      try {
        const response = await doFetch(config.jwksUrl as string, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(JWKS_TIMEOUT_MS),
        })
        if (!response.ok) return null
        const keys = await importJwks(await response.json())
        if (keys.size === 0) return null
        jwksCache = { keys, fetchedAt: config.now?.() ?? Date.now() }
        return keys
      } catch {
        return null
      } finally {
        jwksInFlight = null
      }
    })()

    return jwksInFlight
  }

  /** Resolve the key a token names, refetching once if the `kid` is unknown. */
  async function publicKeyFor(
    kid: unknown,
    alg: 'ES256' | 'RS256',
  ): Promise<VerificationKey | null> {
    if (typeof kid !== 'string' || kid.length === 0) return null

    const cached = await loadJwks(false)
    const hit = cached?.get(kid)
    if (hit !== undefined && hit.alg === alg) return hit

    const now = config.now?.() ?? Date.now()
    if (now - lastMissRefetchAt < JWKS_MISS_REFETCH_MS) return null
    lastMissRefetchAt = now

    const refreshed = await loadJwks(true)
    const retried = refreshed?.get(kid)
    return retried !== undefined && retried.alg === alg ? retried : null
  }

  return async function verify(header: string | null | undefined): Promise<AuthResult> {
    const token = parseBearerToken(header)
    if (token === null) return { ok: false, reason: 'MISSING' }

    const parts = token.split('.')
    if (parts.length !== 3) return { ok: false, reason: 'MALFORMED' }
    const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string]

    const tokenHeader = decodeJson(encodedHeader)
    if (tokenHeader === null) return { ok: false, reason: 'MALFORMED' }

    const alg = tokenHeader['alg']

    // `none` is never acceptable. It is listed explicitly so the refusal is
    // deliberate rather than an accident of the comparison below.
    if (alg === 'none') return { ok: false, reason: 'ALGORITHM_UNSUPPORTED' }

    const signature = decodeBase64Url(encodedSignature)
    if (signature === null) return { ok: false, reason: 'MALFORMED' }

    let signedPortion: Uint8Array
    try {
      signedPortion = TEXT_ENCODER.encode(`${encodedHeader}.${encodedPayload}`)
    } catch {
      return { ok: false, reason: 'MALFORMED' }
    }

    let signatureValid: boolean
    try {
      if (alg === 'HS256') {
        const key = await importHmacKey()
        if (key === null) return { ok: false, reason: 'SECRET_MISSING' }
        // WebCrypto verifies HMAC in constant time internally, so no manual
        // comparison is needed and none is written here.
        signatureValid = await globalThis.crypto.subtle.verify('HMAC', key, signature, signedPortion)
      } else if (alg === 'ES256' || alg === 'RS256') {
        const resolved = await publicKeyFor(tokenHeader['kid'], alg)
        if (resolved === null) {
          // Distinguish "we could not reach the key set" from "this token names
          // a key that does not exist". The first is an outage; the second is a
          // forgery or a project/secret mismatch.
          const reachable = await loadJwks(false)
          return {
            ok: false,
            reason: reachable === null ? 'JWKS_UNAVAILABLE' : 'UNKNOWN_KEY',
          }
        }

        // ECDSA in JWT is the raw r‖s pair, which is exactly what WebCrypto
        // expects — so the signature is passed through unconverted. RSASSA
        // takes the token data and the signature in the same order as HMAC.
        signatureValid =
          resolved.alg === 'ES256'
            ? await globalThis.crypto.subtle.verify(
                { name: 'ECDSA', hash: 'SHA-256' },
                resolved.key,
                signature,
                signedPortion,
              )
            : await globalThis.crypto.subtle.verify(
                'RSASSA-PKCS1-v1_5',
                resolved.key,
                signature,
                signedPortion,
              )
      } else {
        return { ok: false, reason: 'ALGORITHM_UNSUPPORTED' }
      }
    } catch {
      return { ok: false, reason: 'BAD_SIGNATURE' }
    }

    if (!signatureValid) return { ok: false, reason: 'BAD_SIGNATURE' }

    const claims = decodeJson(encodedPayload)
    if (claims === null) return { ok: false, reason: 'MALFORMED' }

    const nowSeconds = Math.floor((config.now?.() ?? Date.now()) / 1000)

    const exp = claims['exp']
    if (typeof exp === 'number' && nowSeconds >= exp) {
      return { ok: false, reason: 'EXPIRED' }
    }

    const nbf = claims['nbf']
    if (typeof nbf === 'number' && nowSeconds < nbf) {
      return { ok: false, reason: 'NOT_YET_VALID' }
    }

    // A Supabase access token carries `aud: 'authenticated'` and
    // `role: 'authenticated'`. The anon key carries `role: 'anon'`; the
    // service-role key carries `role: 'service_role'`. Neither is a user.
    const aud = claims['aud']
    if (typeof aud === 'string' && aud !== 'authenticated') {
      return { ok: false, reason: 'WRONG_AUDIENCE' }
    }
    if (Array.isArray(aud) && !aud.includes('authenticated')) {
      return { ok: false, reason: 'WRONG_AUDIENCE' }
    }

    if (claims['role'] !== 'authenticated') {
      return { ok: false, reason: 'NOT_A_USER' }
    }

    if (config.issuer !== undefined && config.issuer.length > 0) {
      if (claims['iss'] !== config.issuer) return { ok: false, reason: 'WRONG_ISSUER' }
    }

    const sub = claims['sub']
    if (typeof sub !== 'string' || sub.trim().length === 0) {
      return { ok: false, reason: 'NO_SUBJECT' }
    }

    const email = claims['email']
    return {
      ok: true,
      user: {
        id: sub,
        email: typeof email === 'string' ? email : null,
        claims,
      },
    }
  }
}

/**
 * Map a verification failure to user-facing copy.
 *
 * A 401 tells the user to sign in; it must never tell an attacker *why* the
 * token failed. The specific reason is available to logs via the `details`
 * field, which the client renders only as a support reference.
 */
export function authFailureMessage(reason: AuthFailureReason): string {
  switch (reason) {
    case 'SECRET_MISSING':
      return 'Sign-in is temporarily unavailable. Please try again shortly.'
    case 'JWKS_UNAVAILABLE':
      // The token may be perfectly good; the server could not fetch the keys to
      // check it. Telling the user to sign in again would send them round a
      // loop that cannot succeed, so say what is actually wrong.
      return 'This deployment could not verify your session. Please try again shortly.'
    default:
      return 'Please sign in to continue.'
  }
}
