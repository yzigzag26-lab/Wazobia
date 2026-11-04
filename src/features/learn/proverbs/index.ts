import type { StudyLanguage } from '../types'
import { HAUSA_PROVERBS } from './hausa'
import { IGBO_PROVERBS } from './igbo'
import type { Proverb, ProverbTheme } from './types'
import { YORUBA_PROVERBS } from './yoruba'

/**
 * Proverb catalogue, keyed by language.
 *
 * The three collections are separate files so that editing one language never
 * risks a merge conflict in another, and so a reviewer can be assigned a single
 * language's file.
 */
export const PROVERBS_BY_LANGUAGE: Readonly<Record<StudyLanguage, readonly Proverb[]>> = {
  yo: YORUBA_PROVERBS,
  ha: HAUSA_PROVERBS,
  ig: IGBO_PROVERBS,
}

export const ALL_PROVERBS: readonly Proverb[] = [
  ...YORUBA_PROVERBS,
  ...HAUSA_PROVERBS,
  ...IGBO_PROVERBS,
]

export function proverbsFor(language: StudyLanguage): readonly Proverb[] {
  return PROVERBS_BY_LANGUAGE[language]
}

export function findProverb(id: string): Proverb | undefined {
  return ALL_PROVERBS.find((proverb) => proverb.id === id)
}

export const PROVERB_THEME_LABELS: Readonly<Record<ProverbTheme, string>> = {
  wisdom: 'Wisdom',
  patience: 'Patience',
  community: 'Community',
  effort: 'Effort',
  character: 'Character',
  caution: 'Caution',
  family: 'Family',
  nature: 'Nature',
  humility: 'Humility',
}

export type { Proverb, ProverbTheme, ProverbVisual } from './types'
