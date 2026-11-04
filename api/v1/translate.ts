/**
 * `POST /api/v1/translate` — Vercel serverless entry point.
 *
 * Thin adapter, like the other endpoints. The provider key is read here and
 * passed down; it never leaves the server.
 */

import { createTranslateHandler } from '../_lib/translate/handler.js'
import { selectProvider } from '../_lib/ai/provider.js'

interface PlatformRequest {
  readonly method?: string | undefined
  readonly body?: unknown
  readonly headers: Record<string, string | string[] | undefined>
}

interface PlatformResponse {
  status(code: number): PlatformResponse
  setHeader(name: string, value: string): PlatformResponse
  json(body: unknown): void
  end(body?: string): void
}

function firstHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const value = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default async function handler(
  request: PlatformRequest,
  response: PlatformResponse,
): Promise<void> {
  const requestIdHeader = firstHeader(request.headers, 'x-request-id')

  // `selectProvider` returns null when no key is configured, which the handler
  // reports as PROVIDER_UNAVAILABLE rather than inventing a translation.
  const run = createTranslateHandler(selectProvider())

  const result = await run({
    method: request.method ?? 'POST',
    params: {},
    query: {},
    body: request.body,
    authorization: firstHeader(request.headers, 'authorization'),
    requestIdHeader,
  })

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
