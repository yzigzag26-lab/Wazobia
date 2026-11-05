/**
 * `POST /api/v1/translate` — Vercel serverless entry point.
 *
 * PROTECTED: requires `Authorization: Bearer <supabase access token>`.
 *
 * Why this endpoint is authenticated at all — the product is free to browse, and
 * an earlier draft left translation open. Two reasons changed that:
 *
 *   1. Every call spends a paid provider credit. An unauthenticated endpoint
 *      that costs money per request is a standing invitation to drain the
 *      account, and no amount of frontend gating changes that.
 *   2. Attribution. When a translation is wrong, the only way to investigate is
 *      to know whose request produced it.
 *
 * The order of operations is fixed and matters:
 *
 *   verify token  →  rate limit  →  validate body  →  call provider
 *
 * Authentication comes before validation so an anonymous caller learns nothing
 * about the request schema, and rate limiting comes before the provider call so
 * an over-budget caller never costs anything.
 */

import { createTranslateHandler } from '../_lib/translate/handler.js'
import { selectProvider } from '../_lib/ai/provider.js'
import { createTokenVerifier } from '../_lib/auth/verify.js'
import { protect } from '../_lib/auth/guard.js'
import { createRestRateLimiter, createNullRateLimiter } from '../_lib/rate-limit.js'
import { readServerConfig, issuerFor, jwksUrlFor, canAuthenticate } from '../_lib/config.js'
import { jsonResponse } from '../_lib/http.js'
import { errorEnvelope } from '../_lib/envelope.js'
import { resolveRequestId } from '../_lib/request-id.js'
import { toHttpRequest, send, type PlatformRequest, type PlatformResponse } from '../_lib/platform.js'

export default async function handler(
  request: PlatformRequest,
  response: PlatformResponse,
): Promise<void> {
  const config = readServerConfig()
  const httpRequest = toHttpRequest(request)
  const requestId = resolveRequestId(httpRequest.requestIdHeader)

  // No secret means no way to tell one caller from another. Refusing is the
  // only honest option: serving the request would be an open, billable endpoint.
  // Either signing scheme is enough: an HMAC secret covers HS256, the project
  // URL covers ES256 via JWKS. Requiring the secret specifically is what made
  // every protected call 401 on an ES256 project.
  if (!canAuthenticate(config)) {
    send(
      response,
      jsonResponse(
        503,
        errorEnvelope('PROVIDER_UNAVAILABLE', requestId, {
          message: 'Sign-in is not configured on this deployment.',
        }),
      ),
    )
    return
  }

  const verify = createTokenVerifier({
    jwtSecret: config.supabaseJwtSecret,
    jwksUrl: jwksUrlFor(config),
    issuer: issuerFor(config),
  })

  const rateLimiter =
    config.supabaseUrl !== null && config.supabaseAnonKey !== null
      ? createRestRateLimiter({
          supabaseUrl: config.supabaseUrl,
          anonKey: config.supabaseAnonKey,
        })
      : createNullRateLimiter()

  const translate = createTranslateHandler(selectProvider(), { rateLimiter })

  const result = await protect(
    verify,
    (req) => translate(req),
    httpRequest,
  )

  send(response, result)
}
