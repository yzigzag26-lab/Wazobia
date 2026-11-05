import { apiRequest } from './client'
import type {
  ChatRequest,
  ChatResponse,
  DictionarySearchResponse,
  LanguageRecord,
  ListCoursesResponse,
  Lesson,
  ListLanguagesResponse,
  Profile,
  ProfileUpdate,
  TranslateRequest,
  TranslateResponse,
} from './contracts/endpoints'

/**
 * Typed service functions — one per documented endpoint.
 *
 * Blueprint §7: these are the only functions feature code may call. They contain
 * no business logic, no provider credentials and no fabricated fallbacks: each
 * either returns real data or throws a normalised `WazobiaApiError`.
 */

export const languageService = {
  list: async (signal?: AbortSignal): Promise<readonly LanguageRecord[]> => {
    const data = await apiRequest<ListLanguagesResponse>('/languages', { signal })
    return data.languages
  },
}

/**
 * `aiService` and `translateService` are protected endpoints: both require a
 * bearer token and the server answers 401 without one. Making `accessToken`
 * required at the type level means a caller cannot forget it — the mistake is a
 * compile error rather than a runtime failure on a page a user is looking at.
 */
export interface AuthedCall {
  readonly accessToken: string | undefined
  readonly signal?: AbortSignal | undefined
}

export const aiService = {
  chat: async (payload: ChatRequest, auth: AuthedCall): Promise<ChatResponse> =>
    apiRequest<ChatResponse>('/ai/chat', {
      method: 'POST',
      body: payload,
      accessToken: auth.accessToken,
      ...(auth.signal === undefined ? {} : { signal: auth.signal }),
    }),
}

export const translateService = {
  translate: async (payload: TranslateRequest, auth: AuthedCall): Promise<TranslateResponse> =>
    apiRequest<TranslateResponse>('/translate', {
      method: 'POST',
      body: payload,
      accessToken: auth.accessToken,
      ...(auth.signal === undefined ? {} : { signal: auth.signal }),
    }),
}

export const userService = {
  /** `GET /api/v1/users/me` — the caller, resolved from their own token. */
  me: async (accessToken: string | undefined, signal?: AbortSignal): Promise<Profile> =>
    apiRequest<Profile>('/users/me', {
      accessToken,
      ...(signal === undefined ? {} : { signal }),
    }),

  /**
   * `PATCH /api/v1/users/me` — save the caller's own details.
   *
   * Returns the refreshed profile, so the UI can render what the server
   * actually stored rather than what it hoped it stored.
   */
  update: async (
    update: ProfileUpdate,
    accessToken: string | undefined,
  ): Promise<Profile> =>
    apiRequest<Profile>('/users/me', {
      method: 'PATCH',
      body: update,
      accessToken,
    }),
}

export const dictionaryService = {
  search: async (
    params: { query: string; language?: string; page?: number; pageSize?: number },
    signal?: AbortSignal,
  ): Promise<DictionarySearchResponse> => {
    const search = new URLSearchParams({ q: params.query })
    if (params.language !== undefined) search.set('language', params.language)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.pageSize !== undefined) search.set('page_size', String(params.pageSize))
    return apiRequest<DictionarySearchResponse>(`/dictionary/search?${search.toString()}`, {
      signal,
    })
  },
}

export const learningService = {
  listCourses: async (signal?: AbortSignal): Promise<ListCoursesResponse> => {
    return apiRequest<ListCoursesResponse>('/courses', { signal })
  },
  getLesson: async (id: string, signal?: AbortSignal): Promise<Lesson> =>
    apiRequest<Lesson>(`/lessons/${encodeURIComponent(id)}`, { signal }),
}

/* -------------------------------------------------------------------------- */
/* Dictionary review (reviewer / admin only)                                   */
/* -------------------------------------------------------------------------- */

/**
 * One row of the operator queue. `quality_flag` is computed in the database
 * (`dictionary_review_candidates`), so the UI never invents a verdict about
 * whether a headword is well-formed.
 */
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

export interface ReviewQueue {
  readonly language_code: string
  readonly candidates: readonly ReviewCandidate[]
  readonly limit: number
}

export interface BulkReviewOutcome {
  readonly language_code: string
  readonly decision: 'approved' | 'rejected'
  readonly only_clean: boolean
  readonly reviewed: number
  readonly skipped: number
  readonly skipped_reasons: readonly string[]
  readonly skipped_reasons_truncated: boolean
}

/**
 * Review is authorised in the database, not here. These calls carry the user's
 * token; a non-reviewer gets 403 from Postgres even if they invoke them
 * directly. Hiding the page is an affordance, not the control.
 */
export const reviewService = {
  queue: async (
    language: string,
    limit: number,
    accessToken: string | undefined,
  ): Promise<ReviewQueue> =>
    apiRequest<ReviewQueue>(
      `/dictionary/review?language=${encodeURIComponent(language)}&limit=${String(limit)}`,
      { accessToken },
    ),

  decide: async (
    entryId: string,
    decision: 'approved' | 'rejected' | 'pending',
    accessToken: string | undefined,
  ): Promise<{ id: string; review_status: string; reviewed_at: string | null }> =>
    apiRequest('/dictionary/review', {
      method: 'POST',
      body: { entry_id: entryId, decision },
      accessToken,
    }),

  bulk: async (
    language: string,
    decision: 'approved' | 'rejected',
    onlyClean: boolean,
    accessToken: string | undefined,
  ): Promise<BulkReviewOutcome> =>
    apiRequest<BulkReviewOutcome>('/dictionary/review', {
      method: 'POST',
      body: { mode: 'bulk', language, decision, only_clean: onlyClean, limit: 2000 },
      accessToken,
    }),
}
