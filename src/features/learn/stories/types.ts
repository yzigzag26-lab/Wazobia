import type { ContentProvenance, StudyLanguage, VocabularyEntry } from '../types'

/**
 * African Stories model.
 *
 * The fourth learning pillar. A story is a language-learning object, not an
 * article: it must carry vocabulary, expressions and comprehension questions,
 * or it does not belong here.
 *
 * Provenance separation is the central rule. `origin` distinguishes three very
 * different things and the UI renders each differently:
 *
 *   documented  — a traditional tale that appears in published collections.
 *                 `attribution.origin` must name the collection.
 *   adaptation  — a traditional tale reshaped for learners. The original is
 *                 acknowledged and the reshaping is stated.
 *   original    — written for WAZOBIA as teaching material. NO traditional
 *                 origin is claimed, and the UI must not imply one.
 */

export type StoryOrigin = 'documented' | 'adaptation' | 'original'

/**
 * Story categories.
 *
 * The brief names seven kinds of story (folktales, traditional tales, wisdom,
 * moral, cultural, nature, everyday life). Two of those are represented
 * separately: `traditional` distinguishes a tale carried as tradition from a
 * `folktale` proper, and `everyday` covers stories of ordinary life whose point
 * is not a moral. The remaining five keep their original ids so existing
 * content does not move.
 */
export type StoryCategory =
  | 'folktale'
  | 'traditional'
  | 'wisdom'
  | 'moral'
  | 'cultural'
  | 'nature'
  | 'everyday'

export interface StoryAttribution {
  readonly origin: StoryOrigin
  /** Required for `documented` and `adaptation`. Never invented. */
  readonly source?: string
  /** Who reshaped or wrote it, when that is not a traditional author. */
  readonly author?: string
  /** Region or language community the tale is associated with, when recorded. */
  readonly region?: string
}

/** A sentence-level pairing, which is what makes the reader bilingual. */
export interface StoryParagraph {
  /** Target-language text, full orthography. */
  readonly target: string
  /** English rendering. Optional where a faithful line-by-line is not available. */
  readonly english?: string
}

/** An important expression the reader should leave with. */
export interface StoryExpression {
  readonly expression: string
  readonly gloss: string
  /** Why it matters: idiom, greeting, proverb, register note. */
  readonly note: string
}

export interface Story {
  readonly id: string
  readonly language: StudyLanguage
  readonly category: StoryCategory
  readonly title: string
  readonly englishTitle: string
  /** One line on what the story is about. */
  readonly summary: string
  /** Rough reading time in minutes. Authored, not measured. */
  readonly minutes: number
  readonly paragraphs: readonly StoryParagraph[]
  /** Words worth learning, drawn from the text above. */
  readonly vocabulary: readonly VocabularyEntry[]
  /** Expressions and idioms that resist word-for-word translation. */
  readonly expressions: readonly StoryExpression[]
  /** The cultural background a reader needs. Never a fabricated ethnography. */
  readonly culturalContext: string
  /** The moral or central message. Omitted when the story has no tidy moral. */
  readonly moral?: string
  readonly attribution: StoryAttribution
  readonly provenance: ContentProvenance
  /** Quiz ids that test comprehension of this story. */
  readonly comprehensionQuizIds: readonly string[]
}

export const STORY_CATEGORY_LABELS: Readonly<Record<StoryCategory, string>> = {
  folktale: 'African folktales',
  traditional: 'Traditional tales',
  wisdom: 'Stories about wisdom',
  moral: 'Moral stories',
  cultural: 'Cultural narratives',
  nature: 'Nature and animals',
  everyday: 'Everyday life and community',
}

/** Short badge text for the provenance label rendered on every story. */
export const STORY_ORIGIN_LABELS: Readonly<Record<StoryOrigin, string>> = {
  documented: 'Documented traditional tale',
  adaptation: 'Adaptation of a traditional tale',
  original: 'Written for WAZOBIA',
}
