import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePersistentState } from '@/hooks/usePersistentState'
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemePreference,
  type ThemeValue,
} from './themeContext'

/**
 * Theme provider.
 *
 * Applies the theme by setting `data-theme` on `<html>`, which switches the
 * palette custom properties in `src/index.css`. It does not toggle `dark:`
 * variants anywhere, so no component needs to know a theme exists.
 *
 * `system` is honoured live: the media query is subscribed, not read once, so a
 * device switching to night mode at sunset updates the app without a reload.
 *
 * An inline script in `index.html` applies the stored theme before first paint.
 * Without it there is a flash of light theme on every load; this provider keeps
 * the DOM in sync afterwards.
 */

const STORAGE_KEY = 'wazobia.theme'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

/** Reads the OS preference. Returns `light` when the API is unavailable (SSR, old browsers). */
function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [preference, setPreference] = usePersistentState<ThemePreference>(
    'theme',
    'system',
    isThemePreference,
  )

  /** Tracks the OS setting only while `system` is selected. */
  const [systemIsDark, setSystemIsDark] = useState<boolean>(systemPrefersDark)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemIsDark(event.matches)

    // The initial value comes from `systemPrefersDark()` in the state
    // initialiser, so this effect only has to track *changes*. It deliberately
    // holds no reference to `systemIsDark`, which is why it has no dependencies
    // and cannot cascade a render on mount.
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  const resolved: ResolvedTheme =
    preference === 'system' ? (systemIsDark ? 'dark' : 'light') : preference

  /** Writes the attribute React does not own. `<html>` is outside the React tree. */
  useEffect(() => {
    const root = document.documentElement
    root.dataset['theme'] = resolved
    root.style.colorScheme = resolved
  }, [resolved])

  const setPreferenceSafe = useCallback(
    (next: ThemePreference) => {
      setPreference(next)
      try {
        // Same key the pre-paint script in index.html reads.
        window.localStorage.setItem(`wazobia.theme`, JSON.stringify(next))
      } catch {
        /* Storage may be blocked; the in-memory theme still applies. */
      }
    },
    [setPreference],
  )

  const value = useMemo<ThemeValue>(
    () => ({ preference, resolved, setPreference: setPreferenceSafe }),
    [preference, resolved, setPreferenceSafe],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}

/** Exported for the pre-paint script's parity test. */
export const THEME_STORAGE_KEY = STORAGE_KEY
