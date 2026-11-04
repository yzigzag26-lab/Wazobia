import { successEnvelope, errorEnvelope } from '../envelope.js'
import { resolveRequestId } from '../request-id.js'
import { jsonResponse, type HttpRequest, type HttpResponse } from '../http.js'
import type { LanguageRepository, LanguageRow } from './repository.js'

/**
 * `GET /api/v1/languages` — contract §2.1.
 *
 * Public and cacheable: no auth, no personal data, nothing user-specific. The
 * response is explicitly cacheable because this payload changes perhaps a few
 * times a year and is read on essentially every page load.
 *
 * The contract's one critical requirement is that `native_name` comes back with
 * full orthography (`Yorùbá`, not `Yoruba`). That is enforced at two other
 * layers as well — a seed-integrity check in the migration and a test here — so
 * a well-meaning normalisation at any one of them is caught.
 */

/** Contract shape (§2.1): `{ languages: [...] }`. */
export interface ListLanguagesData {
  readonly languages: readonly LanguageRow[]
}

const CACHE_CONTROL = 'public, max-age=3600'

export function createLanguagesHandler(repository: LanguageRepository) {
  return async function languagesHandler(request: HttpRequest): Promise<HttpResponse> {
    const requestId = resolveRequestId(request.requestIdHeader)

    // Vercel routes by file, but a method mismatch is still reachable through a
    // custom route or a direct invocation, so it is answered rather than assumed.
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse(
        405,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'This endpoint only accepts GET.',
        }),
        { allow: 'GET, HEAD' },
      )
    }

    try {
      const languages = await repository.listEnabled()
      const data: ListLanguagesData = { languages }
      return jsonResponse(200, successEnvelope(data, requestId), {
        'cache-control': CACHE_CONTROL,
      })
    } catch {
      /*
       * The failure is deliberately swallowed. A database error message can
       * contain table names, column names and sometimes row values, none of
       * which belong in a response to an anonymous caller. The request id is the
       * link between this response and the server-side detail.
       *
       * Note the response is NOT cached: caching a 500 for an hour would turn a
       * blip into an outage.
       */
      return jsonResponse(500, errorEnvelope('INTERNAL_ERROR', requestId))
    }
  }
}
