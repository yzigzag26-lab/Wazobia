import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, isSupabaseConfigured } from '@/config/env'

/**
 * Browser Supabase client — authentication and authorised client-side reads only.
 *
 * Blueprint §10.6/§12: the browser uses the public anon key and the user's own
 * session. Row Level Security is the second boundary; the service-role key must
 * never appear here. Privileged operations belong in server-side functions.
 *
 * Returns `null` when the project is not configured, so callers render an
 * explicit "not connected" state instead of throwing at import time.
 */
let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey } = env
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null
  if (client) return client

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Session storage stays in the client's default (localStorage) only
      // because Supabase access tokens are short-lived and rotated. No provider
      // or service-role credential is ever stored in the browser.
      storageKey: 'wazobia.auth',
    },
  })

  return client
}
