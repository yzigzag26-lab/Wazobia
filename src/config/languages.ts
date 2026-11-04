/**
 * Language catalogue configuration.
 *
 * Blueprint §7, §9.2 and §16.1: Yoruba (yo), Hausa (ha) and Igbo (ig) are
 * first-class target languages and launch together. English (en) is a bridge
 * language, not the target of the African-language strategy.
 *
 * This module is the single source of truth for language identity in the
 * frontend. Nothing may hard-code a language list, a language name, or a
 * `language === 'yoruba'` style conditional elsewhere in the application.
 *
 * Additional African languages must be addable by appending a record here (and,
 * once the backend exists, by consuming `GET /api/v1/languages`). The shape
 * already carries dialect and orthography slots so that adding e.g. Nigerian
 * Pidgin or Twi later is a data change, not a redesign.
 */

export type LanguageCode = 'yo' | 'ha' | 'ig' | 'en'

export type LanguageRole = 'target' | 'bridge'

export type TextDirection = 'ltr' | 'rtl'

export interface Language {
  /** ISO 639-1 code. Used in URLs, API payloads and `lang` attributes. */
  readonly code: LanguageCode
  /** Endonym — the name of the language in that language, always in full
   *  orthography with tone marks where the language uses them. */
  readonly nativeName: string
  /** English name, for the bridge-language UI. */
  readonly englishName: string
  readonly role: LanguageRole
  readonly direction: TextDirection
  /** Whether the code is enabled for selection in the current release. */
  readonly enabled: boolean
  /**
   * Dialect records are owned by the backend (`GET /api/v1/languages`).
   * Declared here so callers are written against the final shape.
   */
  readonly dialectCount?: number
}

export const LANGUAGES: readonly Language[] = [
  {
    code: 'yo',
    nativeName: 'Yorùbá',
    englishName: 'Yoruba',
    role: 'target',
    direction: 'ltr',
    enabled: true,
  },
  {
    code: 'ha',
    nativeName: 'Hausa',
    englishName: 'Hausa',
    role: 'target',
    direction: 'ltr',
    enabled: true,
  },
  {
    code: 'ig',
    nativeName: 'Igbo',
    englishName: 'Igbo',
    role: 'target',
    direction: 'ltr',
    enabled: true,
  },
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    role: 'bridge',
    direction: 'ltr',
    enabled: true,
  },
] as const

/** Languages that are the product's target languages. */
export const TARGET_LANGUAGES: readonly Language[] = LANGUAGES.filter(
  (language) => language.role === 'target',
)

export const BRIDGE_LANGUAGE: Language = LANGUAGES.find(
  (language) => language.role === 'bridge',
) ?? {
  code: 'en',
  nativeName: 'English',
  englishName: 'English',
  role: 'bridge',
  direction: 'ltr',
  enabled: true,
}

const LANGUAGE_BY_CODE = new Map<string, Language>(
  LANGUAGES.map((language) => [language.code, language]),
)

/** Type guard for untrusted input (URL params, API responses). */
export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && LANGUAGE_BY_CODE.has(value)
}

/** Returns the language record or `undefined` — callers handle the miss. */
export function findLanguage(code: string | null | undefined): Language | undefined {
  if (!code) return undefined
  return LANGUAGE_BY_CODE.get(code)
}

/** Returns the language record, falling back to the bridge language. */
export function getLanguage(code: string | null | undefined): Language {
  return findLanguage(code) ?? BRIDGE_LANGUAGE
}

export const DEFAULT_LANGUAGE_CODE: LanguageCode = 'en'
