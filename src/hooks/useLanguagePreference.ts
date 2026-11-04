import { use } from 'react'
import {
  LanguagePreferenceContext,
  type LanguagePreferenceValue,
} from '@/stores/languagePreferenceContext'

export function useLanguagePreference(): LanguagePreferenceValue {
  const context = use(LanguagePreferenceContext)
  if (!context) {
    throw new Error('useLanguagePreference must be used inside <LanguagePreferenceProvider>')
  }
  return context
}
