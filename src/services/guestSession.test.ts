import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GUEST_DENIED_CAPABILITIES, GUEST_STORAGE_KEY, guestSessionService } from './guestSession'

describe('guest session service', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with no session', () => {
    expect(guestSessionService.read()).toBeNull()
    expect(guestSessionService.isActive()).toBe(false)
  })

  it('creates a guest session and persists it', () => {
    const session = guestSessionService.start()

    expect(session.kind).toBe('guest')
    expect(session.isGuest).toBe(true)
    expect(session.id).toBeTruthy()

    const stored = window.localStorage.getItem(GUEST_STORAGE_KEY)
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!)).toMatchObject({ kind: 'guest', isGuest: true })
  })

  it('survives a reload (reads back from storage)', () => {
    const created = guestSessionService.start()
    const restored = guestSessionService.read()
    expect(restored?.id).toBe(created.id)
  })

  it('grants only public capabilities', () => {
    const session = guestSessionService.start()
    expect(session.capabilities).toEqual(['browse-public', 'use-public-tools'])

    // Guards the boundary the brief requires: a guest must never hold these.
    for (const denied of GUEST_DENIED_CAPABILITIES) {
      expect(session.capabilities).not.toContain(denied)
    }
  })

  it('ends the session and clears storage', () => {
    guestSessionService.start()
    guestSessionService.end()
    expect(guestSessionService.read()).toBeNull()
    expect(window.localStorage.getItem(GUEST_STORAGE_KEY)).toBeNull()
  })

  it('ignores corrupted stored data instead of throwing', () => {
    window.localStorage.setItem(GUEST_STORAGE_KEY, '{not json')
    expect(guestSessionService.read()).toBeNull()

    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ kind: 'admin' }))
    expect(guestSessionService.read()).toBeNull()
  })

  it('rejects a tampered session that claims extra capabilities', () => {
    window.localStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({ kind: 'guest', isGuest: true, id: 'x', createdAt: 'y', capabilities: 'all' }),
    )
    expect(guestSessionService.read()).toBeNull()
  })

  it('still returns a usable session when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const session = guestSessionService.start()
    expect(session.isGuest).toBe(true)
  })
})
