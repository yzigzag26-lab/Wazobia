import { describe, expect, it } from 'vitest'
import { TARGET_LANGUAGES } from '@/config/languages'
import { ALL_PROVERBS, PROVERBS_BY_LANGUAGE, proverbsFor } from './index'

/**
 * Proverb data guards.
 *
 * These protect three things that are easy to break accidentally and expensive
 * to get wrong:
 *
 *  1. Coverage — the brief requires at least 20 entries per language.
 *  2. Lingering diacritics. A "helpful" `.normalize('NFD')` or an ASCII cleanup
 *     pass would silently destroy Yorùbá tone marks and Igbo dotted vowels.
 *  3. Honesty. Nothing in this dataset has been reviewed by a native speaker, so
 *     no entry may claim that it has. This is the test that stops a future
 *     contributor from marking the data "reviewed" to make the UI tidier.
 */

const STUDY_LANGUAGES = ['yo', 'ha', 'ig'] as const

/** Characters that must survive verbatim in each language's data. */
const REQUIRED_GLYPHS: Record<(typeof STUDY_LANGUAGES)[number], readonly string[]> = {
  yo: ['ẹ', 'ọ', 'ṣ', 'á', 'à'],
  ha: ['ɓ', 'ɗ', 'ƙ'],
  // Igbo dotted vowels. `ṅ` is deliberately NOT required: these 24 proverbs
  // happen not to contain a syllabic nasal, and adding one to satisfy a test
  // would mean editing the language to fit the assertion. Coverage is asserted
  // for the glyphs that do appear, and a reviewer expanding the set will
  // naturally bring ṅ in.
  ig: ['ị', 'ọ', 'ụ'],
}

describe('proverb coverage', () => {
  it.each(STUDY_LANGUAGES)('%s has at least 20 entries', (language) => {
    expect(proverbsFor(language).length).toBeGreaterThanOrEqual(20)
  })

  it('covers every target language the product ships', () => {
    const covered = new Set(Object.keys(PROVERBS_BY_LANGUAGE))
    for (const language of TARGET_LANGUAGES) {
      expect(covered.has(language.code)).toBe(true)
    }
  })

  it('gives every proverb a globally unique id', () => {
    const ids = ALL_PROVERBS.map((proverb) => proverb.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('proverb linguistic integrity', () => {
  it.each(STUDY_LANGUAGES)('%s entries keep their required glyphs', (language) => {
    const corpus = proverbsFor(language)
      .map((proverb) => proverb.original)
      .join(' ')
    for (const glyph of REQUIRED_GLYPHS[language]) {
      expect(corpus).toContain(glyph)
    }
  })

  it('stores every original in NFC so combining marks are precomposed', () => {
    for (const proverb of ALL_PROVERBS) {
      expect(proverb.original).toBe(proverb.original.normalize('NFC'))
    }
  })

  it('does not collapse a language id into a display name', () => {
    // Every entry must declare one of the three study codes, never "English"
    // and never a human-readable label.
    for (const proverb of ALL_PROVERBS) {
      expect(STUDY_LANGUAGES).toContain(proverb.language)
    }
  })

  it('keeps translation, meaning and context as separate fields', () => {
    for (const proverb of ALL_PROVERBS) {
      expect(proverb.literal.length).toBeGreaterThan(10)
      expect(proverb.meaning.length).toBeGreaterThan(10)
      expect(proverb.context.length).toBeGreaterThan(10)
      expect(proverb.literal).not.toBe(proverb.meaning)
    }
  })
})

describe('proverb provenance honesty', () => {
  it('never claims native-speaker review that has not happened', () => {
    // If this fails, either a real review took place and the review process needs
    // documenting, or someone marked data as verified without evidence.
    for (const proverb of ALL_PROVERBS) {
      expect(proverb.provenance.reviewStatus).toBe('unreviewed')
    }
  })

  it('names a source for every documented-traditional entry', () => {
    for (const proverb of ALL_PROVERBS) {
      if (proverb.provenance.provenance === 'documented-traditional') {
        expect(proverb.provenance.source).toBeTruthy()
      }
    }
  })

  it('gives every entry an illustration tied to its imagery', () => {
    for (const proverb of ALL_PROVERBS) {
      expect(proverb.visual).toBeTruthy()
    }
  })
})

describe('proverb orthography notes', () => {
  it('keeps the Igbo syllabic nasal available to the font pipeline', () => {
    // Not a data requirement today (see REQUIRED_GLYPHS), but the character must
    // survive JS string handling so future entries can use it safely.
    const nasal = '\u1E45' // ṅ
    expect(nasal.normalize('NFC')).toBe(nasal)
    expect(Array.from(nasal)).toHaveLength(1)
  })
})
