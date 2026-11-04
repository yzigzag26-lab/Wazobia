/**
 * Data-access boundary for `GET /api/v1/dictionary/search` (contract §2.3).
 *
 * Same shape as the languages repository: an interface, a PostgREST adapter over
 * `fetch` with the anon key, and an in-memory adapter for tests.
 *
 * Two things this deliberately does NOT do:
 *
 *   * It does not normalise the headword on the way out. `Yorùbá` must reach the
 *     client with its tone marks intact. Search *matching* is accent-insensitive
 *     through the generated `search_key` column, but the value returned is
 *     always the canonical spelling.
 *   * It does not trust the caller to filter review state. The
 *     `dictionary_approved_read` policy enforces that in the database, so this
 *     endpoint cannot leak unreviewed content even if the query were wrong. The
 *     explicit `review_status` filter below is belt-and-braces, not the guard.
 */

/** One entry as the API returns it, matching `DictionaryEntrySummary`. */
export interface DictionaryEntryRow {
  readonly id: string
  readonly headword: string
  readonly language: string
  readonly part_of_speech: string | null
  readonly review_status: 'approved' | 'pending' | 'rejected'
  readonly gloss: string | null
}

/** A page of results plus the total the query would have returned. */
export interface DictionarySearchPage {
  readonly results: readonly DictionaryEntryRow[]
  readonly total: number
}

export interface DictionaryRepository {
  /** Entries whose folded headword contains `query`, alphabetically. */
  search(
    query: string,
    languageCode: string | null,
    limit: number,
    offset: number,
  ): Promise<DictionarySearchPage>
}

/**
 * Columns are listed explicitly, and `language_code` is renamed to `language`
 * here rather than in the database: the column name is correct at the storage
 * layer, and the contract's field name is correct at the wire layer.
 */
const SELECT_COLUMNS = 'id,headword,language_code,part_of_speech,review_status,gloss'

const REVIEW_STATES = new Set(['approved', 'pending', 'rejected'])

/** Coerce one raw row into the response shape, or drop it if unusable. */
export function toDictionaryEntryRow(raw: unknown): DictionaryEntryRow | null {
  if (typeof raw !== 'object' || raw === null) return null
  const row = raw as Record<string, unknown>

  const headword = row['headword']
  const languageCode = row['language_code']
  const id = row['id']
  const reviewStatus = row['review_status']

  if (typeof headword !== 'string' || headword.trim().length === 0) return null
  if (typeof languageCode !== 'string' || languageCode.trim().length === 0) return null
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof reviewStatus !== 'string' || !REVIEW_STATES.has(reviewStatus)) return null

  const partOfSpeech = row['part_of_speech']
  const gloss = row['gloss']

  return {
    id,
    // Passed through byte for byte. This is the canonical spelling.
    headword,
    language: languageCode,
    part_of_speech: typeof partOfSpeech === 'string' ? partOfSpeech : null,
    review_status: reviewStatus as DictionaryEntryRow['review_status'],
    gloss: typeof gloss === 'string' ? gloss : null,
  }
}

export interface RestDictionaryRepositoryOptions {
  readonly supabaseUrl: string
  readonly anonKey: string
  readonly fetchImpl?: typeof fetch
  readonly signal?: AbortSignal | undefined
}

/** Production adapter: PostgREST over `fetch`. */
export function createRestDictionaryRepository(
  options: RestDictionaryRepositoryOptions,
): DictionaryRepository {
  const { supabaseUrl, anonKey, signal } = options
  const doFetch = options.fetchImpl ?? fetch
  const base = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/dictionary_entries`

  return {
    async search(query, languageCode, limit, offset) {
      // PostgREST treats `*` as the ILIKE wildcard inside a value. The handler
      // has already folded the query, which removes `*` because it is not a
      // letter or digit. An empty pattern would mean "match everything", so it
      // is refused here rather than silently returning the whole table.
      const safe = query.replaceAll('*', '').trim()
      if (safe.length === 0) return { results: [], total: 0 }

      const params = new URLSearchParams()
      params.set('select', SELECT_COLUMNS)
      params.set('review_status', 'eq.approved')
      params.set('search_key', `ilike.*${safe}*`)
      params.set('order', 'headword.asc')
      if (languageCode !== null) params.set('language_code', `eq.${languageCode}`)

      // `Prefer: count=exact` makes PostgREST report the full match count in
      // `Content-Range`, which is what lets the UI say "showing 20 of 143"
      // without a second query.
      const response = await doFetch(`${base}?${params.toString()}`, {
        method: 'GET',
        headers: {
          apikey: anonKey,
          authorization: `Bearer ${anonKey}`,
          accept: 'application/json',
          prefer: 'count=exact',
          // PostgREST reads Range for pagination, not limit/offset params,
          // when count=exact is requested.
          range: `${offset}-${offset + limit - 1}`,
          'range-unit': 'items',
        },
        ...(signal === undefined ? {} : { signal }),
      })

      if (!response.ok) {
        throw new Error(`Dictionary query failed with status ${response.status}`)
      }

      const payload: unknown = await response.json()
      if (!Array.isArray(payload)) {
        throw new TypeError('Expected an array of dictionary rows')
      }

      const results = payload
        .map(toDictionaryEntryRow)
        .filter((row): row is DictionaryEntryRow => row !== null)

      return { results, total: parseTotal(response.headers.get('content-range'), results.length) }
    },
  }
}

/**
 * Read the total out of `Content-Range`, e.g. `0-19/143`.
 *
 * A missing or `*` total means PostgREST did not count; falling back to the page
 * length is honest (it under-reports rather than inventing a number), and the
 * UI treats `total <= results.length` as "one page".
 */
export function parseTotal(contentRange: string | null, pageLength: number): number {
  if (contentRange === null) return pageLength
  const match = /\/(\d+)$/.exec(contentRange)
  if (match?.[1] === undefined) return pageLength
  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : pageLength
}

/**
 * Mirror of the database's `wazobia_fold()`, for the in-memory adapter only.
 * The production adapter does not need it: the database has already folded the
 * key it compares against.
 */
export function foldForSearch(value: string): string {
  return value
    .normalize('NFD')
    // Strip combining marks: this removes tone marks and the dot-below on
    // ẹ ọ ṣ ị ụ, exactly as `unaccent` does server-side.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/** Test adapter. Folds the same way the database's `search_key` does. */
export function createInMemoryDictionaryRepository(
  rows: readonly DictionaryEntryRow[],
): DictionaryRepository {
  return {
    async search(query, languageCode, limit, offset) {
      const matched = rows
        .filter((row) => foldForSearch(row.headword).includes(query))
        .filter((row) => languageCode === null || row.language === languageCode)
      return {
        results: matched.slice(offset, offset + limit),
        total: matched.length,
      }
    },
  }
}
