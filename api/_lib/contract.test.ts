// @vitest-environment node
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { ERROR_MESSAGE, ERROR_STATUS, errorEnvelope, successEnvelope } from './envelope.js'
import {
  API_ERROR_MESSAGES as CLIENT_ERROR_MESSAGE,
  type ApiErrorCode as ClientErrorCode,
} from '../../src/services/contracts/envelope.js'

/**
 * Guards that the server's copy of the contract has not drifted from the
 * client's.
 *
 * `api/` duplicates the envelope types from `src/services/contracts/` on
 * purpose — the two are separate compilation units and the browser bundle must
 * never import server code. The cost of that decision is duplication, and the
 * cost of unnoticed duplication is a client that silently renders the wrong
 * message for an error code the server started sending.
 *
 * These tests pay that cost down. A new error code must be added in both places
 * or the build fails.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const API_ENVELOPE = readFileSync(join(HERE, 'envelope.ts'), 'utf8')
const CLIENT_ENVELOPE = readFileSync(
  resolve(HERE, '../../src/services/contracts/envelope.ts'),
  'utf8',
)

/** Pull the string literal members out of a `type X = 'a' | 'b'` declaration. */
function errorCodesIn(source: string, typeName: string): string[] {
  const declaration = new RegExp(`export type ${typeName}\\s*=([\\s\\S]*?)(?:\\n\\n|\\nexport)`).exec(
    source,
  )
  if (!declaration?.[1]) throw new Error(`Could not find type ${typeName}`)
  return [...declaration[1].matchAll(/'([A-Z_]+)'/g)].map((match) => match[1] as string).toSorted()
}

describe('API contract parity with the client', () => {
  it('defines exactly the same set of error codes', () => {
    const server = errorCodesIn(API_ENVELOPE, 'ApiErrorCode')
    const client = errorCodesIn(CLIENT_ENVELOPE, 'ApiErrorCode')
    expect(server).toEqual(client)
  })

  it('uses the same user-facing copy for every error code', () => {
    // Same code, different message on each side, means the client renders its
    // own fallback instead of the server's reviewed copy. They must agree.
    //
    // Only the server's codes are compared: the client also carries
    // client-side-only conditions (NOT_CONFIGURED, NETWORK_ERROR, ABORTED and
    // friends) that never travel over the wire, so the client map is a superset
    // by design. Asserting equality of the two maps would be asserting the wrong
    // thing.
    const codes = Object.keys(ERROR_MESSAGE) as ClientErrorCode[]
    const mismatches: string[] = []
    for (const code of codes) {
      if (ERROR_MESSAGE[code] !== CLIENT_ERROR_MESSAGE[code]) {
        mismatches.push(
          `${code}: server "${ERROR_MESSAGE[code]}" vs client "${CLIENT_ERROR_MESSAGE[code]}"`,
        )
      }
    }
    expect(mismatches).toEqual([])

    // Guard against the reverse mistake: a client-only code must not have been
    // added to the server's closed set, which would put a code on the wire that
    // the contract table does not document.
    const clientOnly = Object.keys(CLIENT_ERROR_MESSAGE).filter(
      (code) => !Object.hasOwn(ERROR_MESSAGE, code),
    )
    expect(clientOnly.toSorted()).toEqual(['ABORTED', 'NETWORK_ERROR', 'NOT_CONFIGURED', 'UNEXPECTED_RESPONSE'])
  })

  it('maps every error code to the HTTP status the contract documents', () => {
    // Contract §1 documents the status per code. These are the pairings the
    // client's `STATUS_TO_CODE` table reverses, so a mismatch silently changes
    // which error a user sees.
    expect(ERROR_STATUS).toEqual({
      VALIDATION_ERROR: 400,
      UNAUTHENTICATED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      PAYLOAD_TOO_LARGE: 413,
      SEMANTIC_ERROR: 422,
      RATE_LIMITED: 429,
      PROVIDER_UNAVAILABLE: 503,
      INTERNAL_ERROR: 500,
    })
  })
})

describe('envelope construction', () => {
  it('builds a success envelope the client can recognise', () => {
    const envelope = successEnvelope({ languages: [] }, 'req_abc')
    expect(envelope).toEqual({
      success: true,
      data: { languages: [] },
      request_id: 'req_abc',
    })
  })

  it('builds an error envelope with the code, message and id', () => {
    const envelope = errorEnvelope('NOT_FOUND', 'req_abc')
    expect(envelope).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'We could not find what you were looking for.',
        request_id: 'req_abc',
      },
    })
  })

  it('omits details entirely when there are none', () => {
    // `exactOptionalPropertyTypes` is on, so `details: undefined` and "no
    // details key" are different things. The wire format should have no key.
    const envelope = errorEnvelope('VALIDATION_ERROR', 'req_abc')
    expect(Object.hasOwn(envelope.error, 'details')).toBe(false)
  })

  it('carries field details when validation failed on a specific field', () => {
    const envelope = errorEnvelope('VALIDATION_ERROR', 'req_abc', {
      details: { field: 'language' },
    })
    expect(envelope.error.details).toEqual({ field: 'language' })
  })
})

describe('migration and handler agree on the launch catalogue', () => {
  const MIGRATION = readFileSync(
    resolve(HERE, '../../supabase/migrations/0001_core_schema.sql'),
    'utf8',
  )

  it('seeds the four launch languages with full orthography', () => {
    // The seed is the only place `Yorùbá` is spelled. If the migration loses a
    // tone mark, this fails here rather than in a user's browser.
    expect(MIGRATION).toContain("('yo', 'Yorùbá',  'Yoruba',  'target'")
    expect(MIGRATION).toContain("('ha', 'Hausa',   'Hausa',   'target'")
    expect(MIGRATION).toContain("('ig', 'Igbo',    'Igbo',    'target'")
    expect(MIGRATION).toContain("('en', 'English', 'English', 'bridge'")
  })

  it('aborts the migration if the orthography is lost', () => {
    // Defence in depth: the SQL itself raises if native_name is not exact.
    expect(MIGRATION).toMatch(/raise exception/i)
    expect(MIGRATION).toContain("native_name = 'Yorùbá'")
  })

  it('enables row level security on every table it creates', () => {
    const created = [...MIGRATION.matchAll(/create table if not exists public\.(\w+)/g)].map(
      (match) => match[1] as string,
    )
    expect(created.length).toBeGreaterThan(0)

    const enabled = new Set(
      [...MIGRATION.matchAll(/alter table public\.(\w+)\s+enable row level security/g)].map(
        (match) => match[1] as string,
      ),
    )
    const unprotected = created.filter((table) => !enabled.has(table))
    expect(unprotected, `Tables without RLS:\n${unprotected.join('\n')}`).toEqual([])
  })

  it('grants no write access to user_roles', () => {
    // Role grants decide authorisation. If a client could write this table, it
    // could grant itself `admin`.
    const grants = [...MIGRATION.matchAll(/grant[^;]*on public\.user_roles[^;]*;/g)].map(
      (match) => match[0],
    )
    expect(grants.length).toBeGreaterThan(0)
    for (const grant of grants) {
      expect(grant.toLowerCase()).not.toContain('insert')
      expect(grant.toLowerCase()).not.toContain('update')
      expect(grant.toLowerCase()).not.toContain('delete')
    }
  })

  it('never grants a client write on reference content', () => {
    const reference = [
      'languages',
      'dialects',
      'courses',
      'lessons',
      'lesson_sentences',
      'dictionary_entries',
    ]
    for (const table of reference) {
      const grants = [
        ...MIGRATION.matchAll(new RegExp(`grant[^;]*on public\\.${table}[^;]*;`, 'g')),
      ].map((match) => match[0].toLowerCase())
      for (const grant of grants) {
        expect(grant, `${table} must not be client-writable`).not.toContain('insert')
        expect(grant, `${table} must not be client-writable`).not.toContain('update')
        expect(grant, `${table} must not be client-writable`).not.toContain('delete')
      }
    }
  })
})

describe('privilege hardening cannot silently regress', () => {
  /*
   * These tests exist because of a real defect found by probing the live database.
   *
   * Migration 0001 enabled RLS on every table and granted SELECT to `anon` and
   * `authenticated`. Reading that SQL, it was correct. But Supabase ships
   *
   *     alter default privileges in schema public
   *       grant all on tables to anon, authenticated, service_role;
   *
   * so every table 0001 created already carried INSERT/UPDATE/DELETE for both
   * client roles. The `grant select` statements were additive and removed
   * nothing. `has_table_privilege('anon','public.user_roles','insert')` returned
   * true on the live database.
   *
   * No amount of reading migration 0001 as text would have caught that, because
   * the defect was in an inherited default. What a test CAN do is assert that
   * the corrective statements are present — so deleting them fails the suite
   * rather than quietly reopening the hole.
   */

  const HARDENING = readFileSync(
    resolve(HERE, '../../supabase/migrations/0002_security_hardening.sql'),
    'utf8',
  )

  /** Tables a browser may read but must never write. */
  const REFERENCE_TABLES = [
    'languages',
    'dialects',
    'courses',
    'lessons',
    'lesson_sentences',
    'dictionary_entries',
    'languages_public',
    'user_roles',
    'profiles',
  ]

  it('revokes inherited write privileges from both client roles', () => {
    for (const table of REFERENCE_TABLES) {
      expect(
        HARDENING,
        `0002 must revoke inherited privileges on ${table} before re-granting`,
      ).toMatch(
        new RegExp(`revoke all on public\\.${table}\\s+from anon, authenticated`, 'i'),
      )
    }
  })

  it('re-grants only SELECT on reference content', () => {
    for (const table of REFERENCE_TABLES) {
      const grants = [
        ...HARDENING.matchAll(new RegExp(`grant ([^;]*?) on public\\.${table}[^;]*;`, 'gi')),
      ].map((match) => (match[1] ?? '').toLowerCase())
      for (const grant of grants) {
        expect(grant, `${table} may only be re-granted SELECT`).not.toContain('insert')
        expect(grant, `${table} may only be re-granted SELECT`).not.toContain('delete')
        expect(grant, `${table} may only be re-granted SELECT`).not.toContain('truncate')
      }
    }
  })

  it('closes the schema default so future tables are not born writable', () => {
    // Without this, the next migration's `create table` reintroduces the bug on
    // the day it is written and every review would have to catch it again.
    expect(HARDENING).toMatch(
      /alter default privileges in schema public revoke all on tables from anon, authenticated/i,
    )
  })

  it('keeps user_roles out of reach of anon entirely', () => {
    // `anon` has no business reading the authorisation table at all.
    expect(HARDENING).toMatch(/revoke all on public\.user_roles from anon, authenticated/i)
    const anonGrants = [
      ...HARDENING.matchAll(/grant ([^;]*?) on public\.user_roles to ([^;]*);/gi),
    ]
    for (const match of anonGrants) {
      expect((match[2] ?? '').toLowerCase()).not.toContain('anon')
    }
  })

  it('asserts the outcome inside the migration itself', () => {
    // A migration that fixes a privilege bug should fail if it did not fix it,
    // rather than leaving the database half-secured and reporting success.
    expect(HARDENING).toMatch(/raise exception 'Privilege hardening failed/i)
    expect(HARDENING).toContain('information_schema.role_table_grants')
  })

  it('does not leave a SECURITY DEFINER function executable by PUBLIC', () => {
    // EXECUTE is granted to PUBLIC on new functions by default. A SECURITY
    // DEFINER trigger function that anyone can call runs with owner privileges.
    expect(HARDENING).toMatch(
      /revoke all on function public\.handle_new_user\(\) from public/i,
    )
  })
})
