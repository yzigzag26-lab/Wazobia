/**
 * Server-side caller identity.
 *
 * This is the module every protected endpoint goes through, so it is written to
 * be correct before it is written to be convenient.
 *
 * ## How the caller is identified
 *
 * The client sends `Authorization: Bearer <supabase access token>`. That token
 * is a JWT signed by Supabase with the project's JWT secret. Two ways to trust
 * it:
 *
 *   1. Decode the payload and read `sub`. Fast, and completely worthless as
 *      security: the payload is base64, not encrypted, and anyone can mint a
 *      token with `sub: <somebody else>`. Never do this.
 *   2. Verify the signature, then read `sub`. That is what happens here.
 *
 * An earlier idea was to skip local verification and ask Supabase who the user
 * is via `GET /auth/v1/user`. That works, but it puts a network round trip in
 * front of *every* endpoint. Verifying locally costs a few microseconds of
 * HMAC and removes that latency entirely.
 *
 * ## Why HMAC and not just "the token parses"
 *
 * Supabase signs with HS256 by default (`SUPABASE_JWT_SECRET`, a shared secret),
 * which maps onto WebCrypto's HMAC-SHA256. If a future project is configured for
 * asymmetric signing (RS256/ES256), this module refuses the token rather than
 * accepting it unverified, and the honest failure is a 401 — not an assumption.
 *
 * ## What is deliberately checked
 *
 *   * signature (constant-time compare, via WebCrypto)
 *   * `exp` — expired tokens are rejected even if the signature is valid
 *   * `nbf` — a token that is not valid yet is rejected
 *   * `aud` — must be `authenticated`; a token minted for another audience is
 *     not a user session
 *   * `role` — must be `authenticated`, never `anon` or `service_role`
 *   * `iss` — must be the configured Supabase project, when configured
 *
 * Rejecting `anon` matters: the anon key is a validly-signed JWT that ships in
 * the browser bundle. Without this check, the anon key itself would pass as a
 * bearer token and every "protected" endpoint would be open.
 */

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

export type AuthResult =
  | { readonly ok: true; readonly user: AuthenticatedUser }
  | { readonly ok: false; readonly reason: AuthFailureReason }

export interface TokenVerifierConfig {
  /** Shared HMAC secret from the Supabase project settings. */
  readonly jwtSecret: string
  /** Expected `iss`, e.g. `https://<ref>.supabase.co/auth/v1`. Optional. */
  readonly issuer?: string | undefined
  /** Injected for tests; defaults to `Date.now`. */
  readonly now?: (() => number) | undefined
}

const TEXT_ENCODER = new TextEncoder()

/**
 * The key type, derived rather than named.
 *
 * `api/tsconfig.json` deliberately excludes the DOM lib, so the global
 * `CryptoKey` here comes from Node's webcrypto typings and is a *value*, not a
 * type alias. Referring to it as a type does not compile. Deriving it from the
 * API we actually call is both portable and self-maintaining.
 */
type ImportedCryptoKey = Awaited<ReturnType<typeof globalThis.crypto.subtle.importKey>>

function decodeBase64Url(segment: string): Uint8Array | null {
  // `atob` deals in base64, JWT uses base64url. Convert, and pad to a multiple
  // of 4 — atob rejects unpadded input in some runtimes.
  const normalised = segment.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalised.padEnd(normalised.length + ((4 - (normalised.length % 4)) % 4), '=')
  try {
    const binary = globalThis.atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
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

/**
 * Build a verifier bound to one project's secret.
 *
 * Returns a function so the secret is captured once and the crypto key is
 * imported lazily — importing on every request would be wasteful, importing at
 * module scope would break in an environment without WebCrypto.
 */
export function createTokenVerifier(config: TokenVerifierConfig) {
  let keyPromise: Promise<ImportedCryptoKey> | null = null

  function getKey(): Promise<ImportedCryptoKey> | null {
    if (config.jwtSecret.length === 0) return null
    keyPromise ??= globalThis.crypto.subtle.importKey(
      'raw',
      TEXT_ENCODER.encode(config.jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    return keyPromise
  }

  return async function verify(
    header: string | null | undefined,
  ): Promise<AuthResult> {
    const token = parseBearerToken(header)
    if (token === null) return { ok: false, reason: 'MISSING' }

    const parts = token.split('.')
    if (parts.length !== 3) return { ok: false, reason: 'MALFORMED' }
    const [encodedHeader, encodedPayload, encodedSignature] = parts as [
      string,
      string,
      string,
    ]

    const tokenHeader = decodeJson(encodedHeader)
    if (tokenHeader === null) return { ok: false, reason: 'MALFORMED' }

    // Only HMAC algorithms can be verified with a shared secret. `none` must
    // never be accepted, and we do not silently downgrade to "skip the check".
    if (tokenHeader['alg'] !== 'HS256') {
      return { ok: false, reason: 'ALGORITHM_UNSUPPORTED' }
    }

    const key = getKey()
    if (key === null) return { ok: false, reason: 'SECRET_MISSING' }

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
      // WebCrypto verifies HMAC in constant time internally, so no manual
      // constant-time comparison is needed *and none is written here*.
      //
      // An earlier version re-signed the token as a "belt and braces" fallback
      // and compared bytes itself. That was worse than useless: the imported
      // key only carried the `verify` usage, so `subtle.sign` threw
      // `InvalidAccessError` for exactly the tokens it was meant to reject —
      // turning every forged token into a 500 instead of a 401. Bad signatures
      // are expected input, not exceptional conditions, so this path must
      // return a value, never throw.
      signatureValid = await globalThis.crypto.subtle.verify(
        'HMAC',
        await key,
        signature,
        signedPortion,
      )
    } catch {
      return { ok: false, reason: 'BAD_SIGNATURE' }
    }

    if (!signatureValid) {
      return { ok: false, reason: 'BAD_SIGNATURE' }
    }

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
  return reason === 'SECRET_MISSING'
    ? 'Sign-in is temporarily unavailable. Please try again shortly.'
    : 'Please sign in to continue.'
}
