/**
 * `GET /api/v1/dictionary/search` — Vercel serverless entry point.
 *
 * Thin, like `api/v1/languages.ts`: adapt the platform request into the
 * runtime-agnostic `HttpRequest`, delegate to `_lib`, write the response back.
 *
 * Uses the PUBLIC ANON KEY, never the service-role key. The
 * `dictionary_approved_read` policy already restricts this table to approved
 * rows for anonymous callers, so the endpoint cannot expose unreviewed content
 * even if the query were wrong.
 */

import { createDictionarySearchHandler } from '../../_lib/dictionary/handler.js'
import { createRestDictionaryRepository } from '../../_lib/dictionary/repository.js'
import { jsonResponse } from '../../_lib/http.js'
import { errorEnvelope } from '../../_lib/envelope.js'
import { resolveRequestId } from '../../_lib/request-id.js'

interface PlatformRequest {
  readonly method?: string | undefined
  readonly query?: Record<string, string | string[] | undefined> | undefined
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

function firstQuery(query: PlatformRequest['query'], name: string): string | undefined {
  const value = query?.[name]
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

function queryParams(request: PlatformRequest): Record<string, string> {
  const collected: Record<string, string> = {}
  for (const name of ['q', 'language', 'page', 'page_size']) {
    const value = firstQuery(request.query, name)
    if (value !== undefined) collected[name] = value
  }
  return collected
}

function buildHandler() {
  const url = process.env['SUPABASE_URL']?.trim()
  const anonKey = process.env['SUPABASE_ANON_KEY']?.trim()
  if (!url || !anonKey) return null

  return createDictionarySearchHandler(
    createRestDictionaryRepository({ supabaseUrl: url, anonKey }),
  )
}

export default async function handler(
  request: PlatformRequest,
  response: PlatformResponse,
): Promise<void> {
  const requestIdHeader = firstHeader(request.headers, 'x-request-id')
  const run = buildHandler()

  const result =
    run === null
      ? jsonResponse(500, errorEnvelope('INTERNAL_ERROR', resolveRequestId(requestIdHeader)))
      : await run({
          method: request.method ?? 'GET',
          params: {},
          query: queryParams(request),
          body: undefined,
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
