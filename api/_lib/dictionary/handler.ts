import { successEnvelope, errorEnvelope } from '../envelope.js'
import { resolveRequestId } from '../request-id.js'
import { jsonResponse, type HttpRequest, type HttpResponse } from '../http.js'
import {
  foldForSearch,
  type DictionaryEntryRow,
  type DictionaryRepository,
} from './repository.js'

/**
 * `GET /api/v1/dictionary/search` — contract §2.3.
 *
 * Public and cacheable, like `/languages`. Query parameters:
 *
 *   q         required. Text to look for. Matched case- and accent-insensitively
 *             against the generated `search_key`, but always RETURNED with
 *             canonical spelling.
 *   language  optional. One of `yo`, `ha`, `ig`. Omitting it searches all three.
 *   page      1-based, default 1.
 *   page_size default 20, max 100.
 *
 * A query that matches nothing is a 200 with an empty array, not a 404. "No
 * results" is a successful search that found nothing; a 404 would say the
 * endpoint does not exist.
 */

/** Mirrors `DictionarySearchResponse` in `src/services/contracts/endpoints.ts`. */
export interface SearchDictionaryData {
  readonly query: string
  readonly results: readonly DictionaryEntryRow[]
  readonly total: number
  readonly page: number
  readonly page_size: number
}

const LANGUAGES = new Set(['yo', 'ha', 'ig'])
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
/** Long enough for a phrase, short enough that the query stays cheap. */
const MAX_QUERY_LENGTH = 100

const CACHE_CONTROL = 'public, max-age=3600'

function validationError(requestId: string, message: string, field: string): HttpResponse {
  return jsonResponse(
    400,
    errorEnvelope('VALIDATION_ERROR', requestId, { message, details: { field } }),
  )
}

export function createDictionarySearchHandler(repository: DictionaryRepository) {
  return async function dictionarySearchHandler(request: HttpRequest): Promise<HttpResponse> {
    const requestId = resolveRequestId(request.requestIdHeader)

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse(
        405,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'This endpoint only accepts GET.',
        }),
        { allow: 'GET, HEAD' },
      )
    }

    const rawQuery = request.query['q']
    const query = typeof rawQuery === 'string' ? rawQuery.trim() : ''

    if (query.length === 0) {
      return validationError(requestId, 'Provide a search term in the "q" parameter.', 'q')
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return validationError(
        requestId,
        `Search terms are limited to ${MAX_QUERY_LENGTH} characters.`,
        'q',
      )
    }

    const folded = foldForSearch(query)
    if (folded.length === 0) {
      // e.g. the user typed only punctuation. Nothing can match, and asking the
      // database for `ilike.**` would return the entire table.
      return jsonResponse(
        200,
        successEnvelope(
          { query, results: [], total: 0, page: 1, page_size: DEFAULT_PAGE_SIZE },
          requestId,
        ),
        { 'cache-control': CACHE_CONTROL },
      )
    }

    const rawLanguage = request.query['language']
    const language = typeof rawLanguage === 'string' && rawLanguage.length > 0 ? rawLanguage : null

    if (language !== null && !LANGUAGES.has(language)) {
      return validationError(
        requestId,
        `Unknown language "${language}". Use one of: yo, ha, ig.`,
        'language',
      )
    }

    const rawPage = request.query['page']
    let page = 1
    if (typeof rawPage === 'string' && rawPage.length > 0) {
      const parsed = Number.parseInt(rawPage, 10)
      if (!Number.isFinite(parsed) || parsed < 1) {
        return validationError(requestId, 'The "page" parameter must be 1 or greater.', 'page')
      }
      page = parsed
    }

    const rawPageSize = request.query['page_size']
    let pageSize = DEFAULT_PAGE_SIZE
    if (typeof rawPageSize === 'string' && rawPageSize.length > 0) {
      const parsed = Number.parseInt(rawPageSize, 10)
      if (!Number.isFinite(parsed) || parsed < 1) {
        return validationError(
          requestId,
          'The "page_size" parameter must be a positive whole number.',
          'page_size',
        )
      }
      // Clamped rather than rejected: asking for more than exists is not an
      // error, it is a preference the server is allowed to cap.
      pageSize = Math.min(parsed, MAX_PAGE_SIZE)
    }

    try {
      const { results, total } = await repository.search(
        folded,
        language,
        pageSize,
        (page - 1) * pageSize,
      )
      const data: SearchDictionaryData = { query, results, total, page, page_size: pageSize }
      return jsonResponse(200, successEnvelope(data, requestId), {
        'cache-control': CACHE_CONTROL,
      })
    } catch {
      // Same reasoning as `/languages`: provider detail stays out of the body.
      // Not cached — caching a 500 for an hour turns a blip into an outage.
      return jsonResponse(500, errorEnvelope('INTERNAL_ERROR', requestId))
    }
  }
}
