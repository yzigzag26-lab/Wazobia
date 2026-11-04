import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { IconAlert, IconShield } from '@/components/ui/icons'
import { clearLearningProgress } from '@/features/learn/lessons/useLessonProgress'
import { PROFILE_STORAGE_KEYS } from '@/stores/profileStorage'

/**
 * Privacy and data.
 *
 * Three sections, each stating something true:
 *   1. What is stored (an exact, complete list of localStorage keys).
 *   2. What is not collected (no analytics, no recordings, no third-party calls).
 *   3. Delete everything, behind a typed confirmation.
 *
 * The key list is generated from the same constants the code writes with, so it
 * cannot drift into describing storage that does not exist — or omit storage
 * that does.
 */
export default function PrivacySettings() {
  const { resetProfile } = useProfile()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleted, setDeleted] = useState(false)

  const canDelete = typed.trim().toUpperCase() === 'DELETE'

  function handleDelete() {
    if (!canDelete) return
    resetProfile()
    clearLearningProgress()
    try {
      window.localStorage.removeItem('wazobia.story-progress.v1')
      window.localStorage.removeItem('wazobia.quiz-results.v1')
      window.localStorage.removeItem('wazobia.community-invite.v1')
    } catch {
      /* Storage unavailable: nothing was stored in the first place. */
    }
    setDeleted(true)
    setConfirming(false)
    setTyped('')
  }

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="stored-heading"
        className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
      >
        <h2 id="stored-heading" className="text-[0.9375rem] font-semibold text-ink-900">
          What is stored
        </h2>
        <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
          Everything below is in this browser’s local storage for this site. None of it is sent
          anywhere: there is no API call behind any screen in this build.
        </p>

        <dl className="mt-4 divide-y divide-paper-200 rounded-[var(--radius-md)] border border-paper-200">
          {PROFILE_STORAGE_KEYS.map((entry) => (
            <div key={entry.key} className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
              <dt className="min-w-0 flex-1 text-[0.875rem] text-ink-800">{entry.label}</dt>
              <dd className="shrink-0 font-mono text-[0.6875rem] text-ink-400">{entry.key}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="not-collected-heading"
        className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
      >
        <h2 id="not-collected-heading" className="text-[0.9375rem] font-semibold text-ink-900">
          What is not collected
        </h2>
        <ul className="mt-2.5 space-y-1.5 text-[0.8125rem] leading-6 text-ink-600">
          <li>· No analytics, tracking pixels or advertising identifiers.</li>
          <li>· No microphone access. Read Aloud plays audio; it never records.</li>
          <li>· No account data, because there is no account service.</li>
          <li>
            · No uploaded content, because storage and upload are not connected. Nothing you see on
            this site has been transmitted.
          </li>
        </ul>
        <p className="mt-3 flex items-start gap-2 text-[0.75rem] leading-5 text-ink-400">
          <IconShield width={14} height={14} className="mt-0.5 shrink-0" />
          Guest access creates no Supabase user. The platform’s session layer is not wired to
          anything in this build, by design.
        </p>
      </section>

      <section
        aria-labelledby="delete-heading"
        className="rounded-[var(--radius-lg)] border border-ember-600 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="delete-heading" className="text-[0.9375rem] font-semibold text-ink-900">
              Delete my data
            </h2>
            <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
              Permanently removes your profile, onboarding answers, language choice, learning
              progress and quiz results from this browser. There is no copy on a server, so nothing
              can be recovered.
            </p>
          </div>
          <Badge tone="danger">Irreversible</Badge>
        </div>

        {deleted ? (
          <output className="mt-4 block rounded-[var(--radius-md)] border border-forest-300 bg-forest-50 px-3.5 py-2.5 text-[0.8125rem] text-forest-800">
            Local data cleared. Reload the page to start from a clean state.
          </output>
        ) : null}

        {confirming ? (
          <div className="mt-4 space-y-3">
            <Field
              label="Type DELETE to confirm"
              id="delete-confirm"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              hint="This is a confirmation, not a password. Your data cannot be restored."
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" onClick={handleDelete} disabled={!canDelete}>
                Delete everything
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirming(false)
                  setTyped('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => setConfirming(true)}
            leadingIcon={<IconAlert width={14} height={14} />}
          >
            Delete my data
          </Button>
        )}
      </section>
    </div>
  )
}
