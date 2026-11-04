/**
 * Guest session service.
 *
 * Blueprint §3 / §10.6: a visitor may browse public pages. This service models
 * that as a *local* session, and it is deliberately quarantined so it can be
 * replaced by real authentication without touching any UI component.
 *
 * WHAT A GUEST SESSION IS
 *   - a client-side navigation convenience
 *   - stored in `localStorage` so it survives a reload
 *   - able to open public pages of the application
 *
 * WHAT A GUEST SESSION IS NOT
 *   - a Supabase user (nothing is created on the server)
 *   - an authenticated session (no token, no credentials, no privilege)
 *   - permission to read another user's private data
 *   - permission to perform moderation, review or admin actions
 *   - a promise that contributions or uploads are permanently saved
 *
 * Every consumer must read `isGuest` from this module's session object rather
 * than inferring identity from the presence of a name, and server-side
 * authorization remains the only real access control.
 */

export const GUEST_STORAGE_KEY = 'wazobia.guest-session.v1'

export type SessionKind = 'guest' | 'anonymous'

export interface GuestSession {
  readonly kind: 'guest'
  /** Opaque client-side identifier. Not a user id and not sent as an identity. */
  readonly id: string
  readonly createdAt: string
  /** Always true. Present so future account sessions can share the shape. */
  readonly isGuest: true
  /** Granted capabilities. Guest has navigation only. */
  readonly capabilities: readonly GuestCapability[]
}

/**
 * Capabilities a guest explicitly does **not** have are listed here as a type
 * so feature code cannot ask for them by accident.
 */
export type GuestCapability = 'browse-public' | 'use-public-tools'

/** Capabilities that guests must never be granted. */
export const GUEST_DENIED_CAPABILITIES = [
  'account-data',
  'contribution-persistence',
  'upload-persistence',
  'moderation',
  'review',
  'admin',
] as const

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // Fallback for older browsers — the value has no security meaning.
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function isGuestSession(value: unknown): value is GuestSession {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<GuestSession>
  return (
    candidate.kind === 'guest' &&
    candidate.isGuest === true &&
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    Array.isArray(candidate.capabilities)
  )
}

export const guestSessionService = {
  /** Reads the stored guest session, or `null`. Never throws. */
  read(): GuestSession | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(GUEST_STORAGE_KEY)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      return isGuestSession(parsed) ? parsed : null
    } catch {
      return null
    }
  },

  /** Creates and persists a guest session. */
  start(): GuestSession {
    const session: GuestSession = {
      kind: 'guest',
      id: createId(),
      createdAt: new Date().toISOString(),
      isGuest: true,
      capabilities: ['browse-public', 'use-public-tools'],
    }

    try {
      window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session))
    } catch {
      /* Storage may be unavailable. The session still holds for this page
         view; callers treat a null read as anonymous. */
    }

    return session
  },

  /** Ends the guest session and clears any guest-scoped local state. */
  end(): void {
    try {
      window.localStorage.removeItem(GUEST_STORAGE_KEY)
    } catch {
      /* no-op */
    }
  },

  isActive(): boolean {
    return this.read() !== null
  },
} as const
