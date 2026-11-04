import { env } from '@/config/env'
import {
  type ApiEnvelope,
  type ApiErrorCode,
  type ClientErrorCode,
  API_ERROR_MESSAGES,
} from './contracts/envelope'

/**
 * The single outbound HTTP boundary for the application.
 *
 * Blueprint §6.1: the frontend may only call WAZOBIA application APIs. It never
 * calls an AI provider, never holds a provider credential, and never performs a
 * privileged operation directly from the browser.
 *
 * Every failure is normalised into one `WazobiaApiError` so that features
 * render a single, predictable set of states. Nothing here fabricates data.
 */

export interface WazobiaApiErrorOptions {
  readonly code: ApiErrorCode | ClientErrorCode
  readonly status: number
  readonly requestId?: string | undefined
  readonly details?: Record<string, unknown> | undefined
  readonly message?: string | undefined
  readonly cause?: unknown
}

export class WazobiaApiError extends Error {
  readonly code: ApiErrorCode | ClientErrorCode
  readonly status: number
  readonly requestId: string | undefined
  readonly details: Record<string, unknown> | undefined

  constructor(options: WazobiaApiErrorOptions) {
    super(options.message ?? API_ERROR_MESSAGES[options.code], { cause: options.cause })
    this.name = 'WazobiaApiError'
    this.code = options.code
    this.status = options.status
    this.requestId = options.requestId
    this.details = options.details
  }

  /** True when the cause is a missing backend or missing configuration. */
  get isUnavailable(): boolean {
    return this.code === 'NOT_CONFIGURED' || this.code === 'NETWORK_ERROR'
  }
}

const STATUS_TO_CODE: Readonly<Record<number, ApiErrorCode>> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'SEMANTIC_ERROR',
  429: 'RATE_LIMITED',
  502: 'PROVIDER_UNAVAILABLE',
  503: 'PROVIDER_UNAVAILABLE',
  504: 'PROVIDER_UNAVAILABLE',
}

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  readonly body?: unknown
  /** Bearer token for authenticated endpoints. Supplied by the auth layer. */
  readonly accessToken?: string | undefined
  readonly signal?: AbortSignal | undefined
  readonly headers?: Record<string, string> | undefined
}

function buildUrl(path: string): string {
  const base = env.apiOrigin ?? ''
  return `${base}/api/${env.apiVersion}${path}`
}

async function parseEnvelope<T>(
  response: Response,
): Promise<ApiEnvelope<T> | null> {
  try {
    const payload: unknown = await response.json()
    if (typeof payload !== 'object' || payload === null) return null
    const candidate = payload as { success?: unknown }
    if (candidate.success !== true && candidate.success !== false) return null
    return payload as ApiEnvelope<T>
  } catch {
    return null
  }
}

/**
 * Performs a request against the WAZOBIA API and unwraps the success payload.
 *
 * @throws {WazobiaApiError} for every non-success outcome.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, accessToken, signal, headers } = options

  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method,
      signal: signal ?? null,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw new WazobiaApiError({ code: 'ABORTED', status: 0, cause })
    }
    /**
     * No response at all. In development this almost always means the API is not
     * running; in production it means the network failed. Either way the honest
     * answer is "unavailable", not a fabricated success.
     */
    throw new WazobiaApiError({
      code: env.isProduction ? 'NETWORK_ERROR' : 'NOT_CONFIGURED',
      status: 0,
      cause,
    })
  }

  const envelope = await parseEnvelope<T>(response)

  if (!envelope) {
    throw new WazobiaApiError({
      code: 'UNEXPECTED_RESPONSE',
      status: response.status,
      message:
        response.status === 404
          ? 'This endpoint is not available on the WAZOBIA API yet.'
          : undefined,
    })
  }

  if (!envelope.success) {
    throw new WazobiaApiError({
      code: envelope.error.code,
      status: response.status,
      requestId: envelope.error.request_id,
      details: envelope.error.details,
      message: envelope.error.message,
    })
  }

  if (!response.ok) {
    throw new WazobiaApiError({
      code: STATUS_TO_CODE[response.status] ?? 'INTERNAL_ERROR',
      status: response.status,
      requestId: envelope.request_id,
    })
  }

  return envelope.data
}

/** Narrowing helper for consumers that prefer a result object to an exception. */
export type Result<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: WazobiaApiError }

export async function safely<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await promise }
  } catch (error) {
    if (error instanceof WazobiaApiError) return { ok: false, error }
    return {
      ok: false,
      error: new WazobiaApiError({ code: 'INTERNAL_ERROR', status: 0, cause: error }),
    }
  }
}
