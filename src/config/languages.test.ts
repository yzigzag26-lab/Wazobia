import { describe, expect, it } from 'vitest'
import {
  BRIDGE_LANGUAGE,
  LANGUAGES,
  TARGET_LANGUAGES,
  findLanguage,
  getLanguage,
  isLanguageCode,
} from './languages'

describe('language catalogue', () => {
  it('launches with Yoruba, Hausa and Igbo as target languages', () => {
    expect(TARGET_LANGUAGES.map((language) => language.code)).toEqual(['yo', 'ha', 'ig'])
  })

  it('treats English as the bridge language, not a target', () => {
    expect(BRIDGE_LANGUAGE.code).toBe('en')
    expect(BRIDGE_LANGUAGE.role).toBe('bridge')
    expect(TARGET_LANGUAGES.some((language) => language.code === 'en')).toBe(false)
  })

  it('keeps African languages first in the ordering', () => {
    expect(LANGUAGES[0]?.code).toBe('yo')
    expect(LANGUAGES.at(-1)?.code).toBe('en')
  })

  it('uses full orthography with tone marks in endonyms', () => {
    expect(findLanguage('yo')?.nativeName).toBe('Yorùbá')
  })

  it('validates untrusted language codes', () => {
    expect(isLanguageCode('yo')).toBe(true)
    expect(isLanguageCode('fr')).toBe(false)
    expect(isLanguageCode(null)).toBe(false)
    expect(isLanguageCode(42)).toBe(false)
  })

  it('falls back to the bridge language rather than throwing', () => {
    expect(findLanguage('fr')).toBeUndefined()
    expect(getLanguage('fr').code).toBe('en')
  })
})
