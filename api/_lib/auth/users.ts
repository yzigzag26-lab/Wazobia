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
  /**
   * Public handle, `null` when never chosen.
   *
   * Not coerced to `''`: "no username" and "username is empty" are different
   * states, and the profile page renders them differently.
   */
  readonly username: string | null
  readonly preferred_language: string
  /** The verified address from the token, not a copy in `profiles`. */
  readonly email: string | null
  readonly roles: readonly string[]
  readonly created_at: string
}

/** Fields a caller may change on their own profile. */
export interface ProfileUpdate {
  readonly display_name?: string | undefined
  readonly username?: string | null | undefined
  readonly preferred_language?: string | null | undefined
}

export interface ProfileRepositoryConfig {
  readonly supabaseUrl: string
  readonly anonKey: string
}

export interface UserLookup {
  /** `GET /api/v1/users/me` payload. `null` when the profile row is missing. */
  getProfile(
    callerId: string,
    authorization: string | null,
    email?: string | null,
  ): Promise<Profile | null>
  /** Roles for the caller. Empty array when none — never a 403-in-disguise. */
  getRoles(callerId: string, authorization: string | null): Promise<readonly string[]>
  /**
   * Write the editable fields and return the refreshed profile.
   *
   * Uses the caller's own token, so `profiles_update_own` decides the row. This
   * cannot write another user's profile even if given their id, because the
   * policy requires `auth.uid() = id` and the id in the URL is the caller's.
   */
  updateProfile(
    callerId: string,
    authorization: string | null,
    update: ProfileUpdate,
    email?: string | null,
  ): Promise<Profile | null>
}

/** Thrown when the database rejects a write for a reason the caller caused. */
export class ProfileWriteError extends Error {
  constructor(
    readonly kind: 'CONFLICT' | 'INVALID',
    message: string,
  ) {
    super(message)
    this.name = 'ProfileWriteError'
  }
}

interface ProfileRow {
  readonly id: string
  readonly display_name: string | null
  readonly username: string | null
  readonly preferred_language: string | null
  readonly created_at: string
}

const PROFILE_COLUMNS = 'id,display_name,username,preferred_language,created_at'

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
    email: string | null = null,
  ): Promise<Profile | null> {
    const url =
      `${base}/rest/v1/profiles` +
      `?select=${PROFILE_COLUMNS}` +
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
      username: row.username,
      preferred_language: row.preferred_language ?? '',
      // Taken from the verified token, which is the authority for the address.
      // `profiles` deliberately has no email column to fall out of sync with it.
      email,
      roles,
      created_at: row.created_at,
    }
  }

  async function updateProfile(
    callerId: string,
    authorization: string | null,
    update: ProfileUpdate,
    email: string | null = null,
  ): Promise<Profile | null> {
    // Build the body from an allowlist. Spreading the caller's object would let
    // a future field reach the database without a decision being made about it.
    const body: Record<string, unknown> = {}
    if (update.display_name !== undefined) body['display_name'] = update.display_name
    if (update.username !== undefined) body['username'] = update.username
    if (update.preferred_language !== undefined) {
      body['preferred_language'] = update.preferred_language
    }

    if (Object.keys(body).length === 0) {
      // Nothing to write. Re-read rather than issuing an empty PATCH, which
      // PostgREST treats as a no-op with a 200 that would look like success.
      return getProfile(callerId, authorization, email)
    }

    const url = `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}`

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...headers(authorization),
        'content-type': 'application/json',
        // Return the row so the caller gets one round trip, and so a request
        // that matched no row (RLS, or a missing profile) is detectable: the
        // array comes back empty.
        prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    })

    if (response.status === 409) {
      // The unique index on `lower(username)` is the only conflict this table
      // has, and the caller needs to know it is the handle they chose.
      throw new ProfileWriteError('CONFLICT', 'That username is already taken.')
    }
    if (response.status === 400) {
      // A CHECK violation. The endpoint validates first, so reaching this means
      // a rule exists in the database that the API does not enforce; surfacing
      // it is better than a generic 500.
      throw new ProfileWriteError('INVALID', 'That change was rejected as invalid.')
    }
    if (!response.ok) {
      throw new Error(`profiles write failed with ${response.status}`)
    }

    const rows = (await response.json()) as ProfileRow[]
    const row = rows[0]
    // No row returned means the UPDATE matched nothing: RLS hid it or the
    // profile does not exist. Never report success for a write that did nothing.
    if (row === undefined) return null

    const roles = await getRoles(callerId, authorization)
    return {
      id: row.id,
      display_name: row.display_name ?? '',
      username: row.username,
      preferred_language: row.preferred_language ?? '',
      email,
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

  return { getProfile, getRoles, updateProfile }
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
    updateProfile: async () => null,
  }
}
