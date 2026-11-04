import { createContext } from 'react'
import type { LanguageCode } from '@/config/languages'
import type { UserOnboardingProfile } from '@/types/onboarding'

/**
 * Profile context object only — see `themeContext.ts` for why.
 *
 * Honesty constraint (HANDOVER §5): there is no account service. Everything in
 * here lives in `localStorage` on this device. The UI must never state that a
 * change was saved to an account, and must say so plainly in Settings.
 */

/** Editable details collected at sign-up. Never transmitted anywhere. */
export interface ProfileDetails {
  /** Free text, as entered. Trimmed but otherwise unvalidated beyond length. */
  fullName: string
  /**
   * Unique public handle. Uniqueness is only checkable once an account service
   * exists, so the UI labels availability as unverified rather than claiming a
   * username is free.
   */
  username: string
  /** Validated for shape only. Unverified — WAZOBIA cannot verify an inbox. */
  email: string
}

export const EMPTY_DETAILS: ProfileDetails = { fullName: '', username: '', email: '' }

export interface ProfileValue {
  readonly details: ProfileDetails
  /** Onboarding answers, or `null` if the questionnaire has not been completed. */
  readonly onboarding: UserOnboardingProfile | null

  /**
   * The single African language the learner is studying.
   *
   * Resolution order: explicit preference, then the first supported language
   * from onboarding `targetLanguages`, then the first supported language they
   * already speak. `null` means "no supported language" and every Learn surface
   * must render a Coming Soon state rather than guessing English.
   */
  readonly primaryLanguage: LanguageCode | null
  /** True when the user chose it explicitly; false when inferred from onboarding. */
  readonly primaryLanguageIsExplicit: boolean

  readonly setDetails: (next: Partial<ProfileDetails>) => void
  readonly setPrimaryLanguage: (code: LanguageCode | null) => void
  readonly completeOnboarding: (profile: UserOnboardingProfile) => void
  readonly resetProfile: () => void

  /** One-time WhatsApp community invitation bookkeeping. See `CommunityInviteContext`. */
  readonly communityInvitePending: boolean
  readonly dismissCommunityInvite: (outcome: 'joined' | 'skipped') => void
}

export const ProfileContext = createContext<ProfileValue | null>(null)
