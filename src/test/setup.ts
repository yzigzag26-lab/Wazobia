import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/**
 * Shared test setup.
 *
 * Most of this file assumes a DOM, but `api/**` tests run in the `node`
 * environment because they exercise server code — there is no `window` there.
 * Every DOM-touching step is therefore guarded on `window` existing, so the same
 * setup file is safe for both environments instead of needing a second config.
 */

const hasDom = typeof window !== 'undefined'

afterEach(() => {
  if (!hasDom) return
  cleanup()
  window.localStorage.clear()
})

/**
 * jsdom does not implement `matchMedia`. The application shell reads it to
 * decide between side navigation and bottom navigation, so tests provide a
 * controllable stub instead of letting the component crash.
 */
export function mockMatchMedia(matches: boolean): void {
  if (!hasDom) return
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

mockMatchMedia(true)
