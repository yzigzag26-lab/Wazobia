/**
 * `GET /api/v1/health` — deployment self-check.
 *
 * ## Why this exists
 *
 * Diagnosing "sign-in doesn't work" took several rounds. Every round required a
 * human to open the browser console, copy a status code, and reason backwards
 * about server configuration that was invisible from outside. The actual cause —
 * the API refusing ES256 tokens because it only accepted HS256 — is a fact the
 * server knows about itself and could simply have reported.
 *
 * This endpoint reports it. It answers one question honestly: *can this
 * deployment authenticate a real user right now?*
 *
 * ## What it deliberately does not do
 *
 *   * It is not a token oracle. It never accepts, echoes, or describes a token.
 *   * It never returns a secret, key, or any part of one. `algorithm` is a
 *     public fact about the token format, not a credential.
 *   * It does not "test" by minting a token. It reports which verification
 *     material is configured, and whether the JWKS is actually reachable —
 *     which is the failure that matters and cannot be inferred from config
 *     alone.
 *
 * ## No fake states
 *
 * `status` is `ok` only when at least one verification scheme is fully usable.
 * A deployment with an HMAC secret but an ES256 project is `degraded`, not
 * `ok`: it will reject every real token, and saying otherwise would recreate
 * the exact confusion this endpoint exists to remove.
 */

import type { HttpResponse } from '../http.js'
import { jsonResponse } from '../http.js'
import { successEnvelope } from '../envelope.js'
import { resolveRequestId } from '../request-id.js'
import type { ServerConfig } from '../config.js'
import { issuerFor, jwksUrlFor } from '../config.js'
import { decodeBase64Url } from '../auth/verify.js'

/**
 * How the deployment can verify tokens.
 *
 *   * `hs256`      — shared secret present (legacy projects)
 *   * `es256`      — JWKS reachable and carries at least one usable key
 *   * `mixed`      — both work; tokens of either scheme are accepted
 *   * `none`       — neither; every protected endpoint will 401/503
 *   * `unverified` — JWKS could not be fetched, so ES256 cannot be confirmed
 */
export type VerificationScheme = 'hs256' | 'es256' | 'mixed' | 'none' | 'unverified'

export interface HealthReport {
  readonly status: 'ok' | 'degraded' | 'down'
  /** Human-readable one-liner safe to show in a support ticket. */
  readonly summary: string
  /** Closed enum, not free text, so a monitor can alert on it. */
  readonly scheme: VerificationScheme
  readonly checks: {
    /** Project URL is configured — required for JWKS and for database access. */
    readonly project_url: boolean
    /** Anon key is configured — required to reach PostgREST as the user. */
    readonly anon_key: boolean
    /** Legacy HMAC secret present. Optional; only used for HS256 tokens. */
    readonly jwt_secret: boolean
    /**
     * JWKS outcome. `not_checked` when no project URL is set, `unreachable`
     * when the fetch failed, `ok` when keys were imported.
     */
    readonly jwks: 'ok' | 'unreachable' | 'not_checked'
    /** Number of usable signing keys found. Never their contents. */
    readonly jwks_key_count: number
  }
  /** Expected token issuer, so a project mismatch is visible. */
  readonly issuer: string | null
  readonly version: string | null
}

export interface HealthDeps {
  readonly config: ServerConfig
  /** Injected so tests never reach the network. */
  readonly fetchJwks?: ((url: string) => Promise<JwksProbe>) | undefined
  readonly version?: string | undefined
}

export interface JwksProbe {
  readonly reachable: boolean
  readonly keyCount: number
  readonly algorithms: readonly string[]
}

/** Fetch a JWKS and summarise it without importing anything. */
export async function probeJwks(url: string): Promise<JwksProbe> {
  try {
    const response = await globalThis.fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(4_000),
    })
    if (!response.ok) return { reachable: false, keyCount: 0, algorithms: [] }

    const document: unknown = await response.json()
    const list =
      typeof document === 'object' && document !== null
        ? (document as { keys?: unknown }).keys
        : undefined
    if (!Array.isArray(list)) return { reachable: true, keyCount: 0, algorithms: [] }

    const algorithms = new Set<string>()
    let keyCount = 0
    for (const entry of list as { alg?: unknown; kty?: unknown; crv?: unknown }[]) {
      if (typeof entry !== 'object' || entry === null) continue
      keyCount += 1
      if (typeof entry.alg === 'string') {
        algorithms.add(entry.alg)
      } else if (entry.kty === 'EC' && entry.crv === 'P-256') {
        algorithms.add('ES256')
      } else if (entry.kty === 'RSA') {
        algorithms.add('RS256')
      }
    }
    return { reachable: true, keyCount, algorithms: [...algorithms].toSorted() }
  } catch {
    return { reachable: false, keyCount: 0, algorithms: [] }
  }
}

/**
 * Derive the scheme from what is configured.
 *
 * This is the decision the old code got wrong, so it is a named function with
 * its own tests rather than an `if` buried in a handler.
 */
export function resolveScheme(input: {
  readonly hasSecret: boolean
  readonly jwks: 'ok' | 'unreachable' | 'not_checked'
}): VerificationScheme {
  const asymmetric = input.jwks === 'ok'

  if (input.hasSecret && asymmetric) return 'mixed'
  if (input.hasSecret) return 'hs256'
  if (asymmetric) return 'es256'
  // No secret and no keys. Distinguish an outage from an unconfigured
  // deployment: the first is transient and the second needs a human.
  return input.jwks === 'unreachable' ? 'unverified' : 'none'
}

export function buildHealthReport(input: {
  readonly config: ServerConfig
  readonly jwks: JwksProbe
  readonly version?: string | undefined
}): HealthReport {
  const { config, jwks } = input
  const hasUrl = config.supabaseUrl !== null
  const hasAnonKey = config.supabaseAnonKey !== null
  const hasSecret =
    config.supabaseJwtSecret !== null && config.supabaseJwtSecret.length > 0

  const jwksState: HealthReport['checks']['jwks'] = !hasUrl
    ? 'not_checked'
    : jwks.reachable && jwks.keyCount > 0
      ? 'ok'
      : 'unreachable'

  const scheme = resolveScheme({ hasSecret, jwks: jwksState })

  // `ok` requires a scheme that will actually accept a real token.
  const status: HealthReport['status'] =
    scheme === 'none' ? 'down' : scheme === 'unverified' ? 'degraded' : 'ok'

  let summary: string
  if (scheme === 'es256' || scheme === 'mixed') {
    summary = `Ready. Tokens verified against ${String(jwks.keyCount)} published key${
      jwks.keyCount === 1 ? '' : 's'
    } (${jwks.algorithms.join(', ') || 'unknown algorithm'}).`
  } else if (scheme === 'hs256') {
    summary = 'Ready. Tokens verified with the legacy HMAC secret (HS256 only).'
  } else if (scheme === 'unverified') {
    summary =
      'Degraded. No HMAC secret is set and the project key set could not be fetched, so no token can be verified.'
  } else {
    summary =
      'Down. Neither an HMAC secret nor a reachable project key set is configured; protected endpoints will reject every request.'
  }

  // A URL without an anon key is still broken: the token verifies but the
  // profile lookup cannot run. Report it rather than claim `ok`.
  const degradedForDatabase = hasUrl && !hasAnonKey
  const finalStatus: HealthReport['status'] =
    status === 'ok' && degradedForDatabase ? 'degraded' : status

  return {
    status: finalStatus,
    summary: degradedForDatabase
      ? `${summary.replace(/^Ready\. /, '')} Database access is unconfigured (no anon key), so profile lookups will fail.`
      : summary,
    scheme,
    checks: {
      project_url: hasUrl,
      anon_key: hasAnonKey,
      jwt_secret: hasSecret,
      jwks: jwksState,
      jwks_key_count: jwks.keyCount,
    },
    issuer: issuerFor(config) ?? null,
    version: input.version ?? null,
  }
}

/**
 * Build the handler.
 *
 * Public by design: it is reachable without a token, which is what lets a
 * maintainer check a deployment from a browser or `curl`. Everything it returns
 * is already visible to anyone holding the anon key that ships in the bundle.
 */
export function createHealthHandler(deps: HealthDeps) {
  return async function handle(request: {
    requestIdHeader: string | null | undefined
  }): Promise<HttpResponse> {
    const requestId = resolveRequestId(request.requestIdHeader)

    const url = jwksUrlFor(deps.config)
    let jwks: JwksProbe = { reachable: false, keyCount: 0, algorithms: [] }

    if (url !== undefined) {
      const probe = deps.fetchJwks ?? probeJwks
      jwks = await probe(url)
    }

    // `version` is the deployment's own build identifier. It is public, and it
    // is the thing that tells a user whether they are looking at a stale tab.
    const report = buildHealthReport({
      config: deps.config,
      jwks,
      ...(deps.version === undefined ? {} : { version: deps.version }),
    })

    // A degraded or down deployment still answers 200: the endpoint itself
    // worked, and the caller needs the body. Returning 503 would make most
    // monitors show "unreachable" instead of the actual reason.
    return jsonResponse(
      200,
      successEnvelope(report, requestId),
      // Never cache a health report: a stale `ok` is worse than no report.
      { 'cache-control': 'no-store' },
    )
  }
}

/**
 * Exported for the field-format test: a JWKS `x` coordinate must be valid
 * base64url. Kept public so the verifier and the health probe cannot drift on
 * what "a well-formed key" means.
 */
export function isBase64UrlCoordinate(value: unknown): boolean {
  if (typeof value !== 'string' || value.length === 0) return false
  return decodeBase64Url(value) !== null
}
