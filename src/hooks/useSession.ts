import { use } from 'react'
import { SessionContext, type SessionValue } from '@/stores/sessionContext'

export function useSession(): SessionValue {
  const context = use(SessionContext)
  if (!context) throw new Error('useSession must be used inside <SessionProvider>')
  return context
}
