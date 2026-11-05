/**
 * `GET|POST /api/v1/dictionary/review` — the operator review surface.
 *
 * Not in the public API contract, because it is not a learner-facing endpoint.
 * It exists so approving the dictionary is a workflow rather than a SQL script.
 *
 * ## Authorisation is layered, deliberately
 *
 *   1. `protect()` verifies the JWT — anonymous callers never reach this code.
 *   2. `requireRole()` checks `reviewer`/`admin` against `user_roles`.
 *   3. The Postgres RPCs this handler calls check `wazobia_is_reviewer()` again,
 *      and also enforce the "no approval without a gloss" rule.
 *
 * Three layers for a reason: the third is the only one a bug in this file
 * cannot defeat. `requireRole` here means a non-reviewer gets a clean 403 with
 * the contract's error envelope instead of a raw PostgREST error string.
 */

import { successEnvelope, errorEnvelope } from '../envelope.js'
import { resolveRequestId } from '../request-id.js'
import { jsonResponse, type HttpRequest, type HttpResponse } from '../http.js'
import type { AuthenticatedUser } from '../auth/verify.js'
import type { RateLimiter } from '../rate-limit.js'

export interface ReviewCandidate {
  readonly id: string
  readonly language_code: string
  readonly headword: string
  readonly part_of_speech: string | null
  readonly gloss: string | null
  readonly review_status: string
  readonly quality_flag: string
  readonly source_name: string | null
}

export interface ReviewRepository {
  /** Pending entries for a language, flagged worst-first. */
  candidates(language: string, limit: number, authorization: string | null): Promise<ReviewCandidate[]>
  /** Approve or reject one entry. Returns null when the id does not exist. */
  decide(
    entryId: string,
    decision: 'approved' | 'rejected' | 'pending',
    authorization: string | null,
  ): Promise<{ id: string; review_status: string; reviewed_at: string | null } | null>
  /** Batch approve/reject, returning what was held back and why. */
  bulk(
    language: string,
    decision: 'approved' | 'rejected',
    onlyClean: boolean,
    limit: number,
    authorization: string | null,
  ): Promise<{ reviewed: number; skipped: number; skipped_reasons: string[] }>
}

export interface DictionaryReviewDeps {
  readonly repository: ReviewRepository
  readonly rateLimiter?: RateLimiter | undefined
}

const ALLOWED_DECISIONS = ['approved', 'rejected', 'pending'] as const
type Decision = (typeof ALLOWED_DECISIONS)[number]

function isDecision(value: unknown): value is Decision {
  return typeof value === 'string' && (ALLOWED_DECISIONS as readonly string[]).includes(value)
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export function createDictionaryReviewHandler(deps: DictionaryReviewDeps) {
  return async function reviewHandler(
    request: HttpRequest,
    _caller: AuthenticatedUser,
  ): Promise<HttpResponse> {
    const requestId = resolveRequestId(request.requestIdHeader)

    if (deps.rateLimiter !== undefined) {
      const decision = await deps.rateLimiter('dictionary_review', request.authorization)
      if (!decision.allowed) {
        return jsonResponse(
          429,
          errorEnvelope('RATE_LIMITED', requestId, {
            details: { retry_after_seconds: decision.retryAfterSeconds },
          }),
          { 'retry-after': String(decision.retryAfterSeconds) },
        )
      }
    }

    try {
      if (request.method === 'GET') {
        const language = readString(request.query, 'language')
        if (language === null) {
          return jsonResponse(
            400,
            errorEnvelope('VALIDATION_ERROR', requestId, {
              message: 'A language code is required, for example ?language=ig',
            }),
          )
        }

        const rawLimit = request.query['limit']
        const parsed = rawLimit === undefined ? 50 : Number.parseInt(rawLimit, 10)
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > 200) {
          return jsonResponse(
            400,
            errorEnvelope('VALIDATION_ERROR', requestId, {
              message: 'limit must be between 1 and 200.',
            }),
          )
        }

        const candidates = await deps.repository.candidates(
          language,
          parsed,
          request.authorization,
        )
        return jsonResponse(
          200,
          successEnvelope({ language_code: language, candidates, limit: parsed }, requestId),
        )
      }

      if (request.method !== 'POST') {
        return jsonResponse(
          405,
          errorEnvelope('VALIDATION_ERROR', requestId, {
            message: 'This endpoint accepts GET and POST.',
          }),
          { allow: 'GET, POST' },
        )
      }

      const body = request.body
      if (typeof body !== 'object' || body === null) {
        return jsonResponse(
          400,
          errorEnvelope('VALIDATION_ERROR', requestId, { message: 'A JSON body is required.' }),
        )
      }
      const payload = body as Record<string, unknown>

      // ---- batch mode -------------------------------------------------------
      if (payload['mode'] === 'bulk') {
        const language = readString(payload, 'language')
        const decision = payload['decision']
        if (language === null || !isDecision(decision) || decision === 'pending') {
          return jsonResponse(
            400,
            errorEnvelope('VALIDATION_ERROR', requestId, {
              message: 'Bulk review needs a language and a decision of approved or rejected.',
            }),
          )
        }

        // Default ON. Approving flagged rows has to be an explicit choice.
        const onlyClean = payload['only_clean'] !== false
        const limit = typeof payload['limit'] === 'number' ? payload['limit'] : 500
        if (!Number.isInteger(limit) || limit < 1 || limit > 2000) {
          return jsonResponse(
            400,
            errorEnvelope('VALIDATION_ERROR', requestId, {
              message: 'limit must be between 1 and 2000.',
            }),
          )
        }

        const result = await deps.repository.bulk(
          language,
          decision,
          onlyClean,
          limit,
          request.authorization,
        )
        return jsonResponse(
          200,
          successEnvelope(
            {
              language_code: language,
              decision,
              only_clean: onlyClean,
              reviewed: result.reviewed,
              skipped: result.skipped,
              // Truncated: 1,000 skipped headwords would be a 100 kB response
              // and the reviewer only needs to know the shape of the problem.
              skipped_reasons: result.skipped_reasons.slice(0, 20),
              skipped_reasons_truncated: result.skipped_reasons.length > 20,
            },
            requestId,
          ),
        )
      }

      // ---- single-entry mode ------------------------------------------------
      const entryId = readString(payload, 'entry_id')
      const decision = payload['decision']
      if (entryId === null || !isDecision(decision)) {
        return jsonResponse(
          400,
          errorEnvelope('VALIDATION_ERROR', requestId, {
            message: 'A review needs an entry_id and a decision of approved, rejected or pending.',
          }),
        )
      }

      const updated = await deps.repository.decide(entryId, decision, request.authorization)
      if (updated === null) {
        return jsonResponse(404, errorEnvelope('NOT_FOUND', requestId))
      }

      return jsonResponse(200, successEnvelope(updated, requestId))
    } catch (error) {
      // The database refuses unauthorised review and approval-without-gloss by
      // raising. Translate those to contract errors instead of a raw 500.
      const message = error instanceof Error ? error.message : ''
      if (message.includes('FORBIDDEN')) {
        return jsonResponse(403, errorEnvelope('FORBIDDEN', requestId))
      }
      if (message.includes('NO_GLOSS')) {
        return jsonResponse(
          422,
          errorEnvelope('SEMANTIC_ERROR', requestId, {
            message: 'That entry has no gloss, so it cannot be approved.',
          }),
        )
      }
      if (message.includes('NOT_FOUND')) {
        return jsonResponse(404, errorEnvelope('NOT_FOUND', requestId))
      }
      return jsonResponse(500, errorEnvelope('INTERNAL_ERROR', requestId))
    }
  }
}
