import { use } from 'react'
import { ProfileContext, type ProfileValue } from '@/stores/profileContext'

/**
 * Reads the device-local profile.
 *
 * This is the only supported way for a feature to learn the learner's primary
 * African language. Features must not re-derive it from the raw onboarding
 * draft, and must not fall back to English — an unsupported language is a
 * Coming Soon state, not an English one.
 */
export function useProfile(): ProfileValue {
  const context = use(ProfileContext)
  if (!context) throw new Error('useProfile must be used inside <ProfileProvider>')
  return context
}
