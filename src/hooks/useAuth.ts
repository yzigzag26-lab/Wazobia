import { use } from 'react'
import { AuthContext, type AuthValue } from '@/stores/authContext'

/** Access the auth context. Throws rather than returning null, so call sites do
 *  not each need a null branch that would silently render a signed-out UI. */
export function useAuth(): AuthValue {
  const context = use(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
