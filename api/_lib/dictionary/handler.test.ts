// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createDictionarySearchHandler } from './handler.js'
import {
  createInMemoryDictionaryRepository,
  createRestDictionaryRepository,
  toDictionaryEntryRow,
  parseTotal,
  type DictionaryEntryRow,
} from './repository.js'
import type { HttpRequest } from '../http.js'

/**
 * Tests for `GET /api/v1/dictionary/search` (contract §2.3).
 *
 * The single most important assertion here is the orthography one: `Yorùbá`
 * and `Ilé` must come back with their tone marks byte-identical to what went
 * in. A normalisation anywhere in the read path would still pass every other
 * test in the repository.
 */

const entry = (
  id: string,
  headword: string,
  language: string,
  gloss: string,
): DictionaryEntryRow => ({
  id,
  headword,
  language,
  part_of_speech: 'noun',
  review_status: 'approved',
  gloss,
})

const SAMPLE: readonly DictionaryEntryRow[] = [
  entry('1', 'Ilé', 'yo', 'house'),
  entry('2', 'Ìlú', 'yo', 'town'),
  entry('3', 'gida', 'ha', 'house'),
  entry('5', 'lafiya', 'ha', 'health'),
  entry('4', 'ụlọ', 'ig', 'house'),
]

function request(query: Record<string, string>, method = 'GET'): HttpRequest {
  return {
    method,
    params: {},
    query,
    body: undefined,
    authorization: null,
    requestIdHeader: null,
  }
}

function handler(rows: readonly DictionaryEntryRow[] = SAMPLE) {
  return createDictionarySearchHandler(createInMemoryDictionaryRepository(rows))
}

describe('dictionary search handler', () => {
  it('returns the contract envelope with a request id', async () => {
    const response = await handler()(request({ q: 'house' }))
    expect(response.status).toBe(200)
    const body = response.body as Record<string, unknown>
    expect(body['success']).toBe(true)
    expect(typeof body['request_id']).toBe('string')
    expect((body['request_id'] as string).length).toBeGreaterThanOrEqual(8)
  })

  it('returns pagination fields the client contract expects', async () => {
    const response = await handler()(request({ q: 'l' }))
    const data = (response.body as Record<string, unknown>)['data'] as Record<string, unknown>
    expect(data['page']).toBe(1)
    expect(data['page_size']).toBe(20)
    expect(data['total']).toBe(4)
    expect(Array.isArray(data['results'])).toBe(true)
  })

  it('is explicitly cacheable', async () => {
    const response = await handler()(request({ q: 'house' }))
    expect(response.headers['cache-control']).toBe('public, max-age=3600')
  })

  it('preserves full orthography in results, byte for byte', async () => {
    const response = await handler()(request({ q: 'il' }))
    const data = (response.body as Record<string, unknown>)['data'] as {
      results: DictionaryEntryRow[]
    }
    const headwords = data.results.map((r) => r.headword)
    expect(headwords).toContain('Ilé')
    expect(headwords).toContain('Ìlú')

    // Byte-level, not merely "contains". Composed and decomposed forms of `é`
    // look identical but are different strings.
    const ile = data.results.find((r) => r.headword === 'Ilé')
    expect(ile?.headword).toBe('Il\u00e9')
    expect([...(ile?.headword ?? '')].map((c) => c.codePointAt(0))).toEqual([73, 108, 233])
  })

  it('filters by language when one is given', async () => {
    const response = await handler()(request({ q: 'o', language: 'ig' }))
    const data = (response.body as Record<string, unknown>)['data'] as {
      results: DictionaryEntryRow[]
    }
    expect(data.results.every((r) => r.language === 'ig')).toBe(true)
  })

  it('searches all languages when language is omitted', async () => {
    // Folding makes the accented forms reachable: `Ilé`, `Ìlú` and `ụlọ` all
    // fold to something containing 'l'.
    const response = await handler()(request({ q: 'l' }))
    const data = (response.body as Record<string, unknown>)['data'] as {
      results: DictionaryEntryRow[]
    }
    const codes = new Set(data.results.map((r) => r.language))
    expect(codes.size).toBeGreaterThan(1)
  })

  it('returns 200 with an empty list when nothing matches', async () => {
    const response = await handler()(request({ q: 'zzzznotaword' }))
    expect(response.status).toBe(200)
    const data = (response.body as Record<string, unknown>)['data'] as {
      results: DictionaryEntryRow[]
    }
    expect(data.results).toEqual([])
  })

  it('rejects a missing or blank q with VALIDATION_ERROR', async () => {
    for (const query of [{}, { q: '' }, { q: '   ' }]) {
      const response = await handler()(request(query))
      expect(response.status).toBe(400)
      const body = response.body as Record<string, unknown>
      expect(body['success']).toBe(false)
      expect((body['error'] as Record<string, unknown>)['code']).toBe('VALIDATION_ERROR')
    }
  })

  it('rejects an unknown language code', async () => {
    const response = await handler()(request({ q: 'house', language: 'fr' }))
    expect(response.status).toBe(400)
    const body = response.body as Record<string, unknown>
    const error = body['error'] as Record<string, unknown>
    expect((error['details'] as Record<string, unknown>)['field']).toBe('language')
  })

  it('rejects a non-positive page', async () => {
    for (const page of ['0', '-5', 'abc']) {
      const response = await handler()(request({ q: 'house', page }))
      expect(response.status).toBe(400)
      expect((response.body as Record<string, unknown>)['success']).toBe(false)
    }
  })

  it('clamps a page_size above the maximum instead of rejecting it', async () => {
    const response = await handler()(request({ q: 'l', page_size: '9999' }))
    expect(response.status).toBe(200)
    const data = (response.body as Record<string, unknown>)['data'] as { page_size: number }
    expect(data.page_size).toBe(100)
  })

  it('answers a non-GET method with 405 and an Allow header', async () => {
    const response = await handler()(request({ q: 'house' }, 'POST'))
    expect(response.status).toBe(405)
    expect(response.headers['allow']).toBe('GET, HEAD')
  })

  it('never caches a 500', async () => {
    const failing = {
      async search() {
        throw new Error('boom')
      },
    }
    const response = await createDictionarySearchHandler(failing)(request({ q: 'house' }))
    expect(response.status).toBe(500)
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('does not leak the provider error message', async () => {
    const failing = {
      async search() {
        throw new Error('relation "dictionary_entries" does not exist at 10.0.0.4')
      },
    }
    const response = await createDictionarySearchHandler(failing)(request({ q: 'house' }))
    expect(JSON.stringify(response.body)).not.toContain('dictionary_entries')
    expect(JSON.stringify(response.body)).not.toContain('10.0.0.4')
  })
})

describe('toDictionaryEntryRow', () => {
  const base = { id: 'a', headword: 'Ilé', language_code: 'yo', review_status: 'approved' }

  it('drops a row with no usable headword', () => {
    expect(toDictionaryEntryRow({ ...base, headword: '' })).toBeNull()
    expect(toDictionaryEntryRow({ ...base, headword: '   ' })).toBeNull()
  })

  it('drops a row with no language code', () => {
    expect(toDictionaryEntryRow({ ...base, language_code: undefined })).toBeNull()
  })

  it('drops a row with no id', () => {
    expect(toDictionaryEntryRow({ ...base, id: undefined })).toBeNull()
  })

  it('drops a row with an unknown review status', () => {
    expect(toDictionaryEntryRow({ ...base, review_status: 'maybe' })).toBeNull()
  })

  it('renames language_code to language on the wire', () => {
    const row = toDictionaryEntryRow(base)
    expect(row?.language).toBe('yo')
    expect(row).not.toHaveProperty('language_code')
  })

  it('keeps a null part of speech rather than inventing one', () => {
    const row = toDictionaryEntryRow({
      ...base,
      headword: 'mmilī',
      language_code: 'ig',
      part_of_speech: null,
      gloss: 'water; rain',
    })
    expect(row?.part_of_speech).toBeNull()
    expect(row?.gloss).toBe('water; rain')
  })
})

describe('pagination', () => {
  it('slices the in-memory results by page', async () => {
    const first = await handler()(request({ q: 'l', page: '1', page_size: '2' }))
    const second = await handler()(request({ q: 'l', page: '2', page_size: '2' }))
    const a = (first.body as Record<string, unknown>)['data'] as { results: DictionaryEntryRow[]; total: number }
    const b = (second.body as Record<string, unknown>)['data'] as { results: DictionaryEntryRow[] }
    expect(a.results).toHaveLength(2)
    expect(b.results).toHaveLength(2)
    // Total is the full match count, not the page length.
    expect(a.total).toBe(4)
    // Pages do not overlap.
    const idsB = new Set(b.results.map((r) => r.id))
    expect(a.results.some((r) => idsB.has(r.id))).toBe(false)
  })
})

describe('parseTotal', () => {
  it('reads the total out of Content-Range', () => {
    expect(parseTotal('0-19/143', 20)).toBe(143)
  })

  it('falls back to the page length when the header is missing', () => {
    expect(parseTotal(null, 7)).toBe(7)
  })

  it('falls back when the total is unknown', () => {
    expect(parseTotal('0-19/*', 20)).toBe(20)
  })
})

describe('createRestDictionaryRepository', () => {
  it('asks PostgREST only for approved rows', async () => {
    const seen: string[] = []
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      seen.push(String(url))
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as unknown as typeof fetch

    const repository = createRestDictionaryRepository({
      supabaseUrl: 'https://example.supabase.co/',
      anonKey: 'anon',
      fetchImpl,
    })
    await repository.search('house', null, 10, 0)

    const url = seen[0] ?? ''
    expect(url).toContain('review_status=eq.approved')
    expect(url).toContain('dictionary_entries')
    // The trailing slash on the base URL must not produce a double slash.
    expect(url).not.toContain('.co//')
  })

  it('never turns punctuation-only input into a match-all query', async () => {
    const response = await handler()(request({ q: '***' }))
    expect(response.status).toBe(200)
    const data = (response.body as Record<string, unknown>)['data'] as { total: number }
    expect(data.total).toBe(0)
  })

  it('strips PostgREST wildcards from user input', async () => {
    const seen: string[] = []
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      seen.push(String(url))
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as unknown as typeof fetch

    const repository = createRestDictionaryRepository({
      supabaseUrl: 'https://example.supabase.co',
      anonKey: 'anon',
      fetchImpl,
    })
    await repository.search('*', null, 10, 0)

    // The handler folds first; here the raw wildcard reaches the repository,
    // which strips it, finds nothing left, and returns empty without a query.
    expect(seen).toHaveLength(0)
  })

  it('throws on a non-ok response so the handler can 500', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 503 })) as unknown as typeof fetch
    const repository = createRestDictionaryRepository({
      supabaseUrl: 'https://example.supabase.co',
      anonKey: 'anon',
      fetchImpl,
    })
    await expect(repository.search('house', null, 10, 0)).rejects.toThrow(/503/)
  })
})
