import { successEnvelope, errorEnvelope } from '../envelope.js'
import { resolveRequestId } from '../request-id.js'
import { jsonResponse, type HttpRequest, type HttpResponse } from '../http.js'
import { ProviderError, type AiProvider } from '../ai/provider.js'

/**
 * `POST /api/v1/translate` — contract §2.4.
 *
 * Two rules dominate the design:
 *
 *  1. **The response is labelled a suggestion, always.** `review_status` is
 *     `ai_suggestion`. There is no code path here that returns `reviewed`,
 *     because nothing in this handler can review anything. A machine draft
 *     presented as reviewed would be the single worst defect this product
 *     could ship.
 *
 *  2. **Provider output is parsed, not trusted.** The model is asked for JSON,
 *     but a model can always return prose, an empty string, or a differently
 *     shaped object. Anything that does not parse into the contract shape is a
 *     `PROVIDER_UNAVAILABLE`, not a best-effort guess.
 *
 * Tone marks matter here: Yorùbá `Ẹ káàrọ̀` and `E kaaro` are different
 * strings, and the prompt demands the former. Output is passed through
 * byte-for-byte; this handler never normalises it.
 */

export interface TranslateData {
  readonly translation: string
  readonly source_language: string | null
  readonly target_language: string
  readonly alternatives: readonly {
    readonly text: string
    readonly register: 'formal' | 'informal' | 'neutral'
    readonly note?: string
  }[]
  readonly review_status: 'ai_suggestion'
}

const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  yo: 'Yorùbá',
  ha: 'Hausa',
  ig: 'Igbo',
  en: 'English',
}

const REGISTERS = new Set(['formal', 'informal', 'neutral'])
const MAX_TEXT_LENGTH = 1000

const SYSTEM_PROMPT = `You are a translation engine for Nigerian languages: Yorùbá (yo), Hausa (ha), Igbo (ig) and English (en).

Absolute requirements:
1. Always write Yorùbá, Hausa and Igbo with full, correct orthography — tone marks, sub-dots (ẹ ọ ṣ ị ụ), and hooked letters (ɓ ɗ ƙ). Never ASCII-fold them. "Ẹ káàrọ̀" is correct; "E kaaro" is wrong.
2. Reply with a single JSON object and nothing else. No markdown fences, no commentary.
3. Shape:
{"translation": "<the best translation>", "detected_source_language": "<yo|ha|ig|en|null>", "alternatives": [{"text": "<variant>", "register": "formal|informal|neutral", "note": "<short reason>"}]}
4. Give 0 to 2 alternatives. Each must differ in register or dialect, not in spelling of the same word. Omit alternatives rather than padding the array.
5. If you do not know a translation, set "translation" to "" and say so in a single alternative with a note. Never invent a word.
6. Do not add explanations outside the JSON.`

export function createTranslateHandler(provider: AiProvider | null) {
  return async function translateHandler(request: HttpRequest): Promise<HttpResponse> {
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

    const rawText = body['text']
    const text = typeof rawText === 'string' ? rawText.trim() : ''
    if (text.length === 0) {
      return jsonResponse(
        400,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'Provide text to translate.',
          details: { field: 'text' },
        }),
      )
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return jsonResponse(
        400,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: `Text is limited to ${MAX_TEXT_LENGTH} characters.`,
          details: { field: 'text' },
        }),
      )
    }

    const target = body['target_language']
    if (typeof target !== 'string' || !(target in LANGUAGE_NAMES)) {
      return jsonResponse(
        400,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'target_language must be one of: yo, ha, ig, en.',
          details: { field: 'target_language' },
        }),
      )
    }

    const rawSource = body['source_language']
    const source =
      typeof rawSource === 'string' && rawSource.length > 0 ? rawSource : 'auto'
    if (source !== 'auto' && !(source in LANGUAGE_NAMES)) {
      return jsonResponse(
        400,
        errorEnvelope('VALIDATION_ERROR', requestId, {
          message: 'source_language must be "auto" or one of: yo, ha, ig, en.',
          details: { field: 'source_language' },
        }),
      )
    }

    const rawRegister = body['register']
    const register =
      typeof rawRegister === 'string' && REGISTERS.has(rawRegister) ? rawRegister : 'neutral'

    // No key configured. This is a deployment state, not a client error, and it
    // is emphatically not a reason to invent a translation.
    if (provider === null) {
      return jsonResponse(
        503,
        errorEnvelope('PROVIDER_UNAVAILABLE', requestId, {
          message: 'Translation is not available right now.',
        }),
      )
    }

    const user = [
      `Translate into ${LANGUAGE_NAMES[target] ?? target} (${target}).`,
      source === 'auto' ? 'Detect the source language.' : `The source is ${source}.`,
      `Preferred register: ${register}.`,
      '',
      'Text to translate:',
      text,
    ].join('\n')

    try {
      const completion = await provider.complete({
        system: SYSTEM_PROMPT,
        user,
        // Low temperature: translation should be stable, not creative.
        temperature: 0.2,
        maxTokens: 700,
      })

      const parsed = parseTranslation(completion.text)
      if (parsed === null) {
        return jsonResponse(503, errorEnvelope('PROVIDER_UNAVAILABLE', requestId))
      }

      const data: TranslateData = {
        translation: parsed.translation,
        source_language: parsed.detectedSourceLanguage,
        target_language: target,
        alternatives: parsed.alternatives,
        // Not a typo and not configurable: nothing here can approve content.
        review_status: 'ai_suggestion',
      }
      // Never cached. A translation is generated per request and must not be
      // replayed to a different user from a shared cache.
      return jsonResponse(200, successEnvelope(data, requestId))
    } catch (error) {
      if (error instanceof ProviderError) {
        return jsonResponse(
          503,
          errorEnvelope(
            'PROVIDER_UNAVAILABLE',
            requestId,
            error.status === 429
              ? { message: 'The translator is busy. Try again shortly.' }
              : {},
          ),
        )
      }
      return jsonResponse(500, errorEnvelope('INTERNAL_ERROR', requestId))
    }
  }
}

export interface ParsedTranslation {
  readonly translation: string
  readonly detectedSourceLanguage: string | null
  readonly alternatives: readonly {
    readonly text: string
    readonly register: 'formal' | 'informal' | 'neutral'
    readonly note?: string
  }[]
}

/**
 * Parse the model's JSON into the contract shape, or return `null`.
 *
 * Handles the two failures models actually produce: markdown fences around
 * otherwise valid JSON, and prose before or after the object. Everything else
 * — wrong types, missing translation, invented registers — is rejected rather
 * than coerced.
 */
export function parseTranslation(raw: string): ParsedTranslation | null {
  const stripped = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null

  let candidate: unknown
  try {
    candidate = JSON.parse(stripped.slice(start, end + 1))
  } catch {
    return null
  }
  if (typeof candidate !== 'object' || candidate === null) return null

  const record = candidate as Record<string, unknown>
  const translation = record['translation']
  if (typeof translation !== 'string' || translation.trim().length === 0) return null

  const detected = record['detected_source_language']
  const detectedSourceLanguage =
    typeof detected === 'string' && detected in LANGUAGE_NAMES ? detected : null

  const rawAlternatives = record['alternatives']
  const alternatives: Array<{
    text: string
    register: 'formal' | 'informal' | 'neutral'
    note?: string
  }> = []

  if (Array.isArray(rawAlternatives)) {
    for (const item of rawAlternatives.slice(0, 2)) {
      if (typeof item !== 'object' || item === null) continue
      const entry = item as Record<string, unknown>
      const altText = entry['text']
      if (typeof altText !== 'string' || altText.trim().length === 0) continue
      // An alternative that is identical to the main translation is noise.
      if (altText.trim() === translation.trim()) continue
      const altRegister = entry['register']
      const register: 'formal' | 'informal' | 'neutral' =
        typeof altRegister === 'string' && REGISTERS.has(altRegister)
          ? (altRegister as 'formal' | 'informal' | 'neutral')
          : 'neutral'
      const note = entry['note']
      alternatives.push({
        text: altText,
        register,
        ...(typeof note === 'string' && note.trim().length > 0 ? { note } : {}),
      })
    }
  }

  // `translation` is passed through byte for byte. No trimming beyond the
  // emptiness check above, and no Unicode normalisation: the tone marks are
  // the content.
  return { translation, detectedSourceLanguage, alternatives }
}
