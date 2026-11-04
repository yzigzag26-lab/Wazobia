import { useId, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { useAuth } from '@/hooks/useAuth'
import { translateService } from '@/services/api'
import { WazobiaApiError } from '@/services/client'
import type { TranslateResponse, TranslationRegister } from '@/services/contracts/endpoints'

/**
 * Translation.
 *
 * Two things this page refuses to do:
 *
 *  1. Present a machine translation as if a speaker had checked it. Every
 *     result carries a visible "AI suggestion" badge. The server also sends
 *     `review_status: 'ai_suggestion'`, and this page renders that value rather
 *     than assuming it.
 *  2. Show anything when the provider is not configured. A 503 renders as an
 *     honest unavailable state, not an empty box or a placeholder translation.
 *
 * The output is displayed in a full-orthography field: `Ẹ káàrọ̀` keeps its tone
 * marks because that is the translation, not decoration.
 */

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
] as const

const REGISTERS: readonly { value: TranslationRegister; label: string }[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'formal', label: 'Formal' },
  { value: 'informal', label: 'Informal' },
]

const MAX_TEXT = 1000

type Phase =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'result'; readonly result: TranslateResponse }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'error'; readonly message: string }

export default function TranslatePage() {
  // Protected endpoint: the server answers 401 without a token, so a signed-out
  // visitor is told to sign in instead of being sent to a paid provider.
  const { accessToken } = useAuth()

  const [text, setText] = useState('')
  const [source, setSource] = useState<string>('en')
  const [target, setTarget] = useState<string>('yo')
  const [register, setRegister] = useState<TranslationRegister>('neutral')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [copied, setCopied] = useState(false)

  const textId = useId()
  const sourceId = useId()
  const targetId = useId()
  const registerId = useId()

  const trimmed = text.trim()
  const canSubmit = trimmed.length > 0 && source !== target

  async function submit() {
    if (!canSubmit) return
    setCopied(false)
    setPhase({ kind: 'loading' })
    try {
      const result = await translateService.translate({
        text: trimmed,
        source_language: source === 'auto' ? 'auto' : (source as 'en' | 'yo' | 'ha' | 'ig'),
        target_language: target as 'en' | 'yo' | 'ha' | 'ig',
        register,
      }, { accessToken })
      setPhase({ kind: 'result', result })
    } catch (error) {
      // 401 is not a failure to apologise for — it is the protection working.
      // Say so plainly and point at the fix instead of showing a generic error.
      if (error instanceof WazobiaApiError && error.code === 'UNAUTHENTICATED') {
        setPhase({
          kind: 'error',
          message: 'Please sign in to translate. Translation is protected so that it stays free for learners.',
        })
        return
      }
      if (error instanceof WazobiaApiError && error.code === 'RATE_LIMITED') {
        setPhase({
          kind: 'error',
          message: 'You have reached the translation limit for now. Please wait a few minutes and try again.',
        })
        return
      }
      if (error instanceof WazobiaApiError && error.code === 'PROVIDER_UNAVAILABLE') {
        setPhase({
          kind: 'unavailable',
          message:
            'Translation is not available right now. This usually means the AI provider is not configured for this deployment.',
        })
        return
      }
      if (error instanceof WazobiaApiError && error.isUnavailable) {
        setPhase({
          kind: 'unavailable',
          message: 'The translation service did not respond. Check your connection.',
        })
        return
      }
      setPhase({
        kind: 'error',
        message: error instanceof WazobiaApiError ? error.message : 'Translation failed.',
      })
    }
  }

  function swap() {
    if (source === 'auto') return
    setSource(target)
    setTarget(source)
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      // Clipboard permission denied. Not worth an error state; the text is
      // selectable in the field regardless.
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6">
      <PageHeader
        eyebrow="Translate"
        title="Translate between English and Nigerian languages"
        description="Machine translation with full orthography. Every result is a draft — a speaker has not reviewed it yet, and the label says so."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <label
            htmlFor={sourceId}
            className="mb-1.5 block text-[0.8125rem] font-medium text-ink-700"
          >
            From
          </label>
          <select
            id={sourceId}
            value={source}
            onChange={(event) => {
              setSource(event.target.value)
            }}
            className="w-full rounded-lg border border-paper-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
          >
            <option value="auto">Detect language</option>
            {LANGUAGES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={swap}
          disabled={source === 'auto'}
          aria-label="Swap languages"
          className="mb-0.5 hidden sm:inline-flex"
        >
          ⇄
        </Button>

        <div>
          <label
            htmlFor={targetId}
            className="mb-1.5 block text-[0.8125rem] font-medium text-ink-700"
          >
            To
          </label>
          <select
            id={targetId}
            value={target}
            onChange={(event) => {
              setTarget(event.target.value)
            }}
            className="w-full rounded-lg border border-paper-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
          >
            {LANGUAGES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {source === target ? (
        <p className="mt-2 text-[0.8125rem] text-ember-700">
          Choose two different languages to translate.
        </p>
      ) : null}

      <div className="mt-5">
        <label htmlFor={textId} className="mb-1.5 block text-[0.8125rem] font-medium text-ink-700">
          Text
        </label>
        <textarea
          id={textId}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
          }}
          rows={4}
          maxLength={MAX_TEXT}
          placeholder="Type or paste the text you want translated…"
          className="w-full resize-y rounded-lg border border-paper-300 bg-white px-4 py-3 text-[0.9375rem] leading-7 text-ink-900 placeholder:text-ink-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor={registerId} className="text-[0.8125rem] text-ink-500">
              Register
            </label>
            <select
              id={registerId}
              value={register}
              onChange={(event) => {
                setRegister(event.target.value as TranslationRegister)
              }}
              className="rounded-md border border-paper-300 bg-white px-2 py-1 text-[0.8125rem] text-ink-800 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
            >
              {REGISTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-ink-400">
            {trimmed.length}/{MAX_TEXT}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <Button onClick={submit} isLoading={phase.kind === 'loading'} disabled={!canSubmit}>
          Translate
        </Button>
      </div>

      <div className="mt-8" aria-live="polite" aria-busy={phase.kind === 'loading'}>
        {phase.kind === 'unavailable' ? (
          <StateMessage tone="waiting" title="Translation is unavailable" description={phase.message} />
        ) : null}

        {phase.kind === 'error' ? (
          <StateMessage tone="error" title="Translation failed" description={phase.message} />
        ) : null}

        {phase.kind === 'result' ? (
          <div className="overflow-hidden rounded-xl border border-paper-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-200 bg-paper-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                {/* Rendered from the server's value, not assumed. */}
                <Badge tone={phase.result.review_status === 'reviewed' ? 'approved' : 'pending'} withDot>
                  {phase.result.review_status === 'reviewed' ? 'Reviewed' : 'AI suggestion'}
                </Badge>
                <span className="text-xs text-ink-500">
                  {LANGUAGES.find((l) => l.code === phase.result.source_language)?.label ??
                    phase.result.source_language ??
                    'Detected'}{' '}
                  →{' '}
                  {LANGUAGES.find((l) => l.code === phase.result.target_language)?.label ??
                    phase.result.target_language}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void copy(phase.result.translation)}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="px-4 py-4">
              <p className="text-[1.0625rem] leading-8 text-ink-900">{phase.result.translation}</p>
            </div>

            {phase.result.alternatives.length > 0 ? (
              <div className="border-t border-paper-200 bg-paper-100 px-4 py-3">
                <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  Alternatives
                </p>
                <ul className="space-y-2">
                  {phase.result.alternatives.map((alt, index) => (
                    <li key={`${alt.register}-${String(index)}`} className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[0.9375rem] text-ink-800">{alt.text}</span>
                      <Badge tone="neutral">{alt.register}</Badge>
                      {alt.note ? <span className="text-xs text-ink-500">{alt.note}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="border-t border-paper-200 px-4 py-3 text-xs leading-6 text-ink-500">
              This is a machine draft. Tone marks and word choice have not been verified by a
              speaker — check anything you intend to publish or teach.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
