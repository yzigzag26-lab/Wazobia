/**
 * `GET /api/v1/languages` — Vercel serverless entry point.
 *
 * This file is intentionally thin. It adapts the platform's request/response
 * objects into the runtime-agnostic `HttpRequest` / `HttpResponse` pair that
 * `api/_lib/languages/handler.ts` is written against, and it wires the real
 * data source in. All behaviour worth testing lives in `_lib`, where a test can
 * call it without a server.
 *
 * Configuration comes from server-only environment variables:
 *
 *   SUPABASE_URL               — project URL (no trailing slash)
 *   SUPABASE_ANON_KEY          — the PUBLIC anon key
 *
 * The SERVICE-ROLE key is deliberately NOT used here. This endpoint serves
 * public catalogue data and has no business holding a credential that bypasses
 * Row Level Security. `publishable`/`anon` access is sufficient by construction.
 *
 * When configuration is missing the function reports `INTERNAL_ERROR` rather
 * than returning an empty list. An empty list would render as "no languages
 * available", which is a lie about the product; a 500 renders as the honest
 * "something went wrong" state the frontend already has.
 */

import { createLanguagesHandler } from '../_lib/languages/handler.js'
import { createRestLanguageRepository } from '../_lib/languages/repository.js'
import { jsonResponse } from '../_lib/http.js'
import { errorEnvelope } from '../_lib/envelope.js'
import { resolveRequestId } from '../_lib/request-id.js'

/**
 * Minimal structural types for the platform objects.
 *
 * Declaring them locally avoids importing `@vercel/node` — which would add a
 * dependency to the bundle for three properties — and keeps this file
 * typecheckable in the project's own tsconfig.
 */
interface PlatformRequest {
  readonly method?: string | undefined
  readonly query?: Record<string, string | string[] | undefined> | undefined
  readonly body?: unknown
  readonly headers: Record<string, string | string[] | undefined>
}

interface PlatformResponse {
  status(code: number): PlatformResponse
  setHeader(name: string, value: string): PlatformResponse
  json(body: unknown): void
  end(body?: string): void
}

/** Collapse a header that may be a single value or an array. */
function firstHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const value = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

/** Collapse a query param that may be a single value or an array. */
function firstQuery(query: PlatformRequest['query'], name: string): string | undefined {
  const value = query?.[name]
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

/**
 * Collect the query parameters this endpoint understands.
 *
 * Built explicitly rather than spread from `request.query`, because the platform
 * object can carry array values and extra keys. An endpoint should read only the
 * parameters it documents.
 */
function queryParams(request: PlatformRequest): Record<string, string> {
  const collected: Record<string, string> = {}
  const language = firstQuery(request.query, 'language')
  if (language !== undefined) collected['language'] = language
  return collected
}

function buildHandler() {
  const url = process.env['SUPABASE_URL']?.trim()
  const anonKey = process.env['SUPABASE_ANON_KEY']?.trim()

  if (!url || !anonKey) return null

  return createLanguagesHandler(
    createRestLanguageRepository({ supabaseUrl: url, anonKey }),
  )
}

export default async function handler(
  request: PlatformRequest,
  response: PlatformResponse,
): Promise<void> {
  const requestIdHeader = firstHeader(request.headers, 'x-request-id')
  const run = buildHandler()

  // Missing configuration is a server-side fault, so it is reported as one. The
  // response deliberately does not name the variables: which credentials a
  // deployment is missing is infrastructure detail, not user-facing copy.
  const result =
    run === null
      ? jsonResponse(500, errorEnvelope('INTERNAL_ERROR', resolveRequestId(requestIdHeader)))
      : await run({
          method: request.method ?? 'GET',
          params: {},
          query: queryParams(request),
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
