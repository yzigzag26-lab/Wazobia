/**
 * Language catalogue for onboarding.
 *
 * Split from `./onboarding.ts` so this file exports only data + helpers, while
 * the JSX question registry (`src/features/onboarding/questions.tsx`) can import
 * it without tripping the Fast Refresh "components only" rule.
 */

export type LanguageScript = 'latin' | 'other'

export interface OnboardingLanguage {
  /** Stable identifier stored in the profile — never the display label. */
  readonly id: string
  /** Name as written by its speakers, where the bundled fonts can render it. */
  readonly name: string
  readonly englishName: string
  /** Whether WAZOBIA teaches this language today. */
  readonly available: boolean
  /** `other` means the bundled fonts lack the glyphs, so the English name is shown. */
  readonly script: LanguageScript
}

export const ONBOARDING_LANGUAGES: readonly OnboardingLanguage[] = [
  { id: 'yo', name: 'Yorùbá', englishName: 'Yoruba', available: true, script: 'latin' },
  { id: 'ha', name: 'Hausa', englishName: 'Hausa', available: true, script: 'latin' },
  { id: 'ig', name: 'Igbo', englishName: 'Igbo', available: true, script: 'latin' },
  { id: 'en', name: 'English', englishName: 'English', available: true, script: 'latin' },
  { id: 'pcm', name: 'Naijá', englishName: 'Nigerian Pidgin', available: false, script: 'latin' },
  { id: 'efi', name: 'Efịk', englishName: 'Efik', available: false, script: 'latin' },
  { id: 'ibb', name: 'Ibibio', englishName: 'Ibibio', available: false, script: 'latin' },
  { id: 'bin', name: 'Edo', englishName: 'Bini / Edo', available: false, script: 'latin' },
  { id: 'tiv', name: 'Tiv', englishName: 'Tiv', available: false, script: 'latin' },
  { id: 'kau', name: 'Kanuri', englishName: 'Kanuri', available: false, script: 'latin' },
  { id: 'ful', name: 'Fulfulde', englishName: 'Fula / Fulfulde', available: false, script: 'latin' },
  { id: 'tw', name: 'Twi', englishName: 'Twi', available: false, script: 'latin' },
  { id: 'ee', name: 'Eʋe', englishName: 'Ewe', available: false, script: 'latin' },
  { id: 'wo', name: 'Wolof', englishName: 'Wolof', available: false, script: 'latin' },
  { id: 'sw', name: 'Kiswahili', englishName: 'Swahili', available: false, script: 'latin' },
  { id: 'am', name: 'አማርኛ', englishName: 'Amharic', available: false, script: 'other' },
  { id: 'zu', name: 'isiZulu', englishName: 'Zulu', available: false, script: 'latin' },
  { id: 'xh', name: 'isiXhosa', englishName: 'Xhosa', available: false, script: 'latin' },
]

const LANGUAGE_BY_ID = new Map(ONBOARDING_LANGUAGES.map((language) => [language.id, language]))

export function findOnboardingLanguage(id: string): OnboardingLanguage | undefined {
  return LANGUAGE_BY_ID.get(id)
}

/**
 * Label that is guaranteed to render with the bundled fonts.
 *
 * Ge'ez (Amharic) is not covered by the subsetted Noto Sans / Gentium Plus
 * files, so it would show as tofu boxes. Non-Latin scripts therefore fall back
 * to the English name rather than displaying broken glyphs.
 */
export function languageLabel(language: OnboardingLanguage): string {
  return language.script === 'latin' ? language.name : language.englishName
}
