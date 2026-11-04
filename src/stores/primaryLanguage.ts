import { isLanguageCode, type LanguageCode } from '@/config/languages'
import type { UserOnboardingProfile } from '@/types/onboarding'

/**
 * Picks the learner's primary language.
 *
 * Order: explicit choice → first supported language they want to learn → first
 * supported language they already speak. English is a bridge language and is
 * never selected here; a learner whose only language is English gets the
 * Coming Soon state, which is the honest answer.
 *
 * Returns `null` when nothing supported is found.
 */
export function resolvePrimaryLanguage(
  onboarding: UserOnboardingProfile | null,
  explicit: LanguageCode | null | undefined,
): LanguageCode | null {
  if (explicit) return explicit
  if (!onboarding) return null

  const wanted = onboarding.targetLanguages.find((id) => isLanguageCode(id) && id !== 'en')
  if (wanted && isLanguageCode(wanted)) return wanted

  const spoken = onboarding.knownLanguages.find((id) => isLanguageCode(id) && id !== 'en')
  if (spoken && isLanguageCode(spoken)) return spoken

  return null
}

