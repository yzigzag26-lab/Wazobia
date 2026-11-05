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
   * Legacy shared HMAC secret, used only to verify HS256 tokens.
   *
   * `null` is normal and correct for a project on ES256 signing, which has no
   * shared secret at all. Treating its absence as "cannot authenticate" was the
   * bug that made every protected call return 401 on an ES256 project.
   */
  readonly supabaseJwtSecret: string | null
}

function readOne(name: string): string | null {
  const value = process.env[name]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

/**
 * Read the first configured name from a list of aliases.
 *
 * The same two public values reach a deployment under different names depending
 * on who set them up: this project's own convention is `SUPABASE_*`, a Next.js
 * habit is `NEXT_PUBLIC_*`, and some dashboards use `PUBLIC_*`. They are the
 * same value, and refusing to read an alias produces a deployment that looks
 * configured and is not — which is exactly the failure this module exists to
 * make impossible.
 */
function read(...names: string[]): string | null {
  for (const name of names) {
    const value = readOne(name)
    if (value !== null) return value
  }
  return null
}

/**
 * Recover the project URL from an anon key.
 *
 * A Supabase anon key is a JWT carrying a `ref` claim — the project reference —
 * and the project URL is `https://<ref>.supabase.co`. Deriving it means a
 * deployment that configured only the key still works, instead of silently
 * losing token verification and database access.
 *
 * Returns `null` for the newer `sb_publishable_…` keys, which are opaque
 * strings and carry no reference.
 */
export function projectUrlFromAnonKey(anonKey: string): string | null {
  const parts = anonKey.split('.')
  if (parts.length !== 3) return null

  const encodedPayload = parts[1]
  if (typeof encodedPayload !== 'string') return null

  // Decode locally rather than importing `auth/verify.js`: `config.ts` is
  // imported by nearly every endpoint, and keeping it dependency-free avoids a
  // cycle where `verify.ts` is reachable before configuration is read.
  const normalised = encodedPayload.replaceAll('-', '+').replaceAll('_', '/')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalised)) return null
  const padded = normalised.padEnd(normalised.length + ((4 - (normalised.length % 4)) % 4), '=')

  try {
    const parsed: unknown = JSON.parse(globalThis.atob(padded))
    if (typeof parsed !== 'object' || parsed === null) return null
    const ref = (parsed as { ref?: unknown }).ref
    if (typeof ref !== 'string' || !/^[a-z0-9]{20}$/.test(ref)) return null
    return `https://${ref}.supabase.co`
  } catch {
    return null
  }
}

/**
 * Which environment variable supplied each value.
 *
 * Names, never values: this is what turns "it is configured" into "it is
 * configured as X", which is the fact needed when a deployment reads nothing.
 */
export interface ConfigSources {
  readonly projectUrl: string | null
  readonly anonKey: string | null
  readonly jwtSecret: string | null
}

const URL_NAMES = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_URL'] as const
const KEY_NAMES = [
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'PUBLIC_SUPABASE_ANON_KEY',
] as const

function sourceOf(names: readonly string[]): string | null {
  for (const name of names) {
    if (readOne(name) !== null) return name
  }
  return null
}

export function readConfigSources(): ConfigSources {
  return {
    projectUrl: sourceOf(URL_NAMES),
    anonKey: sourceOf(KEY_NAMES),
    jwtSecret: sourceOf(['SUPABASE_JWT_SECRET']),
  }
}

export function readServerConfig(): ServerConfig {
  const anonKey = read(...KEY_NAMES)

  // Explicit configuration wins; the key's own `ref` claim is the fallback.
  const supabaseUrl = read(...URL_NAMES) ?? (anonKey === null ? null : projectUrlFromAnonKey(anonKey))

  return {
    supabaseUrl,
    supabaseAnonKey: anonKey,
    supabaseJwtSecret: read('SUPABASE_JWT_SECRET'),
  }
}

/**
 * The project's JWKS document, which publishes the public half of the ES256
 * signing key.
 *
 * Derived from the project URL for the same reason as the issuer below: one
 * source of configuration instead of two that can disagree.
 */
export function jwksUrlFor(config: ServerConfig): string | undefined {
  if (config.supabaseUrl === null) return undefined
  return `${config.supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`
}

/**
 * True when tokens can be verified at all.
 *
 * Either scheme is sufficient: an HMAC secret covers HS256, a project URL
 * covers ES256 (via JWKS). Requiring the secret specifically is what excluded
 * every ES256 deployment.
 */
export function canAuthenticate(config: ServerConfig): boolean {
  return config.supabaseJwtSecret !== null || config.supabaseUrl !== null
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
