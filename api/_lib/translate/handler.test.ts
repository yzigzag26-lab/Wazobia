// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createTranslateHandler, parseTranslation } from './handler.js'
import { createChatHandler, pickLookupTerm } from '../ai/chat-handler.js'
import { ProviderError, selectProvider, type AiProvider } from '../ai/provider.js'
import type { HttpRequest } from '../http.js'

/**
 * Tests for `POST /api/v1/translate` (§2.4) and `POST /api/v1/ai/chat` (§2.3).
 *
 * The two assertions that matter most in this file:
 *
 *   * translate NEVER returns `review_status: 'reviewed'`. A machine draft
 *     labelled as reviewed is the worst thing this product could ship.
 *   * when no provider is configured, both endpoints return 503 and no
 *     translation. They never invent one to make a demo look good.
 */

function post(body: unknown): HttpRequest {
  return {
    method: 'POST',
    params: {},
    query: {},
    body,
    authorization: null,
    requestIdHeader: null,
  }
}

/** A provider that returns a fixed string, standing in for a real model. */
function stubProvider(text: string, name: 'groq' | 'gemini' = 'groq'): AiProvider {
  return {
    name,
    async complete() {
      return { text, provider: name }
    },
  }
}

const GOOD_TRANSLATION = JSON.stringify({
  translation: 'Ẹ káàrọ̀',
  detected_source_language: 'en',
  alternatives: [{ text: 'Ẹ káàrọ̀ o', register: 'formal', note: 'More respectful.' }],
})

describe('POST /api/v1/translate', () => {
  it('returns the contract envelope and a translation', async () => {
    const response = await createTranslateHandler(stubProvider(GOOD_TRANSLATION))(
      post({ text: 'Good morning', target_language: 'yo' }),
    )
    expect(response.status).toBe(200)
    const body = response.body as Record<string, unknown>
    expect(body['success']).toBe(true)
    const data = body['data'] as Record<string, unknown>
    expect(data['translation']).toBe('Ẹ káàrọ̀')
    expect(data['target_language']).toBe('yo')
  })

  it('always reports review_status ai_suggestion, never reviewed', async () => {
    const response = await createTranslateHandler(stubProvider(GOOD_TRANSLATION))(
      post({ text: 'Good morning', target_language: 'yo' }),
    )
    const data = (response.body as Record<string, unknown>)['data'] as Record<string, unknown>
    expect(data['review_status']).toBe('ai_suggestion')
  })

  it('preserves tone marks byte for byte in the response', async () => {
    const response = await createTranslateHandler(stubProvider(GOOD_TRANSLATION))(
      post({ text: 'Good morning', target_language: 'yo' }),
    )
    const data = (response.body as Record<string, unknown>)['data'] as { translation: string }
    // Ẹ U+1EB8, k, á U+00E1, à U+00E0, r, ọ U+1ECD + combining grave U+0300.
    // Asserted at codepoint level because two visually identical strings can
    // differ in composition, and the tone mark is the meaning.
    expect([...data.translation].map((c) => c.codePointAt(0))).toEqual([
      0x1eb8, 0x20, 0x6b, 0xe1, 0xe0, 0x72, 0x1ecd, 0x300,
    ])
  })

  it('returns 503 and no translation when no provider is configured', async () => {
    const response = await createTranslateHandler(null)(
      post({ text: 'Good morning', target_language: 'yo' }),
    )
    expect(response.status).toBe(503)
    const body = response.body as Record<string, unknown>
    expect(body['success']).toBe(false)
    expect((body['error'] as Record<string, unknown>)['code']).toBe('PROVIDER_UNAVAILABLE')
    // Critically: no `data` field at all. Nothing to mistake for an answer.
    expect(body).not.toHaveProperty('data')
  })

  it('returns 503 rather than guessing when the model returns prose', async () => {
    const response = await createTranslateHandler(
      stubProvider('I think it means good morning, roughly.'),
    )(post({ text: 'Good morning', target_language: 'yo' }))
    expect(response.status).toBe(503)
    expect((response.body as Record<string, unknown>)['success']).toBe(false)
  })

  it('returns 503 when the model returns an empty translation', async () => {
    const response = await createTranslateHandler(
      stubProvider(JSON.stringify({ translation: '', alternatives: [] })),
    )(post({ text: 'Good morning', target_language: 'yo' }))
    expect(response.status).toBe(503)
  })

  it('maps a provider rate limit to PROVIDER_UNAVAILABLE', async () => {
    const failing: AiProvider = {
      name: 'groq',
      async complete() {
        throw new ProviderError('groq', 429, 'rate limited')
      },
    }
    const response = await createTranslateHandler(failing)(
      post({ text: 'Good morning', target_language: 'yo' }),
    )
    expect(response.status).toBe(503)
  })

  it('rejects an empty text', async () => {
    const response = await createTranslateHandler(stubProvider(GOOD_TRANSLATION))(
      post({ text: '   ', target_language: 'yo' }),
    )
    expect(response.status).toBe(400)
  })

  it('rejects an unsupported target language', async () => {
    const response = await createTranslateHandler(stubProvider(GOOD_TRANSLATION))(
      post({ text: 'Good morning', target_language: 'fr' }),
    )
    expect(response.status).toBe(400)
  })

  it('rejects a GET', async () => {
    const request: HttpRequest = { ...post({}), method: 'GET' }
    const response = await createTranslateHandler(stubProvider(GOOD_TRANSLATION))(request)
    expect(response.status).toBe(405)
  })

  it('never caches a translation', async () => {
    const response = await createTranslateHandler(stubProvider(GOOD_TRANSLATION))(
      post({ text: 'Good morning', target_language: 'yo' }),
    )
    expect(response.headers['cache-control']).toBe('no-store')
  })
})

describe('parseTranslation', () => {
  it('accepts JSON wrapped in markdown fences', () => {
    const parsed = parseTranslation('```json\n{"translation":"Ẹ káàrọ̀"}\n```')
    expect(parsed?.translation).toBe('Ẹ káàrọ̀')
  })

  it('finds the object inside surrounding prose', () => {
    const parsed = parseTranslation('Sure! {"translation":"Ụlọ"} Hope that helps.')
    expect(parsed?.translation).toBe('Ụlọ')
  })

  it('rejects a response with no JSON object', () => {
    expect(parseTranslation('Ẹ káàrọ̀')).toBeNull()
  })

  it('rejects malformed JSON', () => {
    expect(parseTranslation('{"translation": }')).toBeNull()
  })

  it('drops an alternative identical to the translation', () => {
    const parsed = parseTranslation(
      JSON.stringify({
        translation: 'Ụlọ',
        alternatives: [{ text: 'Ụlọ', register: 'neutral' }],
      }),
    )
    expect(parsed?.alternatives).toHaveLength(0)
  })

  it('caps alternatives at two', () => {
    const parsed = parseTranslation(
      JSON.stringify({
        translation: 'Ụlọ',
        alternatives: [
          { text: 'a', register: 'formal' },
          { text: 'b', register: 'formal' },
          { text: 'c', register: 'formal' },
        ],
      }),
    )
    expect(parsed?.alternatives).toHaveLength(2)
  })

  it('ignores an unknown register rather than trusting it', () => {
    const parsed = parseTranslation(
      JSON.stringify({
        translation: 'Ụlọ',
        alternatives: [{ text: 'ulo', register: 'royal' }],
      }),
    )
    expect(parsed?.alternatives[0]?.register).toBe('neutral')
  })

  it('reports null when the detected language is not one we support', () => {
    const parsed = parseTranslation(
      JSON.stringify({ translation: 'Ụlọ', detected_source_language: 'klingon' }),
    )
    expect(parsed?.detectedSourceLanguage).toBeNull()
  })
})

describe('selectProvider', () => {
  it('returns null when nothing is configured', () => {
    expect(selectProvider({} as NodeJS.ProcessEnv)).toBeNull()
  })

  it('prefers groq when both keys are present', () => {
    const env = { GROQ_API_KEY: 'g', GEMINI_API_KEY: 'm' } as NodeJS.ProcessEnv
    expect(selectProvider(env)?.name).toBe('groq')
  })

  it('falls back to gemini when only gemini is configured', () => {
    const env = { GEMINI_API_KEY: 'm' } as NodeJS.ProcessEnv
    expect(selectProvider(env)?.name).toBe('gemini')
  })

  it('treats a blank key as unconfigured', () => {
    expect(selectProvider({ GROQ_API_KEY: '   ' } as NodeJS.ProcessEnv)).toBeNull()
  })
})

describe('POST /api/v1/ai/chat', () => {
  it('returns an answer labelled ai_generated', async () => {
    const response = await createChatHandler(stubProvider('Ẹ káàrọ̀ means good morning.'), null)(
      post({ message: 'What does Ẹ káàrọ̀ mean?', language: 'yo' }),
    )
    expect(response.status).toBe(200)
    const data = (response.body as Record<string, unknown>)['data'] as Record<string, unknown>
    expect(data['answer_type']).toBe('ai_generated')
    expect(data['response']).toContain('good morning')
  })

  it('never claims reviewed_resource', async () => {
    const response = await createChatHandler(stubProvider('some answer'), null)(
      post({ message: 'hello', language: 'yo' }),
    )
    const data = (response.body as Record<string, unknown>)['data'] as Record<string, unknown>
    expect(data['answer_type']).not.toBe('reviewed_resource')
    expect(data['answer_type']).not.toBe('mixed')
  })

  it('attaches sources only from a real approved lookup', async () => {
    const lookup = {
      async findApproved() {
        return [{ id: 'e1', headword: 'Ilé', gloss: 'house' }]
      },
    }
    const response = await createChatHandler(stubProvider('answer'), lookup)(
      post({ message: 'What is Ilé?', language: 'yo' }),
    )
    const data = (response.body as Record<string, unknown>)['data'] as {
      sources: Array<Record<string, unknown>>
    }
    expect(data.sources).toHaveLength(1)
    expect(data.sources[0]?.['review_status']).toBe('approved')
    expect(data.sources[0]?.['type']).toBe('dictionary_entry')
  })

  it('still answers when the lookup throws', async () => {
    const lookup = {
      async findApproved(): Promise<never> {
        throw new Error('db down')
      },
    }
    const response = await createChatHandler(stubProvider('answer'), lookup)(
      post({ message: 'What is Ilé?', language: 'yo' }),
    )
    expect(response.status).toBe(200)
    const data = (response.body as Record<string, unknown>)['data'] as { sources: unknown[] }
    expect(data.sources).toEqual([])
  })

  it('returns 503 with no answer when no provider is configured', async () => {
    const response = await createChatHandler(null, null)(post({ message: 'hi', language: 'yo' }))
    expect(response.status).toBe(503)
    const body = response.body as Record<string, unknown>
    expect(body).not.toHaveProperty('data')
  })

  it('rejects an empty message', async () => {
    const response = await createChatHandler(stubProvider('x'), null)(post({ message: '  ' }))
    expect(response.status).toBe(400)
  })

  it('rejects an over-long message', async () => {
    const response = await createChatHandler(stubProvider('x'), null)(
      post({ message: 'a'.repeat(4001) }),
    )
    expect(response.status).toBe(400)
  })

  it('echoes a supplied conversation id and generates one otherwise', async () => {
    const withId = await createChatHandler(stubProvider('x'), null)(
      post({ message: 'hi', conversation_id: 'conv_123' }),
    )
    expect(
      ((withId.body as Record<string, unknown>)['data'] as Record<string, unknown>)[
        'conversation_id'
      ],
    ).toBe('conv_123')

    const withoutId = await createChatHandler(stubProvider('x'), null)(post({ message: 'hi' }))
    const generated = ((withoutId.body as Record<string, unknown>)['data'] as Record<
      string,
      unknown
    >)['conversation_id']
    expect(typeof generated).toBe('string')
    expect(String(generated).startsWith('conv_')).toBe(true)
  })

  it('never caches a chat answer', async () => {
    const response = await createChatHandler(stubProvider('x'), null)(post({ message: 'hi' }))
    expect(response.headers['cache-control']).toBe('no-store')
  })
})

describe('pickLookupTerm', () => {
  it('picks the longest word', () => {
    expect(pickLookupTerm('what does Ilé mean')).toBe('what')
  })

  it('ignores short tokens', () => {
    expect(pickLookupTerm('a b c')).toBeNull()
  })

  it('keeps tone-marked letters in the term', () => {
    expect(pickLookupTerm('Ẹ káàrọ̀')?.length).toBeGreaterThan(2)
  })
})

describe('provider request shape', () => {
  it('sends the system prompt and the text to the provider', async () => {
    const calls: Array<{ system: string; user: string; temperature: number }> = []
    const spy: AiProvider = {
      name: 'groq',
      async complete(request) {
        calls.push(request)
        return { text: GOOD_TRANSLATION, provider: 'groq' }
      },
    }
    await createTranslateHandler(spy)(post({ text: 'Good morning', target_language: 'yo' }))

    expect(calls).toHaveLength(1)
    expect(calls[0]?.system).toContain('tone marks')
    expect(calls[0]?.user).toContain('Good morning')
    // Translation must be low-temperature.
    expect(calls[0]!.temperature).toBeLessThan(0.5)
  })
})

/* Keep `vi` referenced: provider adapters are exercised through stubs, and the
 * import documents that this suite never touches the network. */
void vi
