import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { isLanguageCode, type LanguageCode } from '@/config/languages'
import { onboardingService } from '@/services/onboarding'
import { resolvePrimaryLanguage } from './primaryLanguage'
import type { UserOnboardingProfile } from '@/types/onboarding'
import {
  EMPTY_DETAILS,
  ProfileContext,
  type ProfileDetails,
  type ProfileValue,
} from './profileContext'

/**
 * Profile provider — device-local only.
 *
 * Two jobs:
 *   1. Hold the details captured at sign-up and the onboarding answers so that
 *      Profile, Settings and the Learn hub read one source instead of three.
 *   2. Resolve the learner's primary African language, which every Learn
 *      experience keys off (proverbs, stories, lesson catalogue, quiz bank).
 *
 * Persistence is `localStorage` under `wazobia.profile.v1`. There is no account
 * service, so nothing here is synchronised, and no screen may claim it is.
 */

const DETAILS_KEY = 'wazobia.profile.v1'
const PRIMARY_KEY = 'wazobia.primary-language.v1'
const INVITE_KEY = 'wazobia.community-invite.v1'

/** Sentinel: explicit "no supported language", distinct from "not chosen yet". */
const NONE = 'none'

function readJson<T>(key: string, guard: (value: unknown) => value is T): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return guard(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* Blocked storage is survivable: the session still works in memory. */
  }
}

function isDetails(value: unknown): value is ProfileDetails {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<ProfileDetails>
  return (
    typeof candidate.fullName === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.email === 'string'
  )
}

export function ProfileProvider({ children }: { readonly children: ReactNode }) {
  const [details, setDetailsState] = useState<ProfileDetails>(
    () => readJson(DETAILS_KEY, isDetails) ?? EMPTY_DETAILS,
  )

  /** Re-read from the existing onboarding draft so nothing is asked twice. */
  const [onboarding, setOnboarding] = useState<UserOnboardingProfile | null>(() =>
    onboardingService.readDraft(),
  )

  const [explicitLanguage, setExplicitLanguage] = useState<LanguageCode | null>(() => {
    const stored = readJson<string>(PRIMARY_KEY, (v): v is string => typeof v === 'string')
    if (stored === NONE) return null
    return stored && isLanguageCode(stored) ? stored : null
  })
  const [hasExplicitChoice, setHasExplicitChoice] = useState<boolean>(() => {
    const stored = readJson<string>(PRIMARY_KEY, (v): v is string => typeof v === 'string')
    return stored !== null
  })

  const [inviteOutcome, setInviteOutcome] = useState<'pending' | 'joined' | 'skipped'>(() => {
    const stored = readJson<'pending' | 'joined' | 'skipped'>(
      INVITE_KEY,
      (v): v is 'pending' | 'joined' | 'skipped' =>
        v === 'pending' || v === 'joined' || v === 'skipped',
    )
    return stored ?? 'skipped'
  })

  const setDetails = useCallback((next: Partial<ProfileDetails>) => {
    setDetailsState((current) => {
      const merged = { ...current, ...next }
      writeJson(DETAILS_KEY, merged)
      return merged
    })
  }, [])

  const setPrimaryLanguage = useCallback((code: LanguageCode | null) => {
    setExplicitLanguage(code)
    setHasExplicitChoice(true)
    writeJson(PRIMARY_KEY, code ?? NONE)
  }, [])

  const completeOnboarding = useCallback((profile: UserOnboardingProfile) => {
    setOnboarding(profile)
    // The questionnaire reaches here only after a fresh sign-up, so this is the
    // single point at which the one-time community invitation is armed.
    setInviteOutcome('pending')
    writeJson(INVITE_KEY, 'pending')
  }, [])

  const dismissCommunityInvite = useCallback((outcome: 'joined' | 'skipped') => {
    setInviteOutcome(outcome)
    writeJson(INVITE_KEY, outcome)
  }, [])

  const resetProfile = useCallback(() => {
    setDetailsState(EMPTY_DETAILS)
    setOnboarding(null)
    setExplicitLanguage(null)
    setHasExplicitChoice(false)
    setInviteOutcome('skipped')
    try {
      window.localStorage.removeItem(DETAILS_KEY)
      window.localStorage.removeItem(PRIMARY_KEY)
      window.localStorage.removeItem(INVITE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const primaryLanguage = useMemo(
    () => resolvePrimaryLanguage(onboarding, hasExplicitChoice ? explicitLanguage : undefined),
    [onboarding, explicitLanguage, hasExplicitChoice],
  )

  const value = useMemo<ProfileValue>(
    () => ({
      details,
      onboarding,
      primaryLanguage,
      primaryLanguageIsExplicit: hasExplicitChoice,
      setDetails,
      setPrimaryLanguage,
      completeOnboarding,
      resetProfile,
      communityInvitePending: inviteOutcome === 'pending',
      dismissCommunityInvite,
    }),
    [
      details,
      onboarding,
      primaryLanguage,
      hasExplicitChoice,
      setDetails,
      setPrimaryLanguage,
      completeOnboarding,
      resetProfile,
      inviteOutcome,
      dismissCommunityInvite,
    ],
  )

  return <ProfileContext value={value}>{children}</ProfileContext>
}
