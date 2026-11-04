import { env } from '@/config/env'
import { apiRequest, WazobiaApiError } from './client'
import type { UserOnboardingProfile } from '@/types/onboarding'

/**
 * Onboarding service — the isolated seam for future backend integration.
 *
 * Today this is **local only**: answers are written to `localStorage` so the
 * questionnaire survives a refresh and can be reviewed before submission. They
 * are never transmitted anywhere, and the UI is not permitted to describe them
 * as saved to an account.
 *
 * When `POST /api/v1/onboarding` exists:
 *   1. flip `ONBOARDING_REMOTE_ENABLED` (or gate on `env.apiOrigin`),
 *   2. `submit()` posts the profile and returns the server's response,
 *   3. local draft storage becomes a pre-submission cache.
 * No component changes are needed — screens call this service, not storage.
 */

const DRAFT_KEY = 'wazobia.onboarding-draft.v1'

/** Set to true only when the endpoint is deployed and verified. */
const ONBOARDING_REMOTE_ENABLED = false

export interface OnboardingSubmitResult {
  /** Whether answers reached the backend. Always false in this build. */
  readonly persistedRemotely: boolean
  /** Whether a local draft was written. */
  readonly storedLocally: boolean
  readonly requestId: string | null
}

function isProfile(value: unknown): value is UserOnboardingProfile {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<UserOnboardingProfile>
  return (
    Array.isArray(candidate.knownLanguages) &&
    Array.isArray(candidate.targetLanguages) &&
    Array.isArray(candidate.learningGoals) &&
    'languageRelationship' in candidate &&
    'proficiencyLevel' in candidate
  )
}

export const onboardingService = {
  /** Whether a real backend will receive the answers. */
  get isRemoteEnabled(): boolean {
    return ONBOARDING_REMOTE_ENABLED
  },

  /** Reads a locally stored draft, or null. Never throws. */
  readDraft(): UserOnboardingProfile | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      return isProfile(parsed) ? parsed : null
    } catch {
      return null
    }
  },

  /** Writes the in-progress draft locally so a refresh does not lose answers. */
  saveDraft(profile: UserOnboardingProfile): boolean {
    if (typeof window === 'undefined') return false
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(profile))
      return true
    } catch {
      return false
    }
  },

  clearDraft(): void {
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* no-op */
    }
  },

  /**
   * Submits the completed questionnaire.
   *
   * In this build it stores the draft locally and returns honestly: nothing was
   * sent, and nothing is attached to an account. It never fabricates a server
   * acknowledgement.
   */
  async submit(profile: UserOnboardingProfile): Promise<OnboardingSubmitResult> {
    const storedLocally = this.saveDraft(profile)

    if (!ONBOARDING_REMOTE_ENABLED) {
      return { persistedRemotely: false, storedLocally, requestId: null }
    }

    /**
     * Integration point. The contract below is documented in
     * docs/api/api-contract.md; it is not implemented server-side yet.
     */
    try {
      const response = await apiRequest<{ request_id: string }>('/onboarding', {
        method: 'POST',
        body: profile,
      })
      return { persistedRemotely: true, storedLocally, requestId: response.request_id }
    } catch (error) {
      if (error instanceof WazobiaApiError) throw error
      throw new WazobiaApiError({
        code: 'INTERNAL_ERROR',
        status: 0,
        cause: error,
      })
    }
  },

  /** Development-only hint that the API origin is missing. */
  get apiOriginConfigured(): boolean {
    return Boolean(env.apiOrigin)
  },
} as const
