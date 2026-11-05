// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { createDictionaryReviewHandler } from './review-handler.js'
import type { ReviewCandidate, ReviewRepository } from './review-handler.js'
import type { AuthenticatedUser } from '../auth/verify.js'
import type { HttpRequest } from '../http.js'

/**
 * The review endpoint can publish content to every learner, so the cases that
 * matter are the refusals: no approval without a gloss, no bulk approval of
 * flagged rows by default, and no path where a database rejection becomes a
 * cheerful 200.
 */

const CALLER: AuthenticatedUser = {
  id: 'reviewer-1',
  email: 'r@example.com',
  claims: {},
}

const CANDIDATE: ReviewCandidate = {
  id: 'entry-1',
  language_code: 'ig',
  headword: '-bugha(lị)',
  part_of_speech: 'active verb',
  gloss: 'postpone',
  review_status: 'pending',
  quality_flag: 'verb-stem notation',
  source_name: 'Igbo API',
}

function request(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    method: 'GET',
    params: {},
    query: {},
    body: undefined,
    authorization: 'Bearer token',
    requestIdHeader: null,
    ...overrides,
  }
}

interface Recorded {
  candidates: { language: string; limit: number }[]
  decided: { id: string; decision: string }[]
  bulk: { language: string; decision: string; onlyClean: boolean; limit: number }[]
}

function repositoryReturning(overrides: Partial<ReviewRepository> = {}): {
  repository: ReviewRepository
  recorded: Recorded
} {
  const recorded: Recorded = { candidates: [], decided: [], bulk: [] }

  const repository: ReviewRepository = {
    candidates: async (language, limit) => {
      recorded.candidates.push({ language, limit })
      return [CANDIDATE]
    },
    decide: async (id, decision) => {
      recorded.decided.push({ id, decision })
      return { id, review_status: decision, reviewed_at: '2026-01-01T00:00:00.000Z' }
    },
    bulk: async (language, decision, onlyClean, limit) => {
      recorded.bulk.push({ language, decision, onlyClean, limit })
      return { reviewed: 47, skipped: 3, skipped_reasons: ['x -> unbalanced parentheses'] }
    },
    ...overrides,
  }

  return { repository, recorded }
}

const throwingRepository = (message: string): ReviewRepository => ({
  candidates: async () => {
    throw new Error(message)
  },
  decide: async () => {
    throw new Error(message)
  },
  bulk: async () => {
    throw new Error(message)
  },
})

describe('GET /dictionary/review', () => {
  it('returns the pending queue for a language', async () => {
    const { repository } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(request({ query: { language: 'ig' } }), CALLER)
    const body = result.body as { success: boolean; data: { candidates: ReviewCandidate[] } }

    expect(result.status).toBe(200)
    expect(body.data.candidates).toHaveLength(1)
  })

  it('requires a language code', async () => {
    const { repository } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(request(), CALLER)
    expect(result.status).toBe(400)
  })

  it('rejects a nonsensical limit', async () => {
    const { repository } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(request({ query: { language: 'ig', limit: '9999' } }), CALLER)
    expect(result.status).toBe(400)
  })

  it('never caches a queue response', async () => {
    const { repository } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })
    const result = await run(request({ query: { language: 'ig' } }), CALLER)
    expect(result.headers['cache-control']).toBe('no-store')
  })
})

describe('POST /dictionary/review — single entry', () => {
  it('records an approval', async () => {
    const { repository, recorded } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(
      request({ method: 'POST', body: { entry_id: 'entry-1', decision: 'approved' } }),
      CALLER,
    )

    expect(result.status).toBe(200)
    expect(recorded.decided).toEqual([{ id: 'entry-1', decision: 'approved' }])
  })

  it('rejects an unknown decision', async () => {
    const { repository, recorded } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(
      request({ method: 'POST', body: { entry_id: 'entry-1', decision: 'publish' } }),
      CALLER,
    )

    expect(result.status).toBe(400)
    expect(recorded.decided).toHaveLength(0)
  })

  it('requires an entry id', async () => {
    const { repository } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(request({ method: 'POST', body: { decision: 'approved' } }), CALLER)
    expect(result.status).toBe(400)
  })

  it('maps a missing entry to 404', async () => {
    const { repository } = repositoryReturning({ decide: async () => null })
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(
      request({ method: 'POST', body: { entry_id: 'nope', decision: 'approved' } }),
      CALLER,
    )
    expect(result.status).toBe(404)
  })

  it('maps a database gloss refusal to 422, not 200', async () => {
    // `review_dictionary_entry` raises NO_GLOSS. If that surfaced as a success
    // the UI would tell a reviewer they published something they did not.
    const run = createDictionaryReviewHandler({
      repository: throwingRepository('ERROR: NO_GLOSS: cannot approve an entry with no gloss'),
    })

    const result = await run(
      request({ method: 'POST', body: { entry_id: 'entry-1', decision: 'approved' } }),
      CALLER,
    )
    const body = result.body as { error: { code: string } }

    expect(result.status).toBe(422)
    expect(body.error.code).toBe('SEMANTIC_ERROR')
  })

  it('maps a database FORBIDDEN to 403', async () => {
    const run = createDictionaryReviewHandler({
      repository: throwingRepository('ERROR: FORBIDDEN'),
    })

    const result = await run(
      request({ method: 'POST', body: { entry_id: 'entry-1', decision: 'approved' } }),
      CALLER,
    )
    expect(result.status).toBe(403)
  })

  it('does not leak a raw database error to the user', async () => {
    const run = createDictionaryReviewHandler({
      repository: throwingRepository('connection to server at "db" port 5432 failed'),
    })

    const result = await run(
      request({ method: 'POST', body: { entry_id: 'entry-1', decision: 'approved' } }),
      CALLER,
    )
    const body = result.body as { error: { message: string } }

    expect(result.status).toBe(500)
    expect(body.error.message).not.toContain('5432')
  })
})

describe('POST /dictionary/review — bulk', () => {
  it('defaults only_clean to true', async () => {
    // The default is the safety property. Approving flagged rows must be an
    // explicit opt-out, never the accidental result of omitting a field.
    const { repository, recorded } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    await run(
      request({ method: 'POST', body: { mode: 'bulk', language: 'ig', decision: 'approved' } }),
      CALLER,
    )

    expect(recorded.bulk[0]?.onlyClean).toBe(true)
  })

  it('honours an explicit only_clean: false', async () => {
    const { repository, recorded } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    await run(
      request({
        method: 'POST',
        body: { mode: 'bulk', language: 'ig', decision: 'approved', only_clean: false },
      }),
      CALLER,
    )

    expect(recorded.bulk[0]?.onlyClean).toBe(false)
  })

  it('reports how many rows were held back, and why', async () => {
    const { repository } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(
      request({ method: 'POST', body: { mode: 'bulk', language: 'ig', decision: 'approved' } }),
      CALLER,
    )
    const body = result.body as {
      data: { reviewed: number; skipped: number; skipped_reasons: string[] }
    }

    expect(body.data.reviewed).toBe(47)
    expect(body.data.skipped).toBe(3)
    expect(body.data.skipped_reasons[0]).toContain('unbalanced')
  })

  it('refuses a bulk decision of pending', async () => {
    const { repository, recorded } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(
      request({ method: 'POST', body: { mode: 'bulk', language: 'ig', decision: 'pending' } }),
      CALLER,
    )

    expect(result.status).toBe(400)
    expect(recorded.bulk).toHaveLength(0)
  })

  it('rejects an out-of-range limit', async () => {
    const { repository } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(
      request({
        method: 'POST',
        body: { mode: 'bulk', language: 'ig', decision: 'approved', limit: 99_999 },
      }),
      CALLER,
    )
    expect(result.status).toBe(400)
  })

  it('truncates a very long skip list to keep the response small', async () => {
    const { repository } = repositoryReturning({
      bulk: async () => ({
        reviewed: 10,
        skipped: 500,
        skipped_reasons: Array.from({ length: 500 }, (_, i) => `row ${String(i)} -> no gloss`),
      }),
    })
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(
      request({ method: 'POST', body: { mode: 'bulk', language: 'ig', decision: 'approved' } }),
      CALLER,
    )
    const body = result.body as {
      data: { skipped: number; skipped_reasons: string[]; skipped_reasons_truncated: boolean }
    }

    expect(body.data.skipped).toBe(500)
    expect(body.data.skipped_reasons.length).toBeLessThanOrEqual(20)
    expect(body.data.skipped_reasons_truncated).toBe(true)
  })
})

describe('method handling', () => {
  it('rejects PUT with an Allow header', async () => {
    const { repository } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(request({ method: 'PUT' }), CALLER)
    expect(result.status).toBe(405)
    expect(result.headers['allow']).toBe('GET, POST')
  })

  it('rejects a missing body on POST', async () => {
    const { repository } = repositoryReturning()
    const run = createDictionaryReviewHandler({ repository })

    const result = await run(request({ method: 'POST', body: undefined }), CALLER)
    expect(result.status).toBe(400)
  })

  it('rate limits before touching the repository', async () => {
    const { repository, recorded } = repositoryReturning()
    const run = createDictionaryReviewHandler({
      repository,
      rateLimiter: async () => ({ allowed: false, retryAfterSeconds: 30 }),
    })

    const result = await run(request({ query: { language: 'ig' } }), CALLER)

    expect(result.status).toBe(429)
    expect(recorded.candidates).toHaveLength(0)
  })
})
