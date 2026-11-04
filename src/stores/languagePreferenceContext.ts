import { createContext } from 'react'
import type { Language, LanguageCode } from '@/config/languages'

/**
 * Context object only.
 *
 * Kept in its own module so `languagePreference.tsx` can export a component
 * (the provider) while `useLanguagePreference.ts` exports a hook. When one file
 * exports both, React Fast Refresh cannot hot-update either without a full
 * reload — that is what the `react/only-export-components` warning reports.
 */
export interface LanguagePreferenceValue {
  readonly code: LanguageCode
  readonly language: Language
  readonly setLanguageCode: (code: LanguageCode) => void
}

export const LanguagePreferenceContext = createContext<LanguagePreferenceValue | null>(null)
