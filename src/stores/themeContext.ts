import { createContext } from 'react'

/**
 * Theme context object only.
 *
 * Split from the provider for the same reason as `sessionContext.ts`: the file
 * that exports the provider component must not also export a hook, or React
 * Fast Refresh cannot hot-update it (enforced by `react/only-export-components`).
 */

/** The three options exposed in Profile → Settings → Appearance. */
export type ThemePreference = 'light' | 'dark' | 'system'

/** What is actually painted right now, once `system` has been resolved. */
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeValue {
  /** What the user selected, including `system`. */
  readonly preference: ThemePreference
  /** What that resolves to on this device, right now. */
  readonly resolved: ResolvedTheme
  readonly setPreference: (next: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeValue | null>(null)
