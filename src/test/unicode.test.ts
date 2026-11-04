import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/config/languages'

/**
 * Unicode integrity guards (blueprint §2.3, §15.2).
 *
 * These tests protect the two things that break silently in African-language
 * software: characters being normalised into their ASCII base letters, and
 * combining tone marks being reordered or dropped.
 */

/** Characters and digraphs the launch languages require. */
const REQUIRED_CODE_POINTS = [
  // Yoruba dotted letters
  { name: 'Ẹ', text: 'Ẹ' },
  { name: 'ẹ', text: 'ẹ' },
  { name: 'Ọ', text: 'Ọ' },
  { name: 'ọ', text: 'ọ' },
  { name: 'Ṣ', text: 'Ṣ' },
  { name: 'ṣ', text: 'ṣ' },
  // Igbo dotted letters
  { name: 'Ị', text: 'Ị' },
  { name: 'ị', text: 'ị' },
  { name: 'Ụ', text: 'Ụ' },
  { name: 'ụ', text: 'ụ' },
  // Hausa hooked letters
  { name: 'ɓ', text: 'ɓ' },
  { name: 'ɗ', text: 'ɗ' },
  { name: 'ƙ', text: 'ƙ' },
  { name: 'ƴ', text: 'ƴ' },
] as const

describe('Unicode integrity', () => {
  it.each(REQUIRED_CODE_POINTS)('preserves $name through JS string handling', ({ text }) => {
    expect(text.length).toBe(1)
    expect(text.normalize('NFC')).toBe(text)
    expect(Array.from(text)[0]).toBe(text)
  })

  it('keeps Yoruba tone marks in endonyms', () => {
    const yoruba = LANGUAGES.find((language) => language.code === 'yo')
    // "Yorùbá" must keep its grave and acute accents.
    expect(yoruba?.nativeName).toBe('Yorùbá')
    expect(yoruba?.nativeName).not.toBe('Yoruba')
    expect(yoruba?.nativeName.normalize('NFD')).toContain('\u0300')
  })

  it('does not fold combining marks when normalising to NFC', () => {
    const decomposed = 'E\u0323' // E + combining dot below = Ẹ
    expect(decomposed.normalize('NFC')).toBe('Ẹ')
  })
})
