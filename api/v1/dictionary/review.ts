/**
 * `GET|POST /api/v1/dictionary/review` — reviewer/admin only.
 *
 * Layered authorisation (see `_lib/dictionary/review-handler.ts` and
 * `supabase/migrations/0005_dictionary_review.sql`):
 *
 *   protect()  →  requireRole()  →  Postgres `wazobia_is_reviewer()`
 *
 * The last layer is the one that matters: a client cannot talk its way past a
 * `raise exception` inside a SECURITY DEFINER function.
 */

import { createDictionaryReviewHandler } from '../../_lib/dictionary/review-handler.js'
import { createRestReviewRepository } from '../../_lib/dictionary/review-repository.js'
import { createTokenVerifier } from '../../_lib/auth/verify.js'
import { protect, requireRole } from '../../_lib/auth/guard.js'
import { createRestUserLookup } from '../../_lib/auth/users.js'
import { createRestRateLimiter } from '../../_lib/rate-limit.js'
import { readServerConfig, issuerFor } from '../../_lib/config.js'
import { jsonResponse } from '../../_lib/http.js'
import { errorEnvelope } from '../../_lib/envelope.js'
import { resolveRequestId } from '../../_lib/request-id.js'
import { toHttpRequest, send, type PlatformRequest, type PlatformResponse } from '../../_lib/platform.js'

export default async function handler(
  request: PlatformRequest,
  response: PlatformResponse,
): Promise<void> {
  const config = readServerConfig()
  const httpRequest = toHttpRequest(request)
  const requestId = resolveRequestId(httpRequest.requestIdHeader)

  if (
    config.supabaseJwtSecret === null ||
    config.supabaseUrl === null ||
    config.supabaseAnonKey === null
  ) {
    send(
      response,
      jsonResponse(
        503,
        errorEnvelope('PROVIDER_UNAVAILABLE', requestId, {
          message: 'Review is not configured on this deployment.',
        }),
      ),
    )
    return
  }

  const verify = createTokenVerifier({
    jwtSecret: config.supabaseJwtSecret,
    issuer: issuerFor(config),
  })

  const users = createRestUserLookup({
    supabaseUrl: config.supabaseUrl,
    anonKey: config.supabaseAnonKey,
  })

  const review = createDictionaryReviewHandler({
    repository: createRestReviewRepository({
      supabaseUrl: config.supabaseUrl,
      anonKey: config.supabaseAnonKey,
    }),
    rateLimiter: createRestRateLimiter({
      supabaseUrl: config.supabaseUrl,
      anonKey: config.supabaseAnonKey,
    }),
  })

  const guarded = requireRole(
    (userId, authorization) => users.getRoles(userId, authorization),
    ['reviewer', 'admin'],
    review,
  )

  const result = await protect(verify, guarded, httpRequest)

  send(response, result)
}
