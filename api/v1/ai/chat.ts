/**
 * `POST /api/v1/ai/chat` — Vercel serverless entry point.
 *
 * PROTECTED: requires `Authorization: Bearer <supabase access token>`.
 *
 * Same ordering as `/translate` — verify, rate limit, validate, then spend a
 * provider credit. See `api/v1/translate.ts` for the full rationale.
 *
 * The dictionary lookup used for citations runs with the anon key: it reads only
 * approved rows, which are public by design. The caller's token is deliberately
 * NOT forwarded here, because a citation must be provably public rather than
 * merely visible to whoever happens to be asking.
 */

import { createChatHandler } from '../../_lib/ai/chat-handler.js'
import { selectProvider } from '../../_lib/ai/provider.js'
import { createRestDictionaryRepository } from '../../_lib/dictionary/repository.js'
import { createTokenVerifier } from '../../_lib/auth/verify.js'
import { protect } from '../../_lib/auth/guard.js'
import { createRestRateLimiter, createNullRateLimiter } from '../../_lib/rate-limit.js'
import { readServerConfig, issuerFor, jwksUrlFor, canAuthenticate } from '../../_lib/config.js'
import { jsonResponse } from '../../_lib/http.js'
import { errorEnvelope } from '../../_lib/envelope.js'
import { resolveRequestId } from '../../_lib/request-id.js'
import { toHttpRequest, send, type PlatformRequest, type PlatformResponse } from '../../_lib/platform.js'
import type { ApprovedEntryLookup } from '../../_lib/ai/chat-handler.js'

function buildLookup(
  supabaseUrl: string | null,
  anonKey: string | null,
): ApprovedEntryLookup | null {
  if (supabaseUrl === null || anonKey === null) return null

  const repository = createRestDictionaryRepository({ supabaseUrl, anonKey })

  return {
    async findApproved(term) {
      const page = await repository.search(term, null, 3, 0)
      // `dictionary_approved_read` already filters this in the database. The
      // filter is restated here because a citation must be provably approved,
      // not approved-by-assumption.
      return page.results
        .filter((row) => row.review_status === 'approved')
        .map((row) => ({ id: row.id, headword: row.headword, gloss: row.gloss }))
    },
  }
}

export default async function handler(
  request: PlatformRequest,
  response: PlatformResponse,
): Promise<void> {
  const config = readServerConfig()
  const httpRequest = toHttpRequest(request)
  const requestId = resolveRequestId(httpRequest.requestIdHeader)

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

  const chat = createChatHandler(selectProvider(), buildLookup(config.supabaseUrl, config.supabaseAnonKey), {
    rateLimiter,
  })

  const result = await protect(verify, (req) => chat(req), httpRequest)

  send(response, result)
}
