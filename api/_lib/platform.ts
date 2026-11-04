/**
 * Vercel request/response adaptation, in one place.
 *
 * Before this module, `api/v1/*` each carried its own copy of `PlatformRequest`,
 * `PlatformResponse`, `firstHeader` and the write-back loop. Four copies of an
 * adapter is four chances for one of them to forget a header — and the header
 * in question here is `Authorization`, which decides who the caller is.
 *
 * The loop below is the only supported way for an entry point to write a
 * response, so adding a header in one place adds it everywhere.
 */

import type { HttpRequest, HttpResponse } from './http.js'

export interface PlatformRequest {
  readonly method?: string | undefined
  readonly body?: unknown
  readonly query?: Record<string, string | string[] | undefined> | undefined
  readonly headers: Record<string, string | string[] | undefined>
}

export interface PlatformResponse {
  status(code: number): PlatformResponse
  setHeader(name: string, value: string): PlatformResponse
  json(body: unknown): void
  end(body?: string): void
}

/**
 * Read a header case-insensitively, keeping the FIRST value of a repeated
 * header. Array-valued headers arrive when a proxy forwards duplicates; taking
 * the last would let a crafted request override the real one.
 */
export function firstHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const direct = headers[name]
  const lower = headers[name.toLowerCase()]
  const value = direct ?? lower
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

/**
 * Flatten the platform's query object into the contract's single-string map.
 *
 * Repeated keys keep the first value for the same reason as headers.
 */
function normaliseQuery(
  query: Record<string, string | string[] | undefined> | undefined,
): Record<string, string> {
  const output: Record<string, string> = {}
  if (query === undefined) return output
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      output[key] = value
    } else if (Array.isArray(value) && value[0] !== undefined) {
      output[key] = value[0]
    }
  }
  return output
}

/** Adapt a platform request. `params` comes from the dynamic route segment. */
export function toHttpRequest(
  request: PlatformRequest,
  params: Record<string, string> = {},
): HttpRequest {
  return {
    method: request.method ?? 'GET',
    params,
    query: normaliseQuery(request.query),
    body: request.body,
    authorization: firstHeader(request.headers, 'authorization'),
    requestIdHeader: firstHeader(request.headers, 'x-request-id'),
  }
}

/** Write an `HttpResponse` back to the platform response. */
export function send(response: PlatformResponse, result: HttpResponse): void {
  response.status(result.status)
  for (const [name, value] of Object.entries(result.headers)) {
    response.setHeader(name, value)
  }
  if (result.body === undefined) {
    response.end()
    return
  }
  response.json(result.body)
}
