import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onboardingService } from './onboarding'
import { createEmptyOnboardingProfile, profilesEqual } from '@/types/onboarding'

const sample = {
  ...createEmptyOnboardingProfile(),
  countryOfOrigin: 'NG',
  currentCountry: 'GB',
  knownLanguages: ['yo', 'en'],
  languageRelationship: 'heritage_speaker' as const,
  targetLanguages: ['ig'],
  proficiencyLevel: 'beginner' as const,
  learningGoals: ['conversation', 'culture_heritage'] as const,
  joiningReason: 'preserve_heritage' as const,
  discoverySource: 'friend_family' as const,
  preferredLearningFrequency: 'few_times_week' as const,
} as ReturnType<typeof createEmptyOnboardingProfile> & Record<string, unknown>

describe('onboarding service (local only)', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('reports that remote persistence is disabled', () => {
    expect(onboardingService.isRemoteEnabled).toBe(false)
  })

  it('round-trips a draft through local storage', () => {
    expect(onboardingService.readDraft()).toBeNull()
    expect(onboardingService.saveDraft(sample as never)).toBe(true)
    expect(onboardingService.readDraft()).toMatchObject({ countryOfOrigin: 'NG', targetLanguages: ['ig'] })
  })

  it('ignores corrupted drafts instead of throwing', () => {
    window.localStorage.setItem('wazobia.onboarding-draft.v1', '{broken')
    expect(onboardingService.readDraft()).toBeNull()

    window.localStorage.setItem('wazobia.onboarding-draft.v1', JSON.stringify({ nothing: true }))
    expect(onboardingService.readDraft()).toBeNull()
  })

  it('clears the draft', () => {
    onboardingService.saveDraft(sample as never)
    onboardingService.clearDraft()
    expect(onboardingService.readDraft()).toBeNull()
  })

  it('never claims answers were sent to a server', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await onboardingService.submit(sample as never)

    expect(result.persistedRemotely).toBe(false)
    expect(result.requestId).toBeNull()
    expect(result.storedLocally).toBe(true)
    // The critical guarantee: no network call is attempted at all.
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('still completes when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const result = await onboardingService.submit(sample as never)
    expect(result.storedLocally).toBe(false)
    expect(result.persistedRemotely).toBe(false)
  })
})

describe('profilesEqual', () => {
  it('compares scalar and array fields', () => {
    const a = createEmptyOnboardingProfile()
    const b = createEmptyOnboardingProfile()
    expect(profilesEqual(a, b)).toBe(true)

    expect(profilesEqual(a, { ...b, joiningReason: 'learn_language' })).toBe(false)
    expect(profilesEqual({ ...a, knownLanguages: ['yo'] }, b)).toBe(false)
    expect(profilesEqual({ ...a, knownLanguages: ['yo'] }, { ...b, knownLanguages: ['yo'] })).toBe(true)
    expect(profilesEqual({ ...a, knownLanguages: ['yo'] }, { ...b, knownLanguages: ['ha'] })).toBe(false)
  })
})
