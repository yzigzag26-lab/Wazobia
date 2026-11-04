/**
 * `POST /api/v1/ai/chat` — Vercel serverless entry point.
 *
 * The dictionary lookup used for citations runs under the ANON key, so it can
 * only ever see approved entries — the same rows a browser could read.
 */

import { createChatHandler } from '../../_lib/ai/chat-handler.js'
import { selectProvider } from '../../_lib/ai/provider.js'
import { createRestDictionaryRepository } from '../../_lib/dictionary/repository.js'

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

function buildLookup() {
  const url = process.env['SUPABASE_URL']?.trim()
  const anonKey = process.env['SUPABASE_ANON_KEY']?.trim()
  if (!url || !anonKey) return null

  const repository = createRestDictionaryRepository({ supabaseUrl: url, anonKey })
  return {
    async findApproved(term: string, language: string) {
      const { results } = await repository.search(term, language, 3, 0)
      // `search` already filters to approved via RLS and an explicit param, but
      // the filter is restated here because a citation must be provably
      // approved, not approved-by-assumption.
      return results
        .filter((row) => row.review_status === 'approved')
        .map((row) => ({ id: row.id, headword: row.headword, gloss: row.gloss }))
    },
  }
}

export default async function handler(
  request: PlatformRequest,
  response: PlatformResponse,
): Promise<void> {
  const requestIdHeader = firstHeader(request.headers, 'x-request-id')
  const run = createChatHandler(selectProvider(), buildLookup())

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
