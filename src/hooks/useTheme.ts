import { use } from 'react'
import { ThemeContext, type ThemeValue } from '@/stores/themeContext'

/**
 * Reads the active theme.
 *
 * Appearance is deliberately only changeable from Profile → Settings →
 * Appearance; this hook is for *reading* the current value (for example, to
 * choose an illustration variant), never a second set of controls.
 */
export function useTheme(): ThemeValue {
  const context = use(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}
