import type { ReactNode } from 'react'

/**
 * The five approved WAZOBIA destinations.
 *
 * Restructured from the original eight-module layout. Tiers matter:
 *
 *   primary   — WAZOBIA Learn. The product's centre of gravity; it owns the four
 *               learning experiences (Lessons, Quizzes, Proverbs, Stories).
 *   utility   — Dictionary, AI, Translate. Tools that support learning.
 *   account   — Profile. Identity, preferences and appearance.
 *
 * Preserve and Speak are no longer destinations: proverbs moved into Learn, and
 * Read Aloud (the former Speak capability) is a feature of lesson reading.
 * Community is now an external WhatsApp group offered once after onboarding.
 * Research & AI Data is discontinued and has no record here at all.
 */

export type DestinationId = 'learn' | 'dictionary' | 'ai' | 'translate' | 'profile'

export type DestinationTier = 'primary' | 'utility' | 'account'

export type DestinationStatus =
  /** Interface exists and is backed by real, reviewed content in the client. */
  | 'available'
  /** Interface exists; some or all of its data needs a backend contract. */
  | 'awaiting-backend'
  /** Not built yet in the current phase. */
  | 'planned'

export interface Destination {
  readonly id: DestinationId
  /** Full product name — always prefixed, per the blueprint. */
  readonly name: string
  /** Short label for constrained spaces (phone bar, collapsed sidebar). */
  readonly shortName: string
  readonly href: string
  /** One-line description used in navigation help text and page headers. */
  readonly summary: string
  readonly status: DestinationStatus
  readonly tier: DestinationTier
  readonly icon: ReactNode
  /** Whether this destination earns a slot in the phone bottom bar. */
  readonly primaryMobile: boolean
}
