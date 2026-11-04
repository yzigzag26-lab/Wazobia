import type { ReactNode } from 'react'

/**
 * The eight approved WAZOBIA destinations (blueprint §4).
 *
 * This model is the single source of truth for navigation on every device:
 * the desktop sidebar, the mobile bottom bar and the mobile "More" sheet all
 * derive from it. Adding or renaming a destination is one edit here.
 */

export type DestinationId =
  | 'ai'
  | 'translate'
  | 'learn'
  | 'speak'
  | 'dictionary'
  | 'community'
  | 'preserve'
  | 'research'

export type DestinationStatus =
  /** Interface exists and is connected to a working backend contract. */
  | 'available'
  /** Interface exists; the backend contract is not implemented yet. */
  | 'awaiting-backend'
  /** Not built yet in the current phase. */
  | 'planned'

export interface Destination {
  readonly id: DestinationId
  /** Full product name — always prefixed, per the blueprint. */
  readonly name: string
  /** Short label for constrained spaces (mobile bar). */
  readonly shortName: string
  readonly href: string
  /** One-line description used in navigation help text and page headers. */
  readonly summary: string
  readonly status: DestinationStatus
  readonly icon: ReactNode
  /**
   * Whether this destination earns a slot in the phone bottom bar.
   * Blueprint §5.1: prioritise the most-used destinations and keep AI one tap
   * away — but never cram all eight into the bar.
   */
  readonly primaryMobile: boolean
}
