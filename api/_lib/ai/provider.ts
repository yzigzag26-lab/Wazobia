/**
 * Provider boundary for the AI endpoints (§2.3 chat, §2.4 translate).
 *
 * One narrow interface, two adapters, chosen by environment. Keeping the
 * provider behind an interface is what stops provider JSON, model names and
 * retry logic from leaking into the handlers — and what makes the handlers
 * testable without a network call.
 *
 * Providers are server-only. The key is read from `process.env` inside the
 * Vercel function and never reaches the browser bundle.
 */

/** What a completion request needs, regardless of provider. */
export interface CompletionRequest {
  /** System instruction. Provider-neutral wording, one string. */
  readonly system: string
  readonly user: string
  /** 0–1. Higher is more inventive. Translation wants this low. */
  readonly temperature: number
  readonly maxTokens: number
}

export interface CompletionResult {
  readonly text: string
  /** Which adapter answered. Recorded so a response can be traced. */
  readonly provider: 'groq' | 'gemini'
}

export interface AiProvider {
  readonly name: 'groq' | 'gemini'
  complete(request: CompletionRequest, signal?: AbortSignal): Promise<CompletionResult>
}

/**
 * Thrown when the provider is unreachable, rate-limited, or returns something
 * unusable. The handler maps this to `PROVIDER_UNAVAILABLE` (503), never to a
 * fabricated answer.
 */
export class ProviderError extends Error {
  readonly provider: string
  readonly status: number | null

  constructor(provider: string, status: number | null, message: string) {
    super(message)
    this.name = 'ProviderError'
    this.provider = provider
    this.status = status
  }
}

const DEFAULT_TIMEOUT_MS = 20_000

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  provider: string,
  signal: AbortSignal | undefined,
): Promise<unknown> {
  // A hung provider must not hold a serverless invocation open until the
  // platform kills it. Time out and report unavailable.
  const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
  const combined = signal === undefined ? timeout : AbortSignal.any([signal, timeout])

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: combined,
    })
  } catch (cause) {
    throw new ProviderError(provider, null, `Request to ${provider} failed: ${String(cause)}`)
  }

  if (!response.ok) {
    // The body can contain account identifiers; only the status is carried on.
    throw new ProviderError(provider, response.status, `${provider} returned ${response.status}`)
  }

  try {
    return (await response.json()) as unknown
  } catch {
    throw new ProviderError(provider, response.status, `${provider} returned non-JSON`)
  }
}

/* -------------------------------------------------------------------------- */
/* Groq — OpenAI-compatible chat completions                                  */
/* -------------------------------------------------------------------------- */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
/** Small, fast, multilingual. Good enough for translation of short phrases. */
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export function createGroqProvider(apiKey: string, fetchSignal?: AbortSignal): AiProvider {
  return {
    name: 'groq',
    async complete(request, signal) {
      const payload = await postJson(
        GROQ_URL,
        { authorization: `Bearer ${apiKey}` },
        {
          model: GROQ_MODEL,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.user },
          ],
        },
        'groq',
        signal ?? fetchSignal,
      )

      const choice = (payload as { choices?: Array<{ message?: { content?: unknown } }> })
        .choices?.[0]
      const text = choice?.message?.content
      if (typeof text !== 'string' || text.trim().length === 0) {
        throw new ProviderError('groq', null, 'groq returned no content')
      }
      return { text, provider: 'groq' }
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Gemini — generateContent                                                   */
/* -------------------------------------------------------------------------- */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODEL = 'gemini-2.0-flash'

export function createGeminiProvider(apiKey: string, fetchSignal?: AbortSignal): AiProvider {
  return {
    name: 'gemini',
    async complete(request, signal) {
      const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent`
      const payload = await postJson(
        url,
        { 'x-goog-api-key': apiKey },
        {
          systemInstruction: { parts: [{ text: request.system }] },
          contents: [{ role: 'user', parts: [{ text: request.user }] }],
          generationConfig: {
            temperature: request.temperature,
            maxOutputTokens: request.maxTokens,
          },
        },
        'gemini',
        signal ?? fetchSignal,
      )

      const candidate = (
        payload as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>
        }
      ).candidates?.[0]
      const text = candidate?.content?.parts?.map((p) => p.text).filter(Boolean).join('')
      if (typeof text !== 'string' || text.trim().length === 0) {
        throw new ProviderError('gemini', null, 'gemini returned no content')
      }
      return { text, provider: 'gemini' }
    },
  }
}

/**
 * Pick a provider from the environment.
 *
 * Groq is preferred when both are configured: it is faster and the model is
 * strong on short phrase translation. Whichever is chosen, the caller records
 * which one answered so a bad output can be traced to a provider.
 *
 * Returns `null` when nothing is configured. The endpoints turn that into
 * `PROVIDER_UNAVAILABLE`, never into a fake answer.
 */
export function selectProvider(env: NodeJS.ProcessEnv = process.env): AiProvider | null {
  const groq = env['GROQ_API_KEY']?.trim()
  if (groq) return createGroqProvider(groq)

  const gemini = env['GEMINI_API_KEY']?.trim()
  if (gemini) return createGeminiProvider(gemini)

  return null
}
