import type { LanguageCode } from '@/config/languages'
import type { ApiErrorCode } from './envelope'

/**
 * Endpoint contracts approved in the blueprint (§10.3, Appendix A).
 *
 * These describe what the *backend must provide*. The frontend is written
 * against them; the backend is not implemented yet. Nothing in this file
 * simulates a response.
 */

/* -------------------------------------------------------------------------- */
/* GET /api/v1/languages                                                       */
/* -------------------------------------------------------------------------- */

export interface LanguageRecord {
  readonly code: string
  readonly native_name: string
  readonly english_name: string
  readonly role: 'target' | 'bridge'
  readonly direction: 'ltr' | 'rtl'
  readonly enabled: boolean
  readonly dialect_count?: number
}

export interface ListLanguagesResponse {
  readonly languages: readonly LanguageRecord[]
}

/* -------------------------------------------------------------------------- */
/* GET, PATCH /api/v1/users/me                                                 */
/* -------------------------------------------------------------------------- */

export interface Profile {
  readonly id: string
  readonly display_name: string
  /** Public handle, `null` when never chosen. */
  readonly username: string | null
  readonly preferred_language: string
  /** The address on the verified session, not a copy stored in `profiles`. */
  readonly email: string | null
  readonly roles: readonly string[]
  readonly created_at: string
}

/**
 * Fields a caller may change on their own profile.
 *
 * Allowlisted server-side too — an unknown key is rejected, not silently
 * dropped, so a client cannot believe it changed something it did not.
 */
export interface ProfileUpdate {
  readonly display_name?: string
  readonly username?: string | null
  readonly preferred_language?: string | null
}

/* -------------------------------------------------------------------------- */
/* POST /api/v1/ai/chat — blueprint Appendix A.1                               */
/* -------------------------------------------------------------------------- */

/** Provenance label. The UI must never present `ai_generated` as verified. */
export type AnswerType = 'ai_generated' | 'reviewed_resource' | 'mixed'

export interface ChatSource {
  readonly type: 'dictionary_entry' | 'lesson' | 'cultural_record'
  readonly id: string
  readonly review_status: 'approved' | 'pending'
}

export interface ChatRequest {
  readonly message: string
  readonly language?: LanguageCode
  readonly conversation_id?: string | null
}

export interface ChatResponse {
  readonly response: string
  readonly language: LanguageCode
  readonly conversation_id: string
  readonly answer_type: AnswerType
  readonly sources: readonly ChatSource[]
}

/* -------------------------------------------------------------------------- */
/* POST /api/v1/translate                                                      */
/* -------------------------------------------------------------------------- */

export type TranslationRegister = 'formal' | 'informal' | 'neutral'

export interface TranslateRequest {
  readonly text: string
  readonly source_language: LanguageCode | 'auto'
  readonly target_language: LanguageCode
  readonly register?: TranslationRegister
}

export interface TranslationAlternative {
  readonly text: string
  readonly register: TranslationRegister
  readonly note?: string
}

export interface TranslateResponse {
  readonly translation: string
  readonly source_language: LanguageCode | null
  readonly target_language: LanguageCode
  readonly alternatives: readonly TranslationAlternative[]
  /** Drafts are unreviewed until a human reviewer approves them. */
  readonly review_status: 'ai_suggestion' | 'reviewed'
}

/* -------------------------------------------------------------------------- */
/* GET /api/v1/dictionary/search                                               */
/* -------------------------------------------------------------------------- */

export interface DictionaryEntrySummary {
  readonly id: string
  readonly headword: string
  readonly language: string
  readonly part_of_speech: string | null
  readonly review_status: 'approved' | 'pending' | 'rejected'
  readonly gloss: string | null
}

export interface DictionarySearchResponse {
  readonly query: string
  readonly results: readonly DictionaryEntrySummary[]
  readonly total: number
  readonly page: number
  readonly page_size: number
}

/* -------------------------------------------------------------------------- */
/* GET /api/v1/courses, GET /api/v1/lessons/:id                                */
/* -------------------------------------------------------------------------- */

export interface CourseSummary {
  readonly id: string
  readonly title: string
  readonly language: string
  readonly level: 'beginner' | 'intermediate' | 'advanced'
  readonly lesson_count: number
  readonly description: string | null
}

export interface ListCoursesResponse {
  readonly courses: readonly CourseSummary[]
}

export interface LessonSentence {
  readonly id: string
  readonly text: string
  readonly translation: string
  /** Start offset in milliseconds, only when TTS alignment is reliable. */
  readonly start_ms: number | null
}

export interface Lesson {
  readonly id: string
  readonly course_id: string
  readonly title: string
  readonly language: string
  readonly sentences: readonly LessonSentence[]
  /** False when no approved voice exists for this language. */
  readonly read_aloud_available: boolean
}

/* -------------------------------------------------------------------------- */
/* Error contract documented per endpoint                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every endpoint above may return the standard error envelope. This map records
 * the documented error codes per endpoint so the UI can respond specifically
 * instead of showing a generic failure.
 */
export const ENDPOINT_ERRORS: Readonly<Record<string, readonly ApiErrorCode[]>> = {
  'GET /api/v1/languages': ['INTERNAL_ERROR'],
  'GET /api/v1/users/me': ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND'],
  'PATCH /api/v1/users/me': [
    'VALIDATION_ERROR',
    'UNAUTHENTICATED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'SEMANTIC_ERROR',
    'RATE_LIMITED',
  ],
  'POST /api/v1/ai/chat': [
    'VALIDATION_ERROR',
    'UNAUTHENTICATED',
    'FORBIDDEN',
    'RATE_LIMITED',
    'PROVIDER_UNAVAILABLE',
  ],
  'POST /api/v1/translate': [
    'VALIDATION_ERROR',
    'RATE_LIMITED',
    'PROVIDER_UNAVAILABLE',
  ],
  'GET /api/v1/dictionary/search': ['VALIDATION_ERROR', 'INTERNAL_ERROR'],
  'GET /api/v1/courses': ['INTERNAL_ERROR'],
  'GET /api/v1/lessons/:id': ['NOT_FOUND', 'INTERNAL_ERROR'],
}
