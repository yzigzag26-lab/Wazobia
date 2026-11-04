import { apiRequest } from './client'
import type {
  ChatRequest,
  ChatResponse,
  DictionarySearchResponse,
  LanguageRecord,
  ListCoursesResponse,
  Lesson,
  ListLanguagesResponse,
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

export const aiService = {
  chat: async (payload: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> =>
    apiRequest<ChatResponse>('/ai/chat', { method: 'POST', body: payload, signal }),
}

export const translateService = {
  translate: async (payload: TranslateRequest, signal?: AbortSignal): Promise<TranslateResponse> =>
    apiRequest<TranslateResponse>('/translate', { method: 'POST', body: payload, signal }),
}

export const dictionaryService = {
  search: async (
    params: { query: string; language?: string; page?: number },
    signal?: AbortSignal,
  ): Promise<DictionarySearchResponse> => {
    const search = new URLSearchParams({ q: params.query })
    if (params.language) search.set('language', params.language)
    if (params.page !== undefined) search.set('page', String(params.page))
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
