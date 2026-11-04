/**
 * Caller profile and roles, read with the caller's own token.
 *
 * Two design points:
 *
 *  1. **The caller's token, not a service key.** PostgREST evaluates
 *     `auth.uid()` from the forwarded bearer token, so `profiles_select_own`
 *     and `user_roles_select_own` do the filtering. This module has no way to
 *     read somebody else's row even if a bug asked it to.
 *
 *  2. **The service-role key is not used anywhere in `api/`.** A leaked
 *     service key bypasses every policy in the database; keeping it out of the
 *     serverless bundle means the blast radius of a deployment mistake is a
 *     single project's public data instead of the whole database.
 */

/**
 * `GET /api/v1/users/me` response shape — mirrors the client's `Profile`
 * (`src/services/contracts/endpoints.ts` §2.2).
 *
 * Declared here rather than imported: `api/` and `src/` are separate
 * compilation units with different module resolution, and reaching across that
 * boundary drags the browser's module graph into a serverless function. The
 * auth test asserts the two shapes agree, which is the same arrangement the
 * envelope types already use.
 */
export interface Profile {
  readonly id: string
  readonly display_name: string
  readonly preferred_language: string
  readonly roles: readonly string[]
  readonly created_at: string
}

export interface ProfileRepositoryConfig {
  readonly supabaseUrl: string
  readonly anonKey: string
}

export interface UserLookup {
  /** `GET /api/v1/users/me` payload. `null` when the profile row is missing. */
  getProfile(callerId: string, authorization: string | null): Promise<Profile | null>
  /** Roles for the caller. Empty array when none — never a 403-in-disguise. */
  getRoles(callerId: string, authorization: string | null): Promise<readonly string[]>
}

interface ProfileRow {
  readonly id: string
  readonly display_name: string | null
  readonly preferred_language: string | null
  readonly created_at: string
}

interface RoleRow {
  readonly role: string
}

/** PostgREST is strict about quoting; only our own values ever reach this. */
function restHeaders(anonKey: string, authorization: string | null): Record<string, string> {
  return {
    apikey: anonKey,
    // Forward the user's token so RLS applies as that user. Fall back to the
    // anon key so the request is at least well-formed; it will then match no
    // rows, which the caller reports honestly rather than inventing a profile.
    authorization: authorization ?? `Bearer ${anonKey}`,
    accept: 'application/json',
  }
}

export function createRestUserLookup(config: ProfileRepositoryConfig): UserLookup {
  const base = config.supabaseUrl.replace(/\/$/, '')
  const headers = (authorization: string | null) =>
    restHeaders(config.anonKey, authorization)

  async function getProfile(
    callerId: string,
    authorization: string | null,
  ): Promise<Profile | null> {
    const url =
      `${base}/rest/v1/profiles` +
      `?select=id,display_name,preferred_language,created_at` +
      `&id=eq.${encodeURIComponent(callerId)}&limit=1`

    const response = await fetch(url, { headers: headers(authorization) })
    if (!response.ok) {
      throw new Error(`profiles read failed with ${response.status}`)
    }

    const rows = (await response.json()) as ProfileRow[]
    const row = rows[0]
    if (row === undefined) return null

    const roles = await getRoles(callerId, authorization)

    return {
      id: row.id,
      // The column allows NULL in SQL but the contract says string. An empty
      // display name is honest; a fabricated one from the email would not be.
      display_name: row.display_name ?? '',
      preferred_language: row.preferred_language ?? '',
      roles,
      created_at: row.created_at,
    }
  }

  async function getRoles(
    callerId: string,
    authorization: string | null,
  ): Promise<readonly string[]> {
    const url =
      `${base}/rest/v1/user_roles` +
      `?select=role&user_id=eq.${encodeURIComponent(callerId)}&order=role.asc`

    const response = await fetch(url, { headers: headers(authorization) })
    if (!response.ok) {
      throw new Error(`user_roles read failed with ${response.status}`)
    }

    const rows = (await response.json()) as RoleRow[]
    return rows.map((row) => row.role).filter((role) => typeof role === 'string')
  }

  return { getProfile, getRoles }
}

/**
 * Deterministic lookup for tests and for a deployment with no database.
 *
 * It is honest about being empty: `getProfile` returns `null`, so the endpoint
 * answers `NOT_FOUND` rather than fabricating a profile for an arbitrary id.
 */
export function createEmptyUserLookup(): UserLookup {
  return {
    getProfile: async () => null,
    getRoles: async () => [],
  }
}
