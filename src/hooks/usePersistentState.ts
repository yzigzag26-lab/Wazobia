import { useCallback, useState } from 'react'

/**
 * State mirrored into `localStorage`, used for UI preferences such as the
 * collapsed sidebar.
 *
 * Values here are presentation-only. Nothing sensitive (tokens, profile data,
 * recordings) may be stored with this hook — see blueprint §12 session rules.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): readonly [T, (value: T) => void] {
  const storageKey = `wazobia.${key}`

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored === null) return initialValue
      const parsed: unknown = JSON.parse(stored)
      return isValid(parsed) ? parsed : initialValue
    } catch {
      return initialValue
    }
  })

  const set = useCallback(
    (next: T) => {
      setValue(next)
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        /* Storage may be unavailable (private mode, quota). Preference is
           non-critical, so failure is silent by design. */
      }
    },
    [storageKey],
  )

  return [value, set] as const
}

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
