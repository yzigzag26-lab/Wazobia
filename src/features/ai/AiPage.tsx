import { useEffect, useId, useRef, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { useAuth } from '@/hooks/useAuth'
import { aiService } from '@/services/api'
import { WazobiaApiError } from '@/services/client'
import type { ChatResponse } from '@/services/contracts/endpoints'

/**
 * AI tutor.
 *
 * The honesty requirement of contract §2.3 lives here in the UI: every answer
 * is badged `AI generated`, and the badge is driven by the server's
 * `answer_type`, not hard-coded. If a future endpoint returns
 * `reviewed_resource`, the label changes to match what was actually returned.
 *
 * Sources are shown only when the server attached real approved entries. The
 * model never gets to cite itself.
 */

const LANGUAGES = [
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
  { code: 'en', label: 'English' },
] as const

const MAX_MESSAGE = 4000

interface Turn {
  readonly id: string
  readonly question: string
  readonly answer: string
  readonly answerType: ChatResponse['answer_type']
  readonly sourceCount: number
}

type Failure =
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'error'; readonly message: string }
  | null

const SUGGESTIONS = [
  'What does Ẹ káàrọ̀ mean, and when do I use it?',
  'Explain the difference between ọkọ, ọkọ̀ and ọ̀kọ̀.',
  'How does Hausa mark plural nouns?',
  'Give me three Igbo greetings and when to use each.',
]

export default function AiPage() {
  // Protected endpoint: the server answers 401 without a token, so a signed-out
  // visitor is told to sign in instead of being sent to a paid provider.
  const { getAccessToken } = useAuth()

  const [message, setMessage] = useState('')
  const [language, setLanguage] = useState<string>('yo')
  const [turns, setTurns] = useState<readonly Turn[]>([])
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<Failure>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const inputId = useId()
  const languageId = useId()
  const endRef = useRef<HTMLDivElement | null>(null)

  const trimmed = message.trim()
  const canSend = trimmed.length > 0 && !pending

  useEffect(() => {
    if (turns.length === 0) return
    // Keep the newest answer in view without scrolling the whole page on mount.
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [turns.length])

  async function send() {
    if (!canSend) return
    const question = trimmed
    setMessage('')
    setPending(true)
    setFailure(null)

    try {
      // Refresh-aware, as in TranslatePage.
      const accessToken = await getAccessToken()
      const response = await aiService.chat({
        message: question,
        language: language as 'yo' | 'ha' | 'ig' | 'en',
        conversation_id: conversationId,
      }, { accessToken })
      setConversationId(response.conversation_id)
      setTurns((current) => [
        ...current,
        {
          id: `${response.conversation_id}-${String(current.length)}`,
          question,
          answer: response.response,
          answerType: response.answer_type,
          sourceCount: response.sources.length,
        },
      ])
    } catch (error) {
      if (error instanceof WazobiaApiError && error.code === 'UNAUTHENTICATED') {
        // The protection working as designed. Point at the fix.
        setFailure({
          kind: 'error',
          message: 'Please sign in to ask the tutor a question. This keeps AI answers available to everyone.',
        })
      } else if (error instanceof WazobiaApiError && error.code === 'RATE_LIMITED') {
        setFailure({
          kind: 'error',
          message: 'You have reached the question limit for now. Please wait a few minutes and try again.',
        })
      } else if (error instanceof WazobiaApiError && error.code === 'PROVIDER_UNAVAILABLE') {
        setFailure({
          kind: 'unavailable',
          message:
            'The tutor is not available right now. This usually means the AI provider is not configured for this deployment.',
        })
      } else if (error instanceof WazobiaApiError && error.isUnavailable) {
        setFailure({
          kind: 'unavailable',
          message: 'The tutor did not respond. Check your connection.',
        })
      } else {
        setFailure({
          kind: 'error',
          message: error instanceof WazobiaApiError ? error.message : 'Something went wrong.',
        })
      }
      // Put the question back so it is not lost on a failed send.
      setMessage(question)
    } finally {
      setPending(false)
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter is a newline. Standard for a chat input.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6">
      <PageHeader
        eyebrow="AI tutor"
        title="Ask about the languages"
        description="A tutor for questions about Yorùbá, Hausa and Igbo grammar, vocabulary and usage. Answers are drafts, not verified teaching material."
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <label htmlFor={languageId} className="text-[0.8125rem] text-ink-600">
          Studying
        </label>
        <select
          id={languageId}
          value={language}
          onChange={(event) => {
            setLanguage(event.target.value)
          }}
          className="rounded-md border border-paper-300 bg-white px-2.5 py-1.5 text-[0.8125rem] text-ink-900 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
        >
          {LANGUAGES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      {turns.length === 0 && !failure ? (
        <div className="mt-8">
          <StateMessage
            tone="neutral"
            title="Ask a question to begin"
            description="Anything about grammar, a word you have heard, or how a phrase is used. Answers are AI-generated and clearly labelled as such."
          />
          <div className="mt-5 grid gap-2">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Try one of these
            </p>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setMessage(suggestion)
                }}
                className="rounded-lg border border-paper-200 bg-white px-3.5 py-2.5 text-left text-[0.875rem] leading-6 text-ink-700 transition-colors hover:border-paper-300 hover:bg-paper-100 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {turns.length > 0 ? (
        <ol className="mt-8 space-y-5">
          {turns.map((turn) => (
            <li key={turn.id}>
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-700 px-4 py-2.5 text-[0.9375rem] leading-7 text-on-brand">
                  {turn.question}
                </p>
              </div>
              <div className="mt-3 rounded-2xl rounded-bl-sm border border-paper-200 bg-white px-4 py-3.5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    tone={turn.answerType === 'ai_generated' ? 'pending' : 'approved'}
                    withDot
                  >
                    {turn.answerType === 'ai_generated'
                      ? 'AI generated'
                      : turn.answerType === 'reviewed_resource'
                        ? 'Reviewed source'
                        : 'Mixed'}
                  </Badge>
                  {turn.sourceCount > 0 ? (
                    <span className="text-xs text-ink-500">
                      {turn.sourceCount === 1
                        ? '1 dictionary entry attached'
                        : `${String(turn.sourceCount)} dictionary entries attached`}
                    </span>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-[0.9375rem] leading-7 text-ink-800">
                  {turn.answer}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {failure ? (
        <div className="mt-6">
          <StateMessage
            tone={failure.kind === 'unavailable' ? 'waiting' : 'error'}
            title={failure.kind === 'unavailable' ? 'Tutor unavailable' : 'Something went wrong'}
            description={failure.message}
          />
        </div>
      ) : null}

      <div ref={endRef} className="mt-6">
        <label htmlFor={inputId} className="sr-only">
          Your question
        </label>
        <textarea
          id={inputId}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value)
          }}
          onKeyDown={onKeyDown}
          rows={3}
          maxLength={MAX_MESSAGE}
          placeholder="Ask about a word, a grammar point, or how a phrase is used…"
          className="w-full resize-y rounded-lg border border-paper-300 bg-white px-4 py-3 text-[0.9375rem] leading-7 text-ink-900 placeholder:text-ink-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-ink-400">
            Enter to send, Shift+Enter for a new line · {trimmed.length}/{MAX_MESSAGE}
          </span>
          <Button onClick={() => void send()} isLoading={pending} disabled={!canSend}>
            Ask
          </Button>
        </div>
      </div>

      <p className="mt-6 text-xs leading-6 text-ink-500">
        Answers are generated by an AI model and are not checked by a speaker. Tone marks and
        grammatical claims can be wrong — verify before you rely on them.
      </p>
    </div>
  )
}
