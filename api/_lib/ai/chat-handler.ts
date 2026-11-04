import { successEnvelope, errorEnvelope } from '../envelope.js'
import { resolveRequestId } from '../request-id.js'
import { jsonResponse, type HttpRequest, type HttpResponse } from '../http.js'
import type { RateLimiter } from '../rate-limit.js'
import { ProviderError, type AiProvider } from './provider.js'

/**
 * `POST /api/v1/ai/chat` — contract §2.3.
 *
 * The contract's hard requirement is that `answer_type` is **truthful**. This
 * handler can only ever produce `ai_generated`, and it says so. It does not
 * claim `reviewed_resource` unless it actually attached a reviewed entry, and
 * it only does that when a real dictionary lookup returned an approved row.
 *
 * `sources` is populated from an actual search, not from the model's own claim
 * about what it used. A model saying "according to the dictionary" is not a
 * source; a row we fetched is.
 *
 * Chat history is not persisted here. There is no authenticated user and no
 * conversation store wired into this endpoint, so `conversation_id` is echoed
 * back when supplied and otherwise generated — it is a correlator, not a saved
 * thread. Claiming otherwise would imply history that does not exist.
 */

export interface ChatData {
  readonly response: string
  readonly language: string
  readonly conversation_id: string
  readonly answer_type: 'ai_generated' | 'reviewed_resource' | 'mixed'
  readonly sources: readonly {
    readonly type: 'dictionary_entry'
    readonly id: string
    readonly review_status: 'approved' | 'pending'
  }[]
}

/** Minimal lookup the handler needs; keeps it decoupled from the repository. */
export interface ApprovedEntryLookup {
  /** Approved entries whose headword contains `term`. */
  findApproved(
    term: string,
    language: string,
  ): Promise<readonly { id: string; headword: string; gloss: string | null }[]>
}

const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  yo: 'Yorùbá',
  ha: 'Hausa',
  ig: 'Igbo',
  en: 'English',
}

const MAX_MESSAGE_LENGTH = 4000

const SYSTEM_PROMPT = `You are a language tutor for Yorùbá, Hausa and Igbo, working inside the WAZOBIA app.

Rules:
1. Write the target language with full orthography — tone marks, sub-dots (ẹ ọ ṣ ị ụ), hooked letters (ɓ ɗ ƙ). Never ASCII-fold. "Ẹ káàrọ̀" is right; "E kaaro" is wrong.
2. Be concrete and brief. Answer the question asked. Do not pad with generalities about language learning.
3. If you are unsure of a word or a tone, say you are unsure. Never invent a translation or a tone pattern to sound confident.
4. You are producing a draft for a learner. Do not claim your answer has been reviewed or verified by anyone.
5. Never state a grammatical rule you are not confident about. It is better to say "I'm not sure" than to teach something wrong.
6. Plain prose or short lists only. No markdown headings.`

function newConversationId(): string {
  return `conv_${crypto.randomUUID()}`
}

/**
 * `deps.rateLimiter` is optional so the handler stays callable in isolation.
 * When supplied it is consulted AFTER authentication (the adapter's `protect`
 * wrapper) and BEFORE any provider spend.
 */
export interface ChatHandlerDeps {
  readonly rateLimiter?: RateLimiter | undefined
}

export function createChatHandler(
  provider: AiProvider | null,
  lookup: ApprovedEntryLookup | null,
  deps: ChatHandlerDeps = {},
) {
  return async function chatHandler(request: HttpRequest): Promise<HttpResponse> {
    const requestId = resolveRequestId(request.requestIdHeader)

    if (request.method !== 'POST') {
      return jsonResponse(
        405,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'This endpoint only accepts POST.',
        }),
        { allow: 'POST' },
      )
    }

    if (deps.rateLimiter !== undefined) {
      const decision = await deps.rateLimiter('chat', request.authorization)
      if (!decision.allowed) {
        return jsonResponse(
          429,
          errorEnvelope('RATE_LIMITED', requestId, {
            details: { retry_after_seconds: decision.retryAfterSeconds },
          }),
          { 'retry-after': String(decision.retryAfterSeconds) },
        )
      }
    }

    const body = request.body as Record<string, unknown> | undefined
    if (typeof body !== 'object' || body === null) {
      return jsonResponse(
        400,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'A JSON body is required.',
          details: { field: 'body' },
        }),
      )
    }

    const rawMessage = body['message']
    const message = typeof rawMessage === 'string' ? rawMessage.trim() : ''
    if (message.length === 0) {
      return jsonResponse(
        400,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'Provide a message.',
          details: { field: 'message' },
        }),
      )
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse(
        400,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`,
          details: { field: 'message' },
        }),
      )
    }

    const rawLanguage = body['language']
    const language =
      typeof rawLanguage === 'string' && rawLanguage in LANGUAGE_NAMES ? rawLanguage : 'en'

    const rawConversation = body['conversation_id']
    const conversationId =
      typeof rawConversation === 'string' && rawConversation.length > 0
        ? rawConversation
        : newConversationId()

    if (provider === null) {
      return jsonResponse(
        503,
        errorEnvelope('PROVIDER_UNAVAILABLE', requestId, {
          message: 'The tutor is not available right now.',
        }),
      )
    }

    try {
      const completion = await provider.complete({
        system: SYSTEM_PROMPT,
        user: `The learner is studying ${LANGUAGE_NAMES[language] ?? language} (${language}).\n\n${message}`,
        temperature: 0.4,
        maxTokens: 900,
      })

      /*
       * Sources come from a real approved-entry lookup keyed on the message's
       * most distinctive word, not from what the model says it used. That is
       * the difference between a citation and a claim.
       */
      const sources: ChatData['sources'][number][] = []
      if (lookup !== null) {
        const term = pickLookupTerm(message)
        if (term !== null) {
          try {
            const found = await lookup.findApproved(term, language)
            for (const entry of found.slice(0, 3)) {
              sources.push({ type: 'dictionary_entry', id: entry.id, review_status: 'approved' })
            }
          } catch {
            // A failed lookup must not fail the answer. The answer is still a
            // draft; it simply carries no citations.
          }
        }
      }

      const data: ChatData = {
        response: completion.text.trim(),
        language,
        conversation_id: conversationId,
        // Truthful by construction: this handler generated the text.
        answer_type: 'ai_generated',
        sources,
      }
      return jsonResponse(200, successEnvelope(data, requestId))
    } catch (error) {
      if (error instanceof ProviderError) {
        return jsonResponse(
          503,
          errorEnvelope(
            'PROVIDER_UNAVAILABLE',
            requestId,
            error.status === 429
              ? { message: 'The tutor is busy. Try again shortly.' }
              : {},
          ),
        )
      }
      return jsonResponse(500, errorEnvelope('INTERNAL_ERROR', requestId))
    }
  }
}

/**
 * Pull the longest word-ish token out of a message to use as a dictionary
 * lookup term. Crude on purpose: this only decides whether to attach a
 * citation, and a wrong pick costs nothing but a missing source.
 */
export function pickLookupTerm(message: string): string | null {
  const tokens = message
    .split(/[^\p{L}\p{M}'-]+/u)
    .filter((token) => token.length >= 3 && /[\p{L}]/u.test(token))
  if (tokens.length === 0) return null
  return tokens.reduce((longest, token) => (token.length > longest.length ? token : longest))
}
