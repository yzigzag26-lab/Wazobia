/**
 * Minimal class-name joiner.
 *
 * Deliberately not `clsx`/`tailwind-merge`: the primitives in this codebase
 * accept a `className` that is appended last, and no component relies on
 * conflicting-utility overriding. Adding 8KB of dependency for that would be
 * unnecessary.
 */
export type ClassValue = string | false | null | undefined

export function cn(...values: readonly ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
