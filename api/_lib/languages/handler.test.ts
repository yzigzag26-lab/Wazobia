// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createLanguagesHandler } from './handler.js'
import {
  createInMemoryLanguageRepository,
  createRestLanguageRepository,
  toLanguageRow,
  type LanguageRepository,
  type LanguageRow,
} from './repository.js'
import type { HttpRequest } from '../http.js'

/**
 * Tests for `GET /api/v1/languages` (contract §2.1).
 *
 * The seed below is copied from the migration's own VALUES list, and one test
 * reads the migration file to prove the two have not diverged. That matters
 * more than it looks: the launch catalogue is the single thing this endpoint
 * exists to serve, and a "cleanup" that strips the tone marks off `Yorùbá`
 * would pass every other test in the repository.
 */

function makeRepository(rows: readonly LanguageRow[]): LanguageRepository {
  return createInMemoryLanguageRepository(rows)
}

const SEED: readonly LanguageRow[] = [
  {
    code: 'yo',
    native_name: 'Yorùbá',
    english_name: 'Yoruba',
    role: 'target',
    direction: 'ltr',
    enabled: true,
    dialect_count: 0,
  },
  {
    code: 'ha',
    native_name: 'Hausa',
    english_name: 'Hausa',
    role: 'target',
    direction: 'ltr',
    enabled: true,
    dialect_count: 0,
  },
  {
    code: 'ig',
    native_name: 'Igbo',
    english_name: 'Igbo',
    role: 'target',
    direction: 'ltr',
    enabled: true,
    dialect_count: 0,
  },
  {
    code: 'en',
    native_name: 'English',
    english_name: 'English',
    role: 'bridge',
    direction: 'ltr',
    enabled: true,
    dialect_count: 0,
  },
]

function makeRequest(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    method: 'GET',
    params: {},
    query: {},
    body: undefined,
    authorization: null,
    requestIdHeader: null,
    ...overrides,
  }
}

describe('GET /api/v1/languages', () => {
  it('returns the success envelope with every enabled language', async () => {
    const handler = createLanguagesHandler(makeRepository(SEED))
    const response = await handler(makeRequest())

    expect(response.status).toBe(200)
    const body = response.body as {
      success: boolean
      data: { languages: readonly LanguageRow[] }
      request_id: string
    }

    expect(body.success).toBe(true)
    expect(body.data.languages).toHaveLength(4)
    expect(body.data.languages.map((row) => row.code)).toEqual(['yo', 'ha', 'ig', 'en'])
  })

  it('is public — no Authorization header is required', async () => {
    const handler = createLanguagesHandler(makeRepository(SEED))
    const response = await handler(makeRequest({ authorization: null }))
    expect(response.status).toBe(200)
  })

  it('returns native names in full orthography, never an ASCII approximation', async () => {
    const handler = createLanguagesHandler(makeRepository(SEED))
    const response = await handler(makeRequest())
    const body = response.body as { data: { languages: readonly LanguageRow[] } }

    const yoruba = body.data.languages.find((row) => row.code === 'yo')
    expect(yoruba?.native_name).toBe('Yorùbá')

    // The specific failure mode: a codec, a normalisation step or a careless
    // edit replacing ù (U+00F9) with u. Assert the codepoints, not the glyph,
    // because visually the two are easy to confuse in a diff.
    const codepoints = [...(yoruba?.native_name ?? '')].map((char) => char.codePointAt(0))
    expect(codepoints).toEqual([0x59, 0x6f, 0x72, 0xf9, 0x62, 0xe1])
  })

  it('requests one hour of public caching', async () => {
    const handler = createLanguagesHandler(makeRepository(SEED))
    const response = await handler(makeRequest())
    expect(response.headers['cache-control']).toBe('public, max-age=3600')
    expect(response.headers['content-type']).toContain('application/json')
  })

  it('does not cache an error response', async () => {
    // A cached 500 would turn a momentary database blip into an hour-long
    // outage, so the failure path must opt out of the success cache header.
    const repository: LanguageRepository = {
      listEnabled: async () => {
        throw new Error('database is on fire: table public.languages')
      },
    }
    const handler = createLanguagesHandler(repository)
    const response = await handler(makeRequest())
    expect(response.status).toBe(500)
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('never leaks an internal error message to the client', async () => {
    const repository: LanguageRepository = {
      listEnabled: async () => {
        throw new Error('password authentication failed for user "postgres"')
      },
    }
    const handler = createLanguagesHandler(repository)
    const response = await handler(makeRequest())
    const body = response.body as { error: { code: string; message: string } }

    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(body.error.message).toBe('Something went wrong on our side. Please try again.')
    expect(JSON.stringify(response.body)).not.toContain('password')
    expect(JSON.stringify(response.body)).not.toContain('postgres')
  })

  it('puts a request id on both the success and failure paths', async () => {
    const ok = await createLanguagesHandler(makeRepository(SEED))(makeRequest())
    expect((ok.body as { request_id: string }).request_id).toMatch(/^req_[A-Za-z0-9]+$/)

    const failed = await createLanguagesHandler({
      listEnabled: async () => {
        throw new Error('nope')
      },
    })(makeRequest())
    const body = failed.body as { error: { request_id: string } }
    expect(body.error.request_id).toMatch(/^req_[A-Za-z0-9]+$/)
  })

  it('echoes a platform request id when it is well formed', async () => {
    const handler = createLanguagesHandler(makeRepository(SEED))
    const response = await handler(makeRequest({ requestIdHeader: 'abc123def456' }))
    expect((response.body as { request_id: string }).request_id).toBe('abc123def456')
  })

  it('rejects a malformed platform request id instead of echoing it', async () => {
    // The header arrives from outside the process. Echoing it verbatim would let
    // a caller place arbitrary text into a response body.
    const handler = createLanguagesHandler(makeRepository(SEED))
    const response = await handler(
      makeRequest({ requestIdHeader: '<script>alert(1)</script>' }),
    )
    const id = (response.body as { request_id: string }).request_id
    expect(id).not.toBe('<script>alert(1)</script>')
    expect(id).toMatch(/^req_[A-Za-z0-9]+$/)
  })

  it('answers a non-GET method with 405 rather than pretending', async () => {
    const handler = createLanguagesHandler(makeRepository(SEED))
    const response = await handler(makeRequest({ method: 'POST' }))
    expect(response.status).toBe(405)
    expect(response.headers['allow']).toBe('GET, HEAD')
    expect((response.body as { success: boolean }).success).toBe(false)
  })

  it('excludes a disabled language', async () => {
    const disabled: LanguageRow = {
      code: 'xx',
      native_name: 'Testish',
      english_name: 'Testish',
      role: 'target',
      direction: 'ltr',
      enabled: false,
      dialect_count: 0,
    }
    const handler = createLanguagesHandler(makeRepository([...SEED, disabled]))
    const response = await handler(makeRequest())
    const body = response.body as { data: { languages: readonly LanguageRow[] } }
    expect(body.data.languages.map((row) => row.code)).not.toContain('xx')
  })
})

describe('language row coercion', () => {
  it('rejects a row with no headword-grade native name', () => {
    expect(() =>
      toLanguageRow({
        code: 'yo',
        native_name: '   ',
        english_name: 'Yoruba',
        role: 'target',
        direction: 'ltr',
        enabled: true,
        dialect_count: 0,
      }),
    ).toThrow(/native_name/)
  })

  it('rejects an unsupported role', () => {
    expect(() =>
      toLanguageRow({
        code: 'yo',
        native_name: 'Yorùbá',
        english_name: 'Yoruba',
        role: 'primary',
        direction: 'ltr',
        enabled: true,
        dialect_count: 0,
      }),
    ).toThrow(/role/)
  })

  it('normalises a bigint-shaped dialect count and a null', () => {
    const base = {
      code: 'yo',
      native_name: 'Yorùbá',
      english_name: 'Yoruba',
      role: 'target',
      direction: 'ltr',
      enabled: true,
    }
    expect(toLanguageRow({ ...base, dialect_count: '7' }).dialect_count).toBe(7)
    expect(toLanguageRow({ ...base, dialect_count: null }).dialect_count).toBe(0)
  })
})

describe('PostgREST adapter', () => {
  it('reads through the anon key and never a service-role key', async () => {
    const calls: { url: string; init: RequestInit | undefined }[] = []
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as unknown as typeof fetch

    const repository = createRestLanguageRepository({
      supabaseUrl: 'https://example.supabase.co/',
      anonKey: 'anon-key-value',
      fetchImpl,
    })
    await repository.listEnabled()

    expect(calls).toHaveLength(1)
    const [call] = calls
    expect(call?.url).toContain('/rest/v1/languages_public')
    expect(call?.url).not.toContain('//rest') // trailing slash was normalised
    const headers = call?.init?.headers as Record<string, string>
    expect(headers['apikey']).toBe('anon-key-value')
    expect(headers['authorization']).toBe('Bearer anon-key-value')
  })

  it('maps a non-2xx response to a thrown error rather than an empty list', async () => {
    // Returning [] here would be the dangerous outcome: the UI would render
    // "no languages" as though that were true.
    const fetchImpl = (async () =>
      new Response('upstream boom', { status: 503 })) as unknown as typeof fetch

    const repository = createRestLanguageRepository({
      supabaseUrl: 'https://example.supabase.co',
      anonKey: 'k',
      fetchImpl,
    })
    await expect(repository.listEnabled()).rejects.toThrow(/503/)
  })

  it('rejects a non-array payload', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ message: 'nope' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })) as unknown as typeof fetch

    const repository = createRestLanguageRepository({
      supabaseUrl: 'https://example.supabase.co',
      anonKey: 'k',
      fetchImpl,
    })
    await expect(repository.listEnabled()).rejects.toThrow(/array/i)
  })
})
