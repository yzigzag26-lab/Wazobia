import { describe, expect, it } from 'vitest'
import {
  DESTINATIONS,
  PRIMARY_MOBILE_DESTINATIONS,
  SECONDARY_MOBILE_DESTINATIONS,
  findDestinationById,
  findDestinationByPath,
} from './destinationRegistry'

/**
 * Navigation is a product contract, so it is asserted rather than assumed.
 *
 * The ordering below is the brief: Learn, Dictionary, AI, Translate, Profile.
 * A future change that reorders them, re-adds Speak/Community, or brings back
 * Research should fail here rather than ship.
 */
describe('destination registry', () => {
  it('contains exactly the five approved destinations, in order', () => {
    expect(DESTINATIONS).toHaveLength(5)
    expect(DESTINATIONS.map((destination) => destination.id)).toEqual([
      'learn',
      'dictionary',
      'ai',
      'translate',
      'profile',
    ])
  })

  it('places Learn first and Profile last', () => {
    expect(DESTINATIONS[0]?.id).toBe('learn')
    expect(DESTINATIONS[DESTINATIONS.length - 1]?.id).toBe('profile')
  })

  it('no longer offers Speak, Community, Preserve or Research', () => {
    const ids = DESTINATIONS.map((destination) => destination.id as string)
    for (const removed of ['speak', 'community', 'preserve', 'research']) {
      expect(ids).not.toContain(removed)
    }
  })

  it('names the four product destinations with the WAZOBIA prefix, and Profile plainly', () => {
    // The brief names the fifth item exactly "Profile" — it is the learner's own
    // account surface, not a product module, and prefixing it would read as
    // "WAZOBIA Profile", which nobody says.
    for (const destination of DESTINATIONS) {
      if (destination.id === 'profile') {
        expect(destination.name).toBe('Profile')
      } else {
        expect(destination.name.startsWith('WAZOBIA ')).toBe(true)
      }
    }
  })

  it('gives every destination a short name for tight spaces', () => {
    for (const destination of DESTINATIONS) {
      expect(destination.shortName.length).toBeGreaterThan(0)
      expect(destination.shortName.length).toBeLessThanOrEqual(destination.name.length)
    }
  })

  it('shows every destination on the phone bar, AI included', () => {
    // Five destinations fit a bottom bar at this width; nothing is hidden behind
    // a "More" sheet any more.
    expect(PRIMARY_MOBILE_DESTINATIONS).toHaveLength(5)
    expect(PRIMARY_MOBILE_DESTINATIONS.map((destination) => destination.id)).toEqual([
      'learn',
      'dictionary',
      'ai',
      'translate',
      'profile',
    ])
    expect(SECONDARY_MOBILE_DESTINATIONS).toHaveLength(0)
  })

  it('mounts every destination under the /app namespace', () => {
    for (const destination of DESTINATIONS) {
      expect(destination.href.startsWith('/app/')).toBe(true)
    }
  })

  it('resolves nested paths to their destination', () => {
    expect(findDestinationByPath('/app/learn')?.id).toBe('learn')
    expect(findDestinationByPath('/app/learn/lessons')?.id).toBe('learn')
    expect(findDestinationByPath('/app/learn/lessons/yo-beginner/yo-b-1')?.id).toBe('learn')
    expect(findDestinationByPath('/app/learn/quizzes/quiz-yo-greetings')?.id).toBe('learn')
    expect(findDestinationByPath('/app/dictionary')?.id).toBe('dictionary')
    expect(findDestinationByPath('/app/profile/settings/appearance')?.id).toBe('profile')
  })

  it('does not resolve a path that merely starts with a destination name', () => {
    // `/app/learning` must not be captured by `/app/learn`.
    expect(findDestinationByPath('/app/learning')).toBeUndefined()
    expect(findDestinationByPath('/app/unknown')).toBeUndefined()
  })

  it('looks a destination up by id', () => {
    expect(findDestinationById('profile')?.href).toBe('/app/profile')
    expect(findDestinationById('research')).toBeUndefined()
  })

  it('marks Learn available only because its content is real, and the utilities not', () => {
    // The three utilities need services that do not exist, so they must not claim
    // availability. Learn ships actual lessons, quizzes, proverbs and stories
    // from local seed data, so calling it "in development" would be the
    // inaccuracy now.
    const learn = DESTINATIONS.find((destination) => destination.id === 'learn')
    expect(learn?.status).toBe('available')

    for (const id of ['dictionary', 'ai', 'translate'] as const) {
      const destination = DESTINATIONS.find((item) => item.id === id)
      expect(destination?.status, `${id} must not claim to be available`).toBe('awaiting-backend')
    }
  })

  it('gives every destination an icon and a summary', () => {
    for (const destination of DESTINATIONS) {
      expect(destination.icon).toBeTruthy()
      expect(destination.summary.length).toBeGreaterThan(20)
    }
  })

  it('assigns each destination a tier, with exactly one primary', () => {
    const primaries = DESTINATIONS.filter((destination) => destination.tier === 'primary')
    expect(primaries).toHaveLength(1)
    expect(primaries[0]?.id).toBe('learn')
  })
})
