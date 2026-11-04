import { getLanguage, type LanguageCode } from '@/config/languages'
import type { StudyLanguage } from './types'

/**
 * Language display and narrowing helpers for Learn.
 *
 * The learner's `primaryLanguage` is a `LanguageCode`, which includes `en`.
 * Learn only deals in the three launch languages, so this module is the single
 * place that narrows one to the other — and it does so *honestly*: an English
 * selection is not silently upgraded to Yorùbá, it simply has no Learn content,
 * which is the truth.
 */

export const STUDY_LANGUAGE_LABELS: Record<LanguageCode, string> = {
  yo: getLanguage('yo').nativeName,
  ha: getLanguage('ha').nativeName,
  ig: getLanguage('ig').nativeName,
  en: getLanguage('en').nativeName,
}

/** The three languages Learn has content for, in catalogue order. */
export const STUDY_LANGUAGES: readonly StudyLanguage[] = ['yo', 'ha', 'ig']

export function isStudyLanguage(code: LanguageCode | null | undefined): code is StudyLanguage {
  return code === 'yo' || code === 'ha' || code === 'ig'
}
