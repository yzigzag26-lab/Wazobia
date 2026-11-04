/**
 * A minimal, runtime-agnostic HTTP shape for the API.
 *
 * Handlers are written against this instead of Vercel's `VercelRequest` /
 * `VercelResponse` for one practical reason: those types drag in the whole
 * Node-serverless environment, which makes a handler awkward to call from a
 * test. With this shape a handler is a pure `(request) => response` function,
 * so `api/_lib/handlers.test.ts` can exercise it directly with a plain object —
 * no server, no port, no mocking framework.
 *
 * `api/v1/languages.ts` adapts the real Vercel request into this type and the
 * returned `HttpResponse` back out. That adapter is the only place that knows
 * about the platform.
 */

export interface HttpRequest {
  readonly method: string
  /** Path parameters, already URL-decoded by the adapter. */
  readonly params: Readonly<Record<string, string>>
  /** Query string parameters. Repeated keys keep the FIRST value, which is the
   *  only sane choice for our endpoints and avoids a caller smuggling an array. */
  readonly query: Readonly<Record<string, string>>
  /** Parsed JSON body, or `undefined` when absent / not JSON. */
  readonly body: unknown
  /** Raw `Authorization` header, if the client supplied one. */
  readonly authorization: string | null
  /** Correlation id from the platform, if any. */
  readonly requestIdHeader: string | null
}

export interface HttpResponse {
  readonly status: number
  readonly body: unknown
  readonly headers: Readonly<Record<string, string>>
}

/** Build a JSON response with no caching by default. */
export function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): HttpResponse {
  return {
    status,
    body,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Never let a shared cache retain an authenticated or personalised body.
      // Endpoints that are genuinely public opt in to caching explicitly.
      'cache-control': 'no-store',
      ...headers,
    },
  }
}
