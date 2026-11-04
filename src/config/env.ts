/**
 * Runtime configuration.
 *
 * Blueprint §12 and §13.2: only *public* configuration may reach the browser.
 * Privileged credentials (Groq, Gemini, Supabase service-role, TTS/ASR provider
 * keys) must never be referenced here, must never be prefixed with `VITE_`, and
 * must never be included in a client bundle.
 *
 * The application must remain coherent when configuration is absent: a missing
 * backend is reported as `unconfigured`, never simulated.
 */

function readOptionalPublicEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

export const env = {
  /** Absolute origin of the application API. Empty in production: the app
   *  calls its own `/api/v1/*` origin relatively. Set only for local dev. */
  apiOrigin: readOptionalPublicEnv(import.meta.env.VITE_API_ORIGIN),
  apiVersion: 'v1',
  supabaseUrl: readOptionalPublicEnv(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: readOptionalPublicEnv(import.meta.env.VITE_SUPABASE_ANON_KEY),
  isProduction: import.meta.env.PROD,
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
} as const

/**
 * Whether the browser has been given enough configuration to talk to Supabase.
 * Used to render an explicit "not connected" state rather than failing at the
 * first request with a network error.
 */
export const isSupabaseConfigured: boolean = Boolean(env.supabaseUrl && env.supabaseAnonKey)

/**
 * Guard against a service-role key being pasted into the public anon slot.
 * Supabase service keys are JWTs whose payload carries `"role":"service_role"`.
 * Shipping one to the browser would be a critical security defect, so we fail
 * loudly in development rather than degrade silently.
 */
function assertNoServiceRoleKeyInBrowser(key: string | undefined): void {
  if (!key || env.isProduction) return

  const payload = key.split('.')[1]
  if (!payload) return

  try {
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      role?: unknown
    }
    if (decoded.role === 'service_role') {
      // eslint-disable-next-line no-console
      console.error(
        '[wazobia] SECURITY: a Supabase service_role key was supplied as VITE_SUPABASE_ANON_KEY. ' +
          'Server-side keys must never be exposed to the browser. Requests will be blocked.',
      )
    }
  } catch {
    /* Not a decodable JWT payload — nothing to assert. */
  }
}

assertNoServiceRoleKeyInBrowser(env.supabaseAnonKey)
