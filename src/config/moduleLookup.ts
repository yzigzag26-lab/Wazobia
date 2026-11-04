/**
 * Convenience lookups shared by module scaffolds.
 *
 * Kept separate from `destinationRegistry.tsx` so that non-navigation consumers
 * (module pages, tests) do not import JSX-bearing config unnecessarily.
 */
import { DESTINATIONS, STATUS_LABELS, STATUS_TONE } from './destinationRegistry'
import type { Destination } from './destinations'

export { DESTINATIONS, STATUS_LABELS, STATUS_TONE }

export function findDestinationById(id: string): Destination | undefined {
  return DESTINATIONS.find((destination) => destination.id === id)
}
