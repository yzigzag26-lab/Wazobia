/**
 * PostgREST access for the review queue, using the CALLER's token.
 *
 * The caller's token is forwarded rather than a service key, so
 * `wazobia_is_reviewer()` inside each RPC evaluates against the real user. If
 * this module used the service key, every request would arrive as the owner and
 * the role check would be meaningless.
 */

import type { ReviewCandidate, ReviewRepository } from './review-handler.js'

export interface ReviewRepositoryConfig {
  readonly supabaseUrl: string
  readonly anonKey: string
}

function base(config: ReviewRepositoryConfig): string {
  return config.supabaseUrl.replace(/\/$/, '')
}

function headers(config: ReviewRepositoryConfig, authorization: string | null): Record<string, string> {
  return {
    apikey: config.anonKey,
    // No fallback to the anon key here: without a user token there is no
    // reviewer, and pretending otherwise would produce confusing 403s from
    // Postgres rather than an honest failure.
    ...(authorization === null ? {} : { authorization }),
    'content-type': 'application/json',
    accept: 'application/json',
  }
}

export function createRestReviewRepository(config: ReviewRepositoryConfig): ReviewRepository {
  const root = base(config)

  async function callRpc(
    name: string,
    args: Record<string, unknown>,
    authorization: string | null,
  ): Promise<unknown> {
    const response = await fetch(`${root}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: headers(config, authorization),
      body: JSON.stringify(args),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      // The handler maps these strings onto contract error codes.
      throw new Error(`${detail}${detail.length === 0 ? `rpc ${name} failed` : ''}`)
    }

    return response.json().catch(() => null)
  }

  return {
    async candidates(language, limit, authorization) {
      const url =
        `${root}/rest/v1/dictionary_review_candidates` +
        `?select=id,language_code,headword,part_of_speech,gloss,review_status,quality_flag,source_name` +
        `&language_code=eq.${encodeURIComponent(language)}` +
        `&review_status=eq.pending&order=quality_flag.asc,headword.asc&limit=${String(limit)}`

      const response = await fetch(url, { headers: headers(config, authorization) })
      if (!response.ok) {
        throw new Error(`review queue read failed with ${String(response.status)}`)
      }
      return (await response.json()) as ReviewCandidate[]
    },

    async decide(entryId, decision, authorization) {
      const result = await callRpc(
        'review_dictionary_entry',
        { p_entry_id: entryId, p_decision: decision },
        authorization,
      )
      // The RPC returns a table, so PostgREST hands back an array.
      const rows = Array.isArray(result) ? (result as Record<string, unknown>[]) : []
      const row = rows[0]
      if (row === undefined) return null
      return {
        id: String(row['id']),
        review_status: String(row['review_status']),
        reviewed_at: typeof row['reviewed_at'] === 'string' ? row['reviewed_at'] : null,
      }
    },

    async bulk(language, decision, onlyClean, limit, authorization) {
      const result = await callRpc(
        'bulk_review_dictionary',
        {
          p_language_code: language,
          p_decision: decision,
          p_only_clean: onlyClean,
          p_limit: limit,
        },
        authorization,
      )

      const rows = Array.isArray(result) ? (result as Record<string, unknown>[]) : []
      const row = rows[0] ?? {}
      const reasons = Array.isArray(row['skipped_reasons'])
        ? (row['skipped_reasons'] as unknown[]).filter((r): r is string => typeof r === 'string')
        : []

      return {
        reviewed: typeof row['reviewed'] === 'number' ? row['reviewed'] : 0,
        skipped: typeof row['skipped'] === 'number' ? row['skipped'] : reasons.length,
        skipped_reasons: reasons,
      }
    },
  }
}
