import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { reviewService, type ReviewCandidate } from '@/services/api'
import { WazobiaApiError } from '@/services/client'

/**
 * Dictionary review — an operator screen, not a learner screen.
 *
 * ## Why this page exists
 *
 * The dictionary had no way to approve anything. The database requires
 * `review_status = 'approved'` before a row is publicly readable, nothing
 * defaulted to approved, and the only way to change it was hand-written SQL.
 * The result was a shipped dictionary that returned zero rows.
 *
 * ## What it deliberately does NOT do
 *
 * It does not offer "approve everything". The button that does exist approves
 * only rows that pass objective checks, and the page shows exactly how many it
 * will hold back and why BEFORE the click. Bulk-approving 1,014 Igbo headwords
 * written in dictionary verb-stem notation (`-bugha(lị)`, `(agwa)ụnò) -ma`)
 * would put entries in front of learners that no learner typed.
 *
 * ## Authorisation
 *
 * `requireRole` on the server and `wazobia_is_reviewer()` in Postgres both
 * check. This page additionally renders nothing useful if the API says 403 —
 * it does not fall back to a client-side assumption of privilege.
 */

const LANGUAGES = [
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ig', label: 'Igbo' },
  { code: 'ha', label: 'Hausa' },
] as const

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; candidates: readonly ReviewCandidate[] }
  | { kind: 'forbidden' }
  | { kind: 'error'; message: string }

/** Human labels for the database's `quality_flag` values. */
const FLAG_LABELS: Record<string, { label: string; tone: 'approved' | 'pending' | 'danger' }> = {
  clean: { label: 'Clean', tone: 'approved' },
  'lexicographic notation': { label: 'Notation', tone: 'pending' },
  'verb-stem notation': { label: 'Verb stem', tone: 'pending' },
  'very long gloss': { label: 'Long gloss', tone: 'pending' },
  'stray whitespace': { label: 'Whitespace', tone: 'danger' },
  'stray semicolon': { label: 'Semicolon', tone: 'danger' },
  'unbalanced parentheses': { label: 'Broken', tone: 'danger' },
  'no gloss': { label: 'No gloss', tone: 'danger' },
}

function flagFor(flag: string) {
  return FLAG_LABELS[flag] ?? { label: flag, tone: 'pending' as const }
}

export default function ReviewPage() {
  const { accessToken, status: authStatus } = useAuth()
  const [language, setLanguage] = useState<string>('ig')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(
    async (code: string) => {
      try {
        const queue = await reviewService.queue(code, 50, accessToken)
        setPhase({ kind: 'ready', candidates: queue.candidates })
      } catch (error) {
        if (error instanceof WazobiaApiError && error.code === 'FORBIDDEN') {
          setPhase({ kind: 'forbidden' })
          return
        }
        if (error instanceof WazobiaApiError && error.code === 'UNAUTHENTICATED') {
          setPhase({ kind: 'forbidden' })
          return
        }
        setPhase({
          kind: 'error',
          message:
            error instanceof WazobiaApiError
              ? error.message
              : 'The review queue could not be loaded.',
        })
      }
    },
    [accessToken],
  )

  useEffect(() => {
    if (authStatus !== 'signed-in') return
    // Kick the request off the commit phase. Calling `load` directly from the
    // effect body would set state synchronously and start a second render
    // before the first painted; deferring one microtask avoids that and keeps
    // the "loading" transition observable.
    const timer = setTimeout(() => {
      void load(language)
    }, 0)
    return () => {
      clearTimeout(timer)
    }
  }, [language, authStatus, load])

  async function decide(entry: ReviewCandidate, decision: 'approved' | 'rejected') {
    setBusyId(entry.id)
    setNotice(null)
    try {
      await reviewService.decide(entry.id, decision, accessToken)
      setNotice(
        `${decision === 'approved' ? 'Approved' : 'Rejected'} “${entry.headword}”.`,
      )
      // Remove locally rather than refetching the whole page: the queue is a
      // worklist and the reviewer expects the row to leave it.
      setPhase((current) =>
        current.kind === 'ready'
          ? {
              kind: 'ready',
              candidates: current.candidates.filter((candidate) => candidate.id !== entry.id),
            }
          : current,
      )
    } catch (error) {
      setNotice(
        error instanceof WazobiaApiError
          ? error.message
          : 'That decision could not be saved. Nothing was changed.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const candidates = phase.kind === 'ready' ? phase.candidates : []
  const cleanCount = candidates.filter((c) => c.quality_flag === 'clean').length
  const flaggedCount = candidates.length - cleanCount

  return (
    <div className="mx-auto w-full max-w-[76rem] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={<>Operator</>}
        title="Dictionary review"
        description={
          <>
            Only approved entries are visible to learners. This queue shows what is waiting, with
            objective problems flagged — unbalanced parentheses, stray punctuation, missing glosses.
            A clean flag means the string is well-formed, not that the meaning is correct.
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {LANGUAGES.map((entry) => (
          <Button
            key={entry.code}
            variant={language === entry.code ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setLanguage(entry.code)}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      {notice !== null ? (
        <StateMessage tone="info" title="Review saved" description={notice} />
      ) : null}

      {phase.kind === 'forbidden' ? (
        <StateMessage
          tone="neutral"
          title="This page is for reviewers"
          description="Your account does not hold the reviewer role, so the queue is not available. If you believe that is wrong, a project administrator can grant it."
        />
      ) : null}

      {phase.kind === 'error' ? (
        <StateMessage tone="error" title="The queue could not be loaded" description={phase.message} />
      ) : null}

      {phase.kind === 'loading' ? (
        <div className="flex items-center gap-3 py-12 text-ink-600">
          <Spinner />
          <span className="text-sm">Loading the queue…</span>
        </div>
      ) : null}

      {phase.kind === 'ready' ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Stat label="In this batch" value={candidates.length} />
            <Stat label="Well-formed" value={cleanCount} />
            <Stat label="Flagged" value={flaggedCount} />
          </section>

          {candidates.length === 0 ? (
            <StateMessage
              tone="info"
              title="Nothing pending here"
              description="Every entry for this language has been reviewed. Approving this batch is what makes it searchable."
            />
          ) : (
            <ul className="divide-y divide-paper-200 overflow-hidden rounded-lg border border-paper-300">
              {candidates.map((entry) => {
                const flag = flagFor(entry.quality_flag)
                return (
                  <li key={entry.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink-900">{entry.headword}</span>
                        <Badge tone={flag.tone}>{flag.label}</Badge>
                        {entry.part_of_speech ? (
                          <span className="text-xs text-ink-500">{entry.part_of_speech}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-600">
                        {entry.gloss ?? '—'}
                      </p>
                      {entry.source_name ? (
                        <p className="mt-1 text-xs text-ink-400">{entry.source_name}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === entry.id}
                        onClick={() => void decide(entry, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === entry.id}
                        onClick={() => void decide(entry, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-lg border border-paper-300 bg-paper-50 px-4 py-3">
      <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-ink-900">{value}</div>
    </div>
  )
}
