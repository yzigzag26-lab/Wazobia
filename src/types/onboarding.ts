import type {
  DiscoverySource,
  JoiningReason,
  LanguageRelationship,
  LearningFrequency,
  LearningGoal,
  ProficiencyLevel,
} from '@/config/onboarding'

/**
 * The onboarding answer model.
 *
 * Stored values are always stable machine ids (not display labels), so wording
 * can change without migrating data, and so the same shape can be POSTed to the
 * backend later without translation.
 *
 * Empty collections mean "not answered yet", never "none". A user who genuinely
 * has no additional goals leaves the list empty and that is recorded as
 * unanswered — the questionnaire never infers meaning from an absence.
 */
export interface UserOnboardingProfile {
  /** ISO 3166-1 alpha-2, or `prefer_not_to_say`. Never a city or address. */
  countryOfOrigin: string | null
  currentCountry: string | null
  /** Language ids from ONBOARDING_LANGUAGES. */
  knownLanguages: string[]
  languageRelationship: LanguageRelationship | null

  /** African languages the user wants to learn. */
  targetLanguages: string[]
  proficiencyLevel: ProficiencyLevel | null
  learningGoals: LearningGoal[]

  joiningReason: JoiningReason | null
  discoverySource: DiscoverySource | null
  preferredLearningFrequency: LearningFrequency | null
}

export function createEmptyOnboardingProfile(): UserOnboardingProfile {
  return {
    countryOfOrigin: null,
    currentCountry: null,
    knownLanguages: [],
    languageRelationship: null,
    targetLanguages: [],
    proficiencyLevel: null,
    learningGoals: [],
    joiningReason: null,
    discoverySource: null,
    preferredLearningFrequency: null,
  }
}

/**
 * The three groups from the specification. The questionnaire asks one question
 * per page, so these are used for grouping in the progress indicator and docs,
 * not for batching questions onto a single screen.
 */
export const ONBOARDING_GROUPS = {
  1: {
    name: 'Background',
    fields: ['countryOfOrigin', 'currentCountry', 'knownLanguages', 'languageRelationship'],
  },
  2: {
    name: 'Language journey',
    fields: ['targetLanguages', 'proficiencyLevel', 'learningGoals'],
  },
  3: { name: 'Motivation', fields: ['joiningReason', 'discoverySource', 'preferredLearningFrequency'] },
} as const satisfies Record<number, { name: string; fields: readonly (keyof UserOnboardingProfile)[] }>

export type OnboardingGroup = keyof typeof ONBOARDING_GROUPS

/** Deep-ish equality used to decide whether answers changed before "saving". */
export function profilesEqual(a: UserOnboardingProfile, b: UserOnboardingProfile): boolean {
  const keys = Object.keys(a) as (keyof UserOnboardingProfile)[]
  return keys.every((key) => {
    const left = a[key]
    const right = b[key]
    if (Array.isArray(left) && Array.isArray(right)) {
      return left.length === right.length && left.every((value, i) => value === right[i])
    }
    return left === right
  })
}
