/**
 * `GET /api/v1/users/me` — contract §2.2.
 *
 * Deliberately takes no parameters. The caller is resolved from the verified
 * token by the guard, never from a query string or body. There is no
 * `/users/:id` endpoint in this version, and if one is added later it must
 * check ownership explicitly — this handler cannot be tricked into returning
 * somebody else's profile because it never accepts an id to look up.
 */

import { successEnvelope, errorEnvelope } from '../envelope.js'
import { resolveRequestId } from '../request-id.js'
import { jsonResponse, type HttpRequest, type HttpResponse } from '../http.js'
import type { AuthenticatedUser } from '../auth/verify.js'
import type { UserLookup } from '../auth/users.js'
import type { RateLimiter } from '../rate-limit.js'

export interface UsersMeDeps {
  readonly users: UserLookup
  readonly rateLimiter?: RateLimiter | undefined
}

export function createUsersMeHandler(deps: UsersMeDeps) {
  return async function usersMeHandler(
    request: HttpRequest,
    caller: AuthenticatedUser,
  ): Promise<HttpResponse> {
    const requestId = resolveRequestId(request.requestIdHeader)

    if (request.method !== 'GET') {
      return jsonResponse(
        405,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'This endpoint only accepts GET.',
        }),
        { allow: 'GET' },
      )
    }

    if (deps.rateLimiter !== undefined) {
      const decision = await deps.rateLimiter('users_me', request.authorization)
      if (!decision.allowed) {
        return jsonResponse(
          429,
          errorEnvelope('RATE_LIMITED', requestId, {
            details: { retry_after_seconds: decision.retryAfterSeconds },
          }),
          { 'retry-after': String(decision.retryAfterSeconds) },
        )
      }
    }

    let profile
    try {
      profile = await deps.users.getProfile(caller.id, request.authorization)
    } catch {
      // The message intentionally says nothing about PostgREST or the database.
      return jsonResponse(500, errorEnvelope('INTERNAL_ERROR', requestId))
    }

    if (profile === null) {
      // Two possible causes: the row genuinely does not exist (a user created
      // before the trigger was installed), or RLS hid it. Both are "we cannot
      // show you a profile", and neither justifies inventing one from the JWT
      // claims — a display name the database does not hold would be a lie the
      // UI then persists.
      return jsonResponse(
        404,
        errorEnvelope('NOT_FOUND', requestId, {
          message: 'Your profile could not be loaded. Please sign in again.',
        }),
      )
    }

    return jsonResponse(200, successEnvelope(profile, requestId))
  }
}
