import type { StudyLanguage } from '../types'
import { HAUSA_STORIES } from './hausa-stories'
import { IGBO_STORIES } from './igbo-stories'
import type { Story, StoryCategory } from './types'
import { YORUBA_STORIES } from './yoruba-stories'

/**
 * Story catalogue, keyed by language.
 *
 * Adding a story is a data edit in the language file; no component changes. The
 * collection screen groups by `category`, so a new category only needs an entry
 * in `STORY_CATEGORY_LABELS`.
 */
export const STORIES_BY_LANGUAGE: Readonly<Record<StudyLanguage, readonly Story[]>> = {
  yo: YORUBA_STORIES,
  ha: HAUSA_STORIES,
  ig: IGBO_STORIES,
}

export const ALL_STORIES: readonly Story[] = [...YORUBA_STORIES, ...HAUSA_STORIES, ...IGBO_STORIES]

export function storiesFor(language: StudyLanguage): readonly Story[] {
  return STORIES_BY_LANGUAGE[language]
}

export function findStory(id: string): Story | undefined {
  return ALL_STORIES.find((story) => story.id === id)
}

/** Groups a language's stories by category, keeping the declared order. */
export function groupStoriesByCategory(
  language: StudyLanguage,
): readonly { readonly category: StoryCategory; readonly stories: readonly Story[] }[] {
  const stories = storiesFor(language)
  const seen: StoryCategory[] = []
  for (const story of stories) {
    if (!seen.includes(story.category)) seen.push(story.category)
  }
  return seen.map((category) => ({
    category,
    stories: stories.filter((story) => story.category === category),
  }))
}

export {
  STORY_CATEGORY_LABELS,
  STORY_ORIGIN_LABELS,
  type Story,
  type StoryCategory,
  type StoryOrigin,
} from './types'
