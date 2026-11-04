import { describe, expect, it } from 'vitest'
import {
  DESTINATIONS,
  PRIMARY_MOBILE_DESTINATIONS,
  SECONDARY_MOBILE_DESTINATIONS,
  findDestinationByPath,
} from './destinationRegistry'

describe('destination registry', () => {
  it('contains exactly the eight approved destinations', () => {
    expect(DESTINATIONS).toHaveLength(8)
    expect(DESTINATIONS.map((destination) => destination.id)).toEqual([
      'ai',
      'translate',
      'learn',
      'speak',
      'dictionary',
      'community',
      'preserve',
      'research',
    ])
  })

  it('names every destination with the WAZOBIA prefix', () => {
    for (const destination of DESTINATIONS) {
      expect(destination.name.startsWith('WAZOBIA ')).toBe(true)
    }
  })

  it('keeps the phone bottom bar to four destinations and puts AI first', () => {
    expect(PRIMARY_MOBILE_DESTINATIONS).toHaveLength(4)
    expect(PRIMARY_MOBILE_DESTINATIONS[0]?.id).toBe('ai')
  })

  it('mounts every destination under the /app namespace', () => {
    for (const destination of DESTINATIONS) {
      expect(destination.href.startsWith('/app/')).toBe(true)
    }
  })

  it('routes every destination through a More surface without losing any', () => {
    const reachable = [...PRIMARY_MOBILE_DESTINATIONS, ...SECONDARY_MOBILE_DESTINATIONS]
    expect(reachable).toHaveLength(8)
    expect(new Set(reachable.map((destination) => destination.id)).size).toBe(8)
  })

  it('resolves nested paths to their destination', () => {
    expect(findDestinationByPath('/app/learn/lesson-1')?.id).toBe('learn')
    expect(findDestinationByPath('/app/dictionary')?.id).toBe('dictionary')
    expect(findDestinationByPath('/app/unknown')).toBeUndefined()
  })

  it('never marks a destination available before it is connected', () => {
    // Foundation phase: no destination has a working backend yet.
    expect(DESTINATIONS.every((destination) => destination.status !== 'available')).toBe(true)
  })
})
