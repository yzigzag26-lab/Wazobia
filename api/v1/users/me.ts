/**
 * `GET /api/v1/users/me` — Vercel serverless entry point. Contract §2.2.
 *
 * PROTECTED: requires `Authorization: Bearer <supabase access token>`.
 *
 * The caller's token is forwarded to PostgREST, so `profiles_select_own` and
 * `user_roles_select_own` decide what this can read. The handler receives a
 * `caller` argument it cannot fabricate — see `api/_lib/auth/guard.ts`.
 */

import { createUsersMeHandler } from '../../_lib/users/me-handler.js'
import { createRestUserLookup, createEmptyUserLookup } from '../../_lib/auth/users.js'
import { createTokenVerifier } from '../../_lib/auth/verify.js'
import { protect } from '../../_lib/auth/guard.js'
import { createRestRateLimiter, createNullRateLimiter } from '../../_lib/rate-limit.js'
import { readServerConfig, issuerFor } from '../../_lib/config.js'
import { jsonResponse } from '../../_lib/http.js'
import { errorEnvelope } from '../../_lib/envelope.js'
import { resolveRequestId } from '../../_lib/request-id.js'
import {
  toHttpRequest,
  send,
  type PlatformRequest,
  type PlatformResponse,
} from '../../_lib/platform.js'

export default async function handler(
  request: PlatformRequest,
  response: PlatformResponse,
): Promise<void> {
  const config = readServerConfig()
  const httpRequest = toHttpRequest(request)
  const requestId = resolveRequestId(httpRequest.requestIdHeader)

  if (config.supabaseJwtSecret === null) {
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
    issuer: issuerFor(config),
  })

  const canQueryDatabase = config.supabaseUrl !== null && config.supabaseAnonKey !== null

  const users = canQueryDatabase
    ? createRestUserLookup({
        supabaseUrl: config.supabaseUrl as string,
        anonKey: config.supabaseAnonKey as string,
      })
    : createEmptyUserLookup()

  const rateLimiter = canQueryDatabase
    ? createRestRateLimiter({
        supabaseUrl: config.supabaseUrl as string,
        anonKey: config.supabaseAnonKey as string,
      })
    : createNullRateLimiter()

  const usersMe = createUsersMeHandler({ users, rateLimiter })

  const result = await protect(verify, (req, caller) => usersMe(req, caller), httpRequest)

  send(response, result)
}
