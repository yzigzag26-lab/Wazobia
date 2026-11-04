/**
 * The onboarding question registry.
 *
 * ONE ENTRY = ONE PAGE. The wizard renders a single question per screen; this
 * array is the only thing that defines the order and the copy. Adding,
 * removing or reordering a question is an edit here — the wizard, the progress
 * counter and validation all derive from it.
 *
 * The answer controls live in `QuestionControl.tsx` (a components-only file, so
 * Fast Refresh keeps working), chosen by question id.
 *
 * `step` preserves the three groups from the specification (Background,
 * Language Journey, Motivation) so the progress indicator can show both overall
 * position and which part of the questionnaire you are in.
 */

import type { UserOnboardingProfile } from '@/types/onboarding'

export type QuestionId =
  | 'countryOfOrigin'
  | 'currentCountry'
  | 'knownLanguages'
  | 'languageRelationship'
  | 'targetLanguages'
  | 'proficiencyLevel'
  | 'learningGoals'
  | 'joiningReason'
  | 'discoverySource'
  | 'preferredLearningFrequency'

export interface Question {
  readonly id: QuestionId
  /** Specification group this question belongs to (1–3). */
  readonly step: 1 | 2 | 3
  readonly title: string
  readonly subtitle?: string
  /** Shown under the controls — used for privacy and availability notes. */
  readonly footnote?: string
}

export interface QuestionProps {
  readonly profile: UserOnboardingProfile
  readonly error: string | undefined
  readonly update: <K extends keyof UserOnboardingProfile>(
    key: K,
    value: UserOnboardingProfile[K],
  ) => void
  readonly toggleInArray: (
    key: 'knownLanguages' | 'targetLanguages' | 'learningGoals',
    id: string,
  ) => void
}

export const QUESTIONS: readonly Question[] = [
  /* ------------------------------------------------------ group 1 — background */
  {
    id: 'countryOfOrigin',
    step: 1,
    title: 'Where are you from?',
    subtitle: 'Your country of origin.',
    footnote:
      'We ask for country only — never a city, street or precise location. You can skip this question.',
  },
  {
    id: 'currentCountry',
    step: 1,
    title: 'Where do you live now?',
    subtitle: 'Your country of residence.',
  },
  {
    id: 'knownLanguages',
    step: 1,
    title: 'Which languages do you already speak or understand?',
    subtitle: 'Select every one that applies.',
  },
  {
    id: 'languageRelationship',
    step: 1,
    title: 'What is your relationship with African languages?',
    subtitle: 'This helps us understand who WAZOBIA serves.',
  },

  /* ------------------------------------------------- group 2 — language journey */
  {
    id: 'targetLanguages',
    step: 2,
    title: 'Which African languages do you want to learn?',
    subtitle: 'Choose up to eight.',
  },
  {
    id: 'proficiencyLevel',
    step: 2,
    title: 'How would you describe your current level?',
    subtitle: 'In the languages you want to learn.',
  },
  {
    id: 'learningGoals',
    step: 2,
    title: 'What do you want to achieve?',
    subtitle: 'Select everything that matters to you.',
  },

  /* ------------------------------------------------------ group 3 — motivation */
  {
    id: 'joiningReason',
    step: 3,
    title: 'Why did you join WAZOBIA?',
    subtitle: 'Your main reason.',
  },
  {
    id: 'discoverySource',
    step: 3,
    title: 'How did you hear about WAZOBIA?',
  },
  {
    id: 'preferredLearningFrequency',
    step: 3,
    title: 'How often would you like to learn?',
    subtitle: 'Used to pace suggestions — never to grade you.',
  },
]

export const TOTAL_QUESTIONS = QUESTIONS.length

export const STEP_NAMES = {
  1: 'Background',
  2: 'Language journey',
  3: 'Motivation',
} as const

/**
 * Safe random access into the registry.
 *
 * Indexed access is typed `Question | undefined` because the array length is not
 * a compile-time invariant, so navigation goes through this accessor instead of
 * a `!` assertion. The index is always clamped by the wizard; the throw exists
 * only to make a genuine programming error loud rather than silent.
 */
export function questionAt(index: number): Question {
  const question = QUESTIONS[index]
  if (!question) {
    throw new Error(`Onboarding question index out of range: ${index}`)
  }
  return question
}

export function findQuestionIndex(id: QuestionId): number {
  return QUESTIONS.findIndex((question) => question.id === id)
}
