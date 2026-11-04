import { useEffect, useId, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { Spinner } from '@/components/ui/Spinner'
import { dictionaryService } from '@/services/api'
import { WazobiaApiError } from '@/services/client'
import type { DictionaryEntrySummary } from '@/services/contracts/endpoints'
import { cn } from '@/utils/cn'

/**
 * Dictionary search.
 *
 * The one rule this page exists to honour: the canonical spelling is displayed
 * exactly as stored. `Ilé`, `ụlọ` and `ƙasa` keep their tone marks and dotted
 * letters. Matching folds diacritics on the server so a learner can type
 * `ile` and still find `Ilé`, but what comes back on screen is never folded.
 *
 * States handled explicitly, per the brief: idle (nothing searched yet),
 * loading, results, empty (searched, found nothing), unavailable (the API is
 * not reachable), and error. No state is left to chance and nothing is faked.
 */

const LANGUAGES = [
  { code: '', label: 'All languages' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
] as const

const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
  yo: 'Yorùbá',
  ha: 'Hausa',
  ig: 'Igbo',
}

const PAGE_SIZE = 20
/** Long enough to avoid a request per keystroke, short enough to feel live. */
const DEBOUNCE_MS = 300

type Phase =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | {
      readonly kind: 'results'
      readonly results: readonly DictionaryEntrySummary[]
      readonly total: number
    }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'error'; readonly message: string }

export default function DictionaryPage() {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const inputId = useId()
  const selectId = useId()

  /** What the user actually asked for, without surrounding whitespace. */
  const trimmed = query.trim()

  /*
   * The effect only runs when there is something to fetch. Clearing the box is
   * handled by the change handler below, not by a setState inside the effect:
   * a synchronous setState in an effect starts a second render for no reason,
   * and the empty state is already derivable during render.
   */
  useEffect(() => {
    if (trimmed.length === 0) return

    const controller = new AbortController()

    const timer = setTimeout(() => {
      setPhase({ kind: 'loading' })
      dictionaryService
        .search(
          {
            query: trimmed,
            ...(language === '' ? {} : { language }),
            pageSize: PAGE_SIZE,
          },
          controller.signal,
        )
        .then((response) => {
          setPhase({ kind: 'results', results: response.results, total: response.total })
        })
        .catch((error: unknown) => {
          // An abort is not a failure: it means a newer keystroke superseded
          // this request. Leaving the phase untouched is correct.
          if (error instanceof WazobiaApiError && error.code === 'ABORTED') return
          if (error instanceof WazobiaApiError && error.isUnavailable) {
            setPhase({ kind: 'unavailable' })
            return
          }
          setPhase({
            kind: 'error',
            message:
              error instanceof WazobiaApiError
                ? error.message
                : 'Something went wrong while searching.',
          })
        })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, language])

  // An empty box always reads as "nothing searched yet", regardless of what the
  // last request left in state.
  const visible: Phase = trimmed.length === 0 ? { kind: 'idle' } : phase

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6">
      <PageHeader
        eyebrow="Dictionary"
        title="Look up a word"
        description="Search Yorùbá, Hausa and Igbo. Matching ignores tone marks so you can type without them — but every result is shown in its correct spelling, tone marks included."
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">
            Search the dictionary
          </label>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            placeholder="Type a word, e.g. ilé, ruwa, ụlọ"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-paper-300 bg-white px-4 py-2.5 text-[0.9375rem] text-ink-900 placeholder:text-ink-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor={selectId} className="sr-only">
            Filter by language
          </label>
          <select
            id={selectId}
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value)
            }}
            className="w-full rounded-lg border border-paper-300 bg-white px-3 py-2.5 text-[0.9375rem] text-ink-900 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
          >
            {LANGUAGES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8" aria-live="polite" aria-busy={visible.kind === 'loading'}>
        {visible.kind === 'idle' ? (
          <StateMessage
            tone="neutral"
            title="Start typing to search"
            description="The dictionary contains reviewed entries only. Unreviewed words are held back until a speaker has checked them."
          />
        ) : null}

        {visible.kind === 'loading' ? (
          <div className="flex items-center gap-3 text-ink-600">
            <Spinner />
            <span className="text-sm">Searching…</span>
          </div>
        ) : null}

        {visible.kind === 'unavailable' ? (
          <StateMessage
            tone="waiting"
            title="The dictionary is not reachable"
            description="The API did not respond. This is a connection or configuration problem, not a missing word."
          />
        ) : null}

        {visible.kind === 'error' ? (
          <StateMessage tone="error" title="Search failed" description={visible.message} />
        ) : null}

        {visible.kind === 'results' && visible.results.length === 0 ? (
          <StateMessage
            tone="neutral"
            title="No entries found"
            description={`Nothing matches “${trimmed}”. Try dropping tone marks, or check the spelling.`}
          />
        ) : null}

        {visible.kind === 'results' && visible.results.length > 0 ? (
          <div>
            <p className="mb-3 text-sm text-ink-500">
              {visible.total === 1 ? '1 entry' : `${String(visible.total)} entries`}
              {visible.total > visible.results.length
                ? `, showing the first ${String(visible.results.length)}`
                : ''}
            </p>
            <ul className="divide-y divide-paper-200 overflow-hidden rounded-xl border border-paper-200 bg-white">
              {visible.results.map((entry) => (
                <li key={entry.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    {/* Displayed byte for byte from the database. */}
                    <span className="text-[1.0625rem] font-semibold text-ink-900">
                      {entry.headword}
                    </span>
                    <span className="rounded bg-paper-100 px-1.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-ink-500">
                      {LANGUAGE_LABELS[entry.language] ?? entry.language}
                    </span>
                    {entry.part_of_speech ? (
                      <span className="text-xs italic text-ink-400">
                        {entry.part_of_speech}
                      </span>
                    ) : null}
                  </div>
                  {entry.gloss ? (
                    <p className="mt-1 text-sm leading-6 text-ink-600">{entry.gloss}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <aside
        className={cn(
          'mt-10 rounded-xl border border-paper-200 bg-paper-100 p-4',
          'text-[0.8125rem] leading-6 text-ink-600',
        )}
      >
        <p>
          Entries come from the WAZOBIA course corpus and, for Igbo, from the{' '}
          <a
            href="https://github.com/nkowaokwu/igbo_api"
            className="font-medium text-forest-700 underline decoration-forest-600/40 underline-offset-2 hover:decoration-forest-600"
            rel="noreferrer noopener"
            target="_blank"
          >
            Igbo API
          </a>{' '}
          (Apache-2.0). Every entry records its source. Only entries a speaker has
          approved are shown here; the rest are held for review.
        </p>
      </aside>
    </div>
  )
}
