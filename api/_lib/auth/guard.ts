/**
 * Guards for protected endpoints.
 *
 * Every authenticated endpoint is written as a handler that receives an
 * `AuthenticatedUser`, so the type system prevents a handler from forgetting to
 * identify the caller: it cannot be invoked without one.
 *
 * ```
 * export function createThingHandler(deps: Deps) {
 *   return async (request: HttpRequest, caller: AuthenticatedUser): Promise<HttpResponse> => {…}
 * }
 * ```
 *
 * The adapter in `api/v1/*` calls `protect(verify, handler, request)`, which
 * verifies the token first and only then runs the handler. There is no code
 * path where the handler runs with a null user.
 */

import type { HttpRequest, HttpResponse } from '../http.js'
import { jsonResponse } from '../http.js'
import { errorEnvelope } from '../envelope.js'
import { resolveRequestId } from '../request-id.js'
import type { AuthResult, AuthenticatedUser } from './verify.js'
import { authFailureMessage } from './verify.js'

export type VerifyToken = (
  authorization: string | null | undefined,
) => Promise<AuthResult>

/** What a protected handler is allowed to look like. */
export type ProtectedHandler = (
  request: HttpRequest,
  caller: AuthenticatedUser,
) => Promise<HttpResponse>

/**
 * Verify, then run.
 *
 * The response for a failure is a complete `HttpResponse` — callers do not have
 * to build one, and cannot accidentally build one with a 200.
 */
export async function protect(
  verify: VerifyToken,
  handler: ProtectedHandler,
  request: HttpRequest,
): Promise<HttpResponse> {
  const requestId = resolveRequestId(request.requestIdHeader)
  const result = await verify(request.authorization)

  if (!result.ok) {
    return jsonResponse(
      401,
      errorEnvelope('UNAUTHENTICATED', requestId, {
        message: authFailureMessage(result.reason),
        // The reason is a closed enum, not attacker-controlled text, so echoing
        // it is safe and makes a support conversation possible.
        details: { reason: result.reason },
      }),
    )
  }

  return handler(request, result.user)
}

/**
 * Require one of `allowed` roles.
 *
 * Roles live in `public.user_roles` and are read with the caller's own token, so
 * Row Level Security decides what is visible. A user cannot see another user's
 * roles, and cannot grant themselves one: `user_roles` has no client INSERT
 * grant (see migration 0004).
 *
 * Note the deliberate shape: this returns a *new* handler rather than a boolean.
 * A boolean can be ignored; a wrapper cannot.
 */
export type RoleLoader = (userId: string, authorization: string | null) => Promise<readonly string[]>

export function requireRole(
  roleLoader: RoleLoader,
  allowed: readonly string[],
  handler: ProtectedHandler,
): ProtectedHandler {
  return async (request, caller) => {
    const requestId = resolveRequestId(request.requestIdHeader)
    const roles = await roleLoader(caller.id, request.authorization)

    if (!roles.some((role) => allowed.includes(role))) {
      return jsonResponse(
        403,
        errorEnvelope('FORBIDDEN', requestId, { details: { required_roles: [...allowed] } }),
      )
    }

    return handler(request, caller)
  }
}
