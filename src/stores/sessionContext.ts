import { createContext } from 'react'
import type { GuestCapability, GuestSession } from '@/services/guestSession'

/** Context object only — see languagePreferenceContext.ts for the rationale. */
export type SessionStatus = 'anonymous' | 'guest'

export interface SessionValue {
  readonly status: SessionStatus
  readonly session: GuestSession | null
  readonly isGuest: boolean
  readonly startGuestSession: () => void
  readonly endSession: () => void
  readonly can: (capability: GuestCapability) => boolean
}

export const SessionContext = createContext<SessionValue | null>(null)
