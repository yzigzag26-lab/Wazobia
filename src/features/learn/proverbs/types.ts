import type { ContentProvenance, StudyLanguage } from '../types'

/**
 * A proverb card.
 *
 * Design notes that matter for correctness:
 *
 * - `original` is the proverb *in its own orthography*, tone marks included.
 *   Never normalise it to ASCII for storage or search.
 * - `literal` and `meaning` are separate on purpose. A proverb's literal sense
 *   and its teaching are often different, and conflating them is the most common
 *   way language material gets flattened.
 * - `visual` names an illustration by id, not by embedding markup. The
 *   illustration must correspond to imagery the proverb itself uses — a proverb
 *   about an elephant gets an elephant. Decorative pan-African motifs are not
 *   used.
 * - `provenance` is honest. See the module README for what is and is not claimed.
 */

/** Illustration keys, resolved by `ProverbIllustration`. */
export type ProverbVisual =
  | 'elephant'
  | 'tortoise'
  | 'bird'
  | 'tree'
  | 'river'
  | 'calabash'
  | 'drum'
  | 'basket'
  | 'farm'
  | 'compound'
  | 'market'
  | 'moon'
  | 'fire'
  | 'hand'
  | 'path'
  | 'child'
  | 'cloth'
  | 'pot'
  | 'fish'
  | 'rain'

/** Category used for filtering on the proverb screen. */
export type ProverbTheme =
  | 'wisdom'
  | 'patience'
  | 'community'
  | 'effort'
  | 'character'
  | 'caution'
  | 'family'
  | 'nature'
  | 'humility'

export interface Proverb {
  readonly id: string
  readonly language: StudyLanguage
  /** The proverb in full orthography. */
  readonly original: string
  /** Word-for-word or near-literal rendering into English. */
  readonly literal: string
  /** The teaching the proverb carries. */
  readonly meaning: string
  /** Where and how it is used in speech, and any cultural context. */
  readonly context: string
  readonly theme: ProverbTheme
  readonly visual: ProverbVisual
  /**
   * Regional or dialect note when the form varies. Optional because WAZOBIA has
   * no verified dialect survey; absent means "not recorded", not "universal".
   */
  readonly variation?: string
  readonly provenance: ContentProvenance
}
