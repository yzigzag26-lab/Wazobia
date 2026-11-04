import { isCountryCode, PREFER_NOT_TO_SAY } from '@/config/countries'
import { findOnboardingLanguage } from '@/config/onboarding'
import type { UserOnboardingProfile } from '@/types/onboarding'
import type { QuestionId } from './questions'

/**
 * Onboarding validation.
 *
 * The questionnaire is optional and skippable, so nothing here is a hard error
 * for the reader: an unanswered question is simply unanswered and produces no
 * message. Validation exists only to catch answers that would be meaningless
 * downstream — a language id no longer in the catalogue, a country code that
 * does not exist, or more selections than the product supports.
 */

const MAX_LANGUAGES = 8

export type OnboardingErrors = Partial<Record<keyof UserOnboardingProfile, string>>

function validateLanguageIds(ids: readonly string[]): string | undefined {
  // Cap first: nine valid choices should report the limit, not a vague "unknown".
  if (ids.length > MAX_LANGUAGES) return `Choose up to ${MAX_LANGUAGES} languages.`
  const unknown = ids.filter((id) => !findOnboardingLanguage(id))
  if (unknown.length > 0) return 'One of the selected languages is no longer available.'
  return undefined
}

function validateCountry(value: string | null): string | undefined {
  if (!value) return undefined
  if (value === PREFER_NOT_TO_SAY) return undefined
  if (!isCountryCode(value)) return 'Choose a country from the list.'
  return undefined
}

/** Validates a single question. Returns an error message, or undefined. */
export function validateQuestion(
  id: QuestionId,
  profile: UserOnboardingProfile,
): string | undefined {
  switch (id) {
    case 'countryOfOrigin':
      return validateCountry(profile.countryOfOrigin)
    case 'currentCountry':
      return validateCountry(profile.currentCountry)
    case 'knownLanguages':
      return validateLanguageIds(profile.knownLanguages)
    case 'targetLanguages':
      return validateLanguageIds(profile.targetLanguages)
    default:
      return undefined
  }
}

/** Whether the user has given any answer to this question. */
export function isQuestionAnswered(id: QuestionId, profile: UserOnboardingProfile): boolean {
  switch (id) {
    case 'countryOfOrigin':
      return Boolean(profile.countryOfOrigin)
    case 'currentCountry':
      return Boolean(profile.currentCountry)
    case 'knownLanguages':
      return profile.knownLanguages.length > 0
    case 'languageRelationship':
      return Boolean(profile.languageRelationship)
    case 'targetLanguages':
      return profile.targetLanguages.length > 0
    case 'proficiencyLevel':
      return Boolean(profile.proficiencyLevel)
    case 'learningGoals':
      return profile.learningGoals.length > 0
    case 'joiningReason':
      return Boolean(profile.joiningReason)
    case 'discoverySource':
      return Boolean(profile.discoverySource)
    case 'preferredLearningFrequency':
      return Boolean(profile.preferredLearningFrequency)
  }
}
