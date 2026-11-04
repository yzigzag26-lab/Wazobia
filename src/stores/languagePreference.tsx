import { useCallback, useMemo, type ReactNode } from 'react'
import {
  DEFAULT_LANGUAGE_CODE,
  getLanguage,
  isLanguageCode,
  type LanguageCode,
} from '@/config/languages'
import { usePersistentState } from '@/hooks/usePersistentState'
import {
  LanguagePreferenceContext,
  type LanguagePreferenceValue,
} from './languagePreferenceContext'

/**
 * Viewer's language preference.
 *
 * A *preference*, not a translation layer: it tells the application which
 * language the user wants language content presented in, and is persisted
 * locally until the account preference endpoint exists. It must not be used to
 * fake localised interface copy — interface text is English (the bridge
 * language) for now.
 *
 * This file exports only a component so Fast Refresh works; the hook lives in
 * `useLanguagePreference.ts` and the context in `languagePreferenceContext.ts`.
 */
export function LanguagePreferenceProvider({ children }: { readonly children: ReactNode }) {
  const [code, setCode] = usePersistentState<LanguageCode>(
    'language',
    DEFAULT_LANGUAGE_CODE,
    (value): value is LanguageCode => isLanguageCode(value),
  )

  const setLanguageCode = useCallback(
    (next: LanguageCode) => {
      setCode(next)
    },
    [setCode],
  )

  const value = useMemo<LanguagePreferenceValue>(
    () => ({ code, language: getLanguage(code), setLanguageCode }),
    [code, setLanguageCode],
  )

  return <LanguagePreferenceContext value={value}>{children}</LanguagePreferenceContext>
}
