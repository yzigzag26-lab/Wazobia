/**
 * Response envelopes for the WAZOBIA API.
 *
 * These types are a deliberate mirror of `src/services/contracts/envelope.ts`.
 * They are duplicated rather than imported because `api/` and `src/` are
 * separate compilation units with different runtimes: `src/` is bundled for the
 * browser and must never pull server code into the client graph, and `api/` must
 * never depend on a module that assumes `window` exists.
 *
 * The duplication is not left to trust. `api/_lib/contract.test.ts` imports
 * BOTH definitions and asserts they agree, so the two copies cannot silently
 * drift. If you change one, that test tells you to change the other.
 *
 * Rules the frontend already depends on:
 *   - `success` is always present and boolean.
 *   - `request_id` is on every response (top level on success, inside `error`
 *     on failure) and is surfaced to users for support.
 *   - `error.code` comes from a closed set.
 *   - `error.message` is safe to show a user: no stack traces, no provider
 *     names, no personal data.
 */

/** Stable machine-readable error codes. Mirrors `ApiErrorCode`. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'SEMANTIC_ERROR'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export interface ApiErrorPayload {
  readonly code: ApiErrorCode
  readonly message: string
  readonly details?: Record<string, unknown>
  readonly request_id: string
}

export interface ApiSuccessEnvelope<T> {
  readonly success: true
  readonly data: T
  readonly request_id: string
}

export interface ApiErrorEnvelope {
  readonly success: false
  readonly error: ApiErrorPayload
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope

/** The HTTP status each error code is documented to use (contract §1). */
export const ERROR_STATUS: Readonly<Record<ApiErrorCode, number>> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  SEMANTIC_ERROR: 422,
  RATE_LIMITED: 429,
  PROVIDER_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
}

/**
 * User-facing copy per code.
 *
 * These are written for a person, not a developer. They deliberately say
 * nothing about which upstream provider failed or why — leaking "Groq returned
 * 429" would tell a user something about our infrastructure they do not need
 * and could be used to probe it.
 */
export const ERROR_MESSAGE: Readonly<Record<ApiErrorCode, string>> = {
  VALIDATION_ERROR: 'Some of the details in this request are not valid.',
  UNAUTHENTICATED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to do that.',
  NOT_FOUND: 'We could not find what you were looking for.',
  CONFLICT: 'That action conflicts with the current state. Please refresh and try again.',
  PAYLOAD_TOO_LARGE: 'That file or request is too large.',
  SEMANTIC_ERROR: 'The request could not be processed as submitted.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  PROVIDER_UNAVAILABLE: 'A language service is temporarily unavailable. Please try again.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
}

/** Build a success envelope. */
export function successEnvelope<T>(data: T, requestId: string): ApiSuccessEnvelope<T> {
  return { success: true, data, request_id: requestId }
}

/**
 * Build an error envelope.
 *
 * `details` is omitted when absent rather than set to `undefined`, because
 * `JSON.stringify` would drop it anyway and `exactOptionalPropertyTypes` treats
 * the two differently.
 */
export function errorEnvelope(
  code: ApiErrorCode,
  requestId: string,
  options: { message?: string; details?: Record<string, unknown> } = {},
): ApiErrorEnvelope {
  const error: ApiErrorPayload = {
    code,
    // A caller-supplied message must still be safe to display. Call sites pass
    // only static, reviewed copy — never an exception message.
    message: options.message ?? ERROR_MESSAGE[code],
    request_id: requestId,
    ...(options.details === undefined ? {} : { details: options.details }),
  }
  return { success: false, error }
}
