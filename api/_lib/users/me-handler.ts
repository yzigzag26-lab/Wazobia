/**
 * `GET /api/v1/users/me` and `PATCH /api/v1/users/me` — contract §2.2.
 *
 * ## Why the caller is never a parameter
 *
 * The subject is resolved from the verified token by the guard, never from a
 * query string or body. There is no `/users/:id` endpoint in this version, and
 * if one is added later it must check ownership explicitly — this handler cannot
 * be tricked into reading or writing somebody else's profile because it never
 * accepts an id to look up.
 *
 * ## Why PATCH exists
 *
 * It did not, and that was the bug behind "the profile page isn't syncing".
 * The page collected a name and a username, validated them, and then wrote them
 * to `localStorage` — a store that nothing else reads and that no account owns.
 * Changing a field on one device changed nothing anywhere else, and the values
 * captured at registration were never visible at all.
 *
 * A profile editor that cannot persist is worse than no editor: it reports
 * success for an operation that did not happen. So the write path is real, and
 * it writes to the row the user actually owns.
 *
 * ## What is validated here rather than in the database
 *
 * Both, deliberately. The database is the authority — CHECK constraints and a
 * unique index enforce the rules even if this code is bypassed — but a 400 from
 * PostgREST is an opaque message, whereas validating here produces the specific
 * field error the form needs to render.
 */

import { successEnvelope, errorEnvelope } from '../envelope.js'
import { resolveRequestId } from '../request-id.js'
import { jsonResponse, type HttpRequest, type HttpResponse } from '../http.js'
import type { AuthenticatedUser } from '../auth/verify.js'
import type { ProfileUpdate, UserLookup } from '../auth/users.js'
import { ProfileWriteError } from '../auth/users.js'
import type { RateLimiter } from '../rate-limit.js'

export interface UsersMeDeps {
  readonly users: UserLookup
  readonly rateLimiter?: RateLimiter | undefined
}

/** Mirrors `profiles_username_format` in migration 0006. */
const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/

/** Mirrors the `display_name` CHECK (80 characters). */
const DISPLAY_NAME_MAX = 80

const ALLOWED_KEYS = new Set(['display_name', 'username', 'preferred_language'])

interface FieldProblem {
  readonly field: string
  readonly message: string
}

/**
 * Validate a PATCH body.
 *
 * Returns either the cleaned update or the list of problems. Unknown keys are
 * rejected rather than ignored: silently dropping a field a client thought it
 * sent is how "I changed it and nothing happened" bugs are born.
 */
export function readProfileUpdate(
  body: unknown,
): { ok: true; update: ProfileUpdate } | { ok: false; problems: FieldProblem[] } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, problems: [{ field: 'body', message: 'Send a JSON object.' }] }
  }

  const raw = body as Record<string, unknown>
  const problems: FieldProblem[] = []
  const update: {
    display_name?: string
    username?: string | null
    preferred_language?: string | null
  } = {}

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_KEYS.has(key)) {
      problems.push({ field: key, message: 'This field cannot be changed.' })
    }
  }

  if ('display_name' in raw) {
    const value = raw['display_name']
    if (typeof value !== 'string') {
      problems.push({ field: 'display_name', message: 'Enter a name.' })
    } else {
      const trimmed = value.trim()
      if (trimmed.length === 0) {
        problems.push({ field: 'display_name', message: 'Enter a name.' })
      } else if (trimmed.length > DISPLAY_NAME_MAX) {
        problems.push({
          field: 'display_name',
          message: `Keep this under ${String(DISPLAY_NAME_MAX)} characters.`,
        })
      } else {
        update.display_name = trimmed
      }
    }
  }

  if ('username' in raw) {
    const value = raw['username']
    // `null` is how a caller clears a handle. An empty string is treated the
    // same way rather than stored, because it fails the format rule anyway and
    // a blank handle is indistinguishable from no handle in the UI.
    if (value === null || value === '') {
      update.username = null
    } else if (typeof value !== 'string') {
      problems.push({ field: 'username', message: 'Enter a username.' })
    } else {
      const normalised = value.trim().toLowerCase()
      if (!USERNAME_PATTERN.test(normalised)) {
        problems.push({
          field: 'username',
          message: '3–24 characters: letters, numbers, underscore or full stop.',
        })
      } else {
        update.username = normalised
      }
    }
  }

  if ('preferred_language' in raw) {
    const value = raw['preferred_language']
    if (value === null || value === '') {
      update.preferred_language = null
    } else if (typeof value !== 'string' || !/^[a-z]{2,3}$/.test(value)) {
      problems.push({ field: 'preferred_language', message: 'Unknown language code.' })
    } else {
      update.preferred_language = value
    }
  }

  if (problems.length > 0) return { ok: false, problems }
  return { ok: true, update }
}

export function createUsersMeHandler(deps: UsersMeDeps) {
  return async function usersMeHandler(
    request: HttpRequest,
    caller: AuthenticatedUser,
  ): Promise<HttpResponse> {
    const requestId = resolveRequestId(request.requestIdHeader)

    if (request.method !== 'GET' && request.method !== 'PATCH') {
      return jsonResponse(
        405,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'This endpoint accepts GET and PATCH.',
        }),
        { allow: 'GET, PATCH' },
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
      if (request.method === 'PATCH') {
        const parsed = readProfileUpdate(request.body)
        if (!parsed.ok) {
          return jsonResponse(
            400,
            errorEnvelope('VALIDATION_ERROR', requestId, {
              message: 'Some of those details need fixing.',
              details: {
                // Shaped so the form can map field -> message directly.
                fields: parsed.problems,
              },
            }),
          )
        }

        profile = await deps.users.updateProfile(
          caller.id,
          request.authorization,
          parsed.update,
          caller.email,
        )
      } else {
        profile = await deps.users.getProfile(caller.id, request.authorization, caller.email)
      }
    } catch (error) {
      if (error instanceof ProfileWriteError) {
        return jsonResponse(
          error.kind === 'CONFLICT' ? 409 : 422,
          errorEnvelope(error.kind === 'CONFLICT' ? 'CONFLICT' : 'SEMANTIC_ERROR', requestId, {
            message: error.message,
          }),
        )
      }
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
