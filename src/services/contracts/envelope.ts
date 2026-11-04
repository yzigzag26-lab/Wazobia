/**
 * Shared API contract types.
 *
 * Blueprint §10.2/§10.4: consistent success and error envelopes with stable
 * machine-readable error codes. Every endpoint contract in
 * `src/services/contracts/` is written against these types, and every UI state
 * rendering decision is derived from them.
 *
 * There is deliberately no `mock` variant here. If an endpoint is not
 * implemented server-side, the client surfaces `unavailable` — it never invents
 * a successful response.
 */

/** Stable machine-readable error codes. Extend only with backend agreement. */
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

/** Client-side conditions that occur before a response is ever received. */
export type ClientErrorCode =
  | 'NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'UNEXPECTED_RESPONSE'
  | 'ABORTED'

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

/** Human-readable fallback copy for each error condition. */
export const API_ERROR_MESSAGES: Readonly<Record<ApiErrorCode | ClientErrorCode, string>> = {
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
  NOT_CONFIGURED: 'This service is not connected yet.',
  NETWORK_ERROR: 'We could not reach WAZOBIA. Check your connection and try again.',
  UNEXPECTED_RESPONSE: 'WAZOBIA returned a response we could not read.',
  ABORTED: 'The request was cancelled.',
}
