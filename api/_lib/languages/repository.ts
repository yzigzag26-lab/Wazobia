/**
 * Data-access boundary for `GET /api/v1/languages` (contract §2.1).
 *
 * The handler depends on the `LanguageRepository` interface, and there are two
 * adapters:
 *
 *   * `createRestLanguageRepository` — the real one. It reads the
 *     `languages_public` view over Supabase's PostgREST endpoint using the
 *     PUBLIC ANON KEY, not the service-role key.
 *
 *     That is a deliberate least-privilege choice. This endpoint returns only
 *     public catalogue data, so it has no business holding a credential that
 *     bypasses Row Level Security. Reading through the anon key means the
 *     request is subject to the same policies a browser would be, so a mistake
 *     in the query cannot expose rows that RLS forbids. It also avoids opening
 *     direct Postgres connections from a serverless function, which is how
 *     connection limits get exhausted under load.
 *
 *   * `createInMemoryLanguageRepository` — used by tests.
 *
 * Using plain `fetch` rather than a client library keeps this testable with a
 * stubbed fetch and adds no dependency to the deploy bundle.
 */

/** One language as the API returns it (contract §2.1, snake_case). */
export interface LanguageRow {
  readonly code: string
  readonly native_name: string
  readonly english_name: string
  readonly role: 'target' | 'bridge'
  readonly direction: 'ltr' | 'rtl'
  readonly enabled: boolean
  readonly dialect_count: number
}

export interface LanguageRepository {
  /**
   * Every ENABLED language, in display order.
   *
   * Disabled rows are excluded by the `languages_public` view itself, so a
   * caller cannot accidentally surface one by forgetting to filter.
   */
  listEnabled(): Promise<readonly LanguageRow[]>
}

/**
 * Columns are requested explicitly rather than `*`, so adding a column to the
 * view can never change the API response by accident.
 */
const SELECT_COLUMNS = [
  'code',
  'native_name',
  'english_name',
  'role',
  'direction',
  'enabled',
  'dialect_count',
].join(',')

/** Coerce one raw row into the response shape, rejecting nonsense. */
export function toLanguageRow(raw: unknown): LanguageRow {
  if (typeof raw !== 'object' || raw === null) {
    throw new TypeError('Expected a language row object')
  }
  const row = raw as Record<string, unknown>

  const requireString = (key: string): string => {
    const value = row[key]
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new TypeError(`Language row is missing a usable "${key}"`)
    }
    return value
  }

  const role = row['role']
  if (role !== 'target' && role !== 'bridge') {
    throw new TypeError('Language row has an unsupported "role"')
  }

  const direction = row['direction']
  if (direction !== 'ltr' && direction !== 'rtl') {
    throw new TypeError('Language row has an unsupported "direction"')
  }

  // `dialect_count` is an integer in Postgres, but it is normalised rather than
  // trusted: a bigint can arrive as a string, and a null from a LEFT JOIN that
  // the view failed to coalesce should degrade to 0 rather than become NaN.
  const rawCount = row['dialect_count']
  const parsedCount =
    typeof rawCount === 'string' ? Number.parseInt(rawCount, 10) : (rawCount as number | null)
  const dialectCount =
    typeof parsedCount === 'number' && Number.isFinite(parsedCount) && parsedCount >= 0
      ? Math.trunc(parsedCount)
      : 0

  return {
    code: requireString('code'),
    // Passed through untouched. This is the endonym in full orthography, and
    // trimming or Unicode-normalising it here would be a data bug: `Yorùbá`
    // must reach the client with its tone marks intact. The requireString check
    // above only rejects an empty value.
    native_name: requireString('native_name'),
    english_name: requireString('english_name'),
    role,
    direction,
    enabled: row['enabled'] !== false,
    dialect_count: dialectCount,
  }
}

export interface RestLanguageRepositoryOptions {
  /** e.g. `https://abcdefgh.supabase.co` — no trailing slash. */
  readonly supabaseUrl: string
  /** The PUBLIC anon key. Never the service-role key. */
  readonly anonKey: string
  readonly fetchImpl?: typeof fetch
  /** Injectable for tests; defaults to the real clock-free path. */
  readonly signal?: AbortSignal | undefined
}

/** Production adapter: PostgREST over `fetch`. */
export function createRestLanguageRepository(
  options: RestLanguageRepositoryOptions,
): LanguageRepository {
  const { supabaseUrl, anonKey, signal } = options
  const doFetch = options.fetchImpl ?? fetch
  const endpoint =
    `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/languages_public` +
    `?select=${encodeURIComponent(SELECT_COLUMNS)}` +
    `&order=${encodeURIComponent('sort_order.asc,code.asc')}`

  return {
    async listEnabled(): Promise<readonly LanguageRow[]> {
      const response = await doFetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: anonKey,
          authorization: `Bearer ${anonKey}`,
          accept: 'application/json',
        },
        ...(signal === undefined ? {} : { signal }),
      })

      if (!response.ok) {
        // The status is enough to log; the body may echo query details, so it is
        // not surfaced beyond this boundary.
        throw new Error(`Languages query failed with status ${response.status}`)
      }

      const payload: unknown = await response.json()
      if (!Array.isArray(payload)) {
        throw new TypeError('Expected an array of language rows')
      }
      return payload.map(toLanguageRow)
    },
  }
}

/** Test adapter. Rows are returned in the order given. */
export function createInMemoryLanguageRepository(
  rows: readonly LanguageRow[],
): LanguageRepository {
  return {
    async listEnabled(): Promise<readonly LanguageRow[]> {
      return rows.filter((row) => row.enabled)
    },
  }
}
