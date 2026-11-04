/**
 * Onboarding question catalogue.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH FOR ONBOARDING ANSWERS.
 *
 * These option sets are the approved answer catalogue: the project owner
 * reviewed the drafted choices and adopted them as-is, so they are now the
 * product copy rather than placeholders.
 *
 * To change wording later: edit the option arrays in this file only. No
 * component, form, validation or type change is required, because every screen
 * renders from these records and every stored value is the option `id` — so
 * relabelling an option never migrates stored answers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Option<T extends string = string> {
  readonly id: T
  readonly label: string
  /** Optional supporting line shown under the label on larger cards. */
  readonly description?: string
}

/* ------------------------------------------------------------------ languages */

/**
 * African languages offered for "want to learn" and "already know".
 *
 * `available` marks the four launch languages already modelled by the platform
 * (`src/config/languages.ts`). The others are listed so users can express real
 * intent — selecting them cannot be honoured yet, and the UI says so.
 *
 * The catalogue itself lives in `./onboardingCatalog.ts`, re-exported here so
 * callers keep importing from one place.
 */

export {
  ONBOARDING_LANGUAGES,
  findOnboardingLanguage,
  languageLabel,
  type LanguageScript,
  type OnboardingLanguage,
} from './onboardingCatalog'




/* ---------------------------------------------------------- step 1 — answers */

export type LanguageRelationship =
  | 'native_speaker'
  | 'heritage_speaker'
  | 'learner'
  | 'professional_use'
  | 'curious'
  | 'prefer_not_to_say'

export const LANGUAGE_RELATIONSHIPS: readonly Option<LanguageRelationship>[] = [
  {
    id: 'native_speaker',
    label: 'I am a native speaker',
    description: 'An African language is my first language.',
  },
  {
    id: 'heritage_speaker',
    label: 'I speak it at home or in my family',
    description: 'I grew up around it, even if I am still learning to read or write it.',
  },
  {
    id: 'learner',
    label: 'I am learning one',
    description: 'I am studying an African language, formally or on my own.',
  },
  {
    id: 'professional_use',
    label: 'I use it in my work',
    description: 'Teaching, translation, media, research or community work.',
  },
  {
    id: 'curious',
    label: 'I am curious about African languages',
    description: 'I do not speak one yet.',
  },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
]

/* ---------------------------------------------------------- step 2 — answers */

export type ProficiencyLevel =
  | 'none'
  | 'beginner'
  | 'elementary'
  | 'intermediate'
  | 'advanced'
  | 'fluent'

export const PROFICIENCY_LEVELS: readonly Option<ProficiencyLevel>[] = [
  { id: 'none', label: 'No experience yet', description: 'Starting from the very beginning.' },
  { id: 'beginner', label: 'Beginner', description: 'A few words and greetings.' },
  { id: 'elementary', label: 'Elementary', description: 'Simple conversations with help.' },
  { id: 'intermediate', label: 'Intermediate', description: 'Comfortable in everyday situations.' },
  { id: 'advanced', label: 'Advanced', description: 'Fluent in most contexts, refining accuracy.' },
  { id: 'fluent', label: 'Fluent or native', description: 'I want to deepen or formalise it.' },
]

export type LearningGoal =
  | 'conversation'
  | 'reading_writing'
  | 'culture_heritage'
  | 'family'
  | 'travel'
  | 'work_business'
  | 'teaching'
  | 'research'

export const LEARNING_GOALS: readonly Option<LearningGoal>[] = [
  { id: 'conversation', label: 'Speak and understand in conversation' },
  { id: 'reading_writing', label: 'Read and write with correct tone marks' },
  { id: 'culture_heritage', label: 'Reconnect with culture and heritage' },
  { id: 'family', label: 'Speak with family and community' },
  { id: 'travel', label: 'Travel and everyday situations' },
  { id: 'work_business', label: 'Work or business' },
  { id: 'teaching', label: 'Teach others' },
  { id: 'research', label: 'Research or academic study' },
]

/* ---------------------------------------------------------- step 3 — answers */

export type JoiningReason =
  | 'learn_language'
  | 'translate_understand'
  | 'preserve_heritage'
  | 'teach_children'
  | 'connect_community'
  | 'research_data'
  | 'professional_tools'

export const JOINING_REASONS: readonly Option<JoiningReason>[] = [
  { id: 'learn_language', label: 'To learn an African language' },
  { id: 'translate_understand', label: 'To translate and understand meaning' },
  { id: 'preserve_heritage', label: 'To help preserve language and culture' },
  { id: 'teach_children', label: 'To teach my children or students' },
  { id: 'connect_community', label: 'To connect with other speakers' },
  { id: 'research_data', label: 'For research or language data' },
  { id: 'professional_tools', label: 'For professional or work use' },
]

export type DiscoverySource =
  | 'search_engine'
  | 'social_media'
  | 'friend_family'
  | 'school_university'
  | 'event_community'
  | 'news_article'
  | 'other'

export const DISCOVERY_SOURCES: readonly Option<DiscoverySource>[] = [
  { id: 'search_engine', label: 'Search engine' },
  { id: 'social_media', label: 'Social media' },
  { id: 'friend_family', label: 'A friend or family member' },
  { id: 'school_university', label: 'School or university' },
  { id: 'event_community', label: 'An event or community group' },
  { id: 'news_article', label: 'A news article or blog' },
  { id: 'other', label: 'Somewhere else' },
]

export type LearningFrequency = 'daily' | 'few_times_week' | 'weekly' | 'occasionally'

export const LEARNING_FREQUENCIES: readonly Option<LearningFrequency>[] = [
  { id: 'daily', label: 'Every day', description: 'A short session most days.' },
  { id: 'few_times_week', label: 'A few times a week', description: 'Two to four sessions.' },
  { id: 'weekly', label: 'Once a week', description: 'A regular longer session.' },
  { id: 'occasionally', label: 'Now and then', description: 'Whenever I have time.' },
]
