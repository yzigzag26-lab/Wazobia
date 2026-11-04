import { useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query.
 *
 * Uses `useSyncExternalStore` so the value is correct on first render and stays
 * in sync with the browser, without the mount flicker a `useEffect` version
 * would cause. SSR-safe: falls back to `false` when `window` is unavailable.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void): (() => void) => {
    if (typeof window === 'undefined') return () => {}
    const mediaQueryList = window.matchMedia(query)
    mediaQueryList.addEventListener('change', onChange)
    return () => mediaQueryList.removeEventListener('change', onChange)
  }

  const getSnapshot = (): boolean => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  }

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Blueprint §5.1: side navigation on laptop/desktop, bottom navigation on phone. */
export const DESKTOP_QUERY = '(min-width: 64rem)'
