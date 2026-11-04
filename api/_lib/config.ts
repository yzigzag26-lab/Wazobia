/**
 * Server-side configuration, read once per cold start.
 *
 * Everything here is a non-`VITE_` environment variable: Vercel only exposes
 * those to functions, and Vite never inlines them into the browser bundle. That
 * distinction is the difference between a secret and a public value, so it is
 * enforced by naming rather than by convention.
 *
 * Missing configuration is reported as `null` rather than as an exception at
 * import time. A function that throws during module evaluation returns an
 * opaque platform 500 with no request id — impossible to support. Every caller
 * here turns `null` into a specific, honest error response.
 */

export interface ServerConfig {
  readonly supabaseUrl: string | null
  readonly supabaseAnonKey: string | null
  /**
   * The project's JWT secret, used to verify access tokens locally.
   * Without it, protected endpoints cannot identify anyone and must refuse.
   */
  readonly supabaseJwtSecret: string | null
}

function read(name: string): string | null {
  const value = process.env[name]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export function readServerConfig(): ServerConfig {
  return {
    supabaseUrl: read('SUPABASE_URL'),
    supabaseAnonKey: read('SUPABASE_ANON_KEY'),
    supabaseJwtSecret: read('SUPABASE_JWT_SECRET'),
  }
}

/** True when tokens can be verified at all. */
export function canAuthenticate(config: ServerConfig): boolean {
  return config.supabaseJwtSecret !== null
}

/**
 * The issuer claim Supabase puts in access tokens:
 * `https://<project-ref>.supabase.co/auth/v1`.
 *
 * Derived from the project URL so there is one place to configure the project,
 * not two that can disagree.
 */
export function issuerFor(config: ServerConfig): string | undefined {
  if (config.supabaseUrl === null) return undefined
  return `${config.supabaseUrl.replace(/\/$/, '')}/auth/v1`
}
