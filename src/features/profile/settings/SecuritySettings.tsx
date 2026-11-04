import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { IconInfo, IconLock } from '@/components/ui/icons'

/**
 * Account security.
 *
 * The honest version of this page for a build with no auth backend:
 *
 *  - It states that no password is stored, because there is nowhere to store one
 *    and faking a "change password" form that always errors would be worse than
 *    showing nothing.
 *  - It still lets the learner *close the session* on this device, which is a
 *    real action with a real effect (it clears device-local profile and progress
 *    data after confirmation).
 *  - The password fields are rendered but disabled, with the reason attached to
 *    the group. That is a deliberate compromise: the page explains the shape of
 *    the settings that will exist, without pretending they work now.
 */
export default function SecuritySettings() {
  const { details, resetProfile } = useProfile()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="security-heading"
        className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="security-heading" className="text-[0.9375rem] font-semibold text-ink-900">
              Password
            </h2>
            <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
              WAZOBIA has no authentication service in this build, so there is no password to
              change. The fields below are disabled for that reason — they are not broken.
            </p>
          </div>
          <Badge tone="pending" withDot>
            Not available
          </Badge>
        </div>

        <fieldset disabled className="mt-4 grid gap-3 opacity-60 sm:grid-cols-2">
          <legend className="sr-only">Change password (unavailable)</legend>
          <Field
            label="Current password"
            id="security-current"
            type="password"
            autoComplete="current-password"
          />
          <Field
            label="New password"
            id="security-new"
            type="password"
            autoComplete="new-password"
          />
        </fieldset>
        <p className="mt-2 text-[0.75rem] text-ink-400">
          Disabled because no password store exists. Nothing typed here would be saved anywhere.
        </p>
      </section>

      <section
        aria-labelledby="session-heading"
        className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
      >
        <h2 id="session-heading" className="text-[0.9375rem] font-semibold text-ink-900">
          This device
        </h2>
        <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
          You are using WAZOBIA as a guest. The profile details, onboarding answers and learning
          progress on this device are held in this browser only.
        </p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-paper-200 bg-paper-50 px-3 py-2.5">
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Signed in as
            </dt>
            <dd className="mt-1 text-[0.875rem] text-ink-900">
              {details.email || 'Guest — no email'}
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] border border-paper-200 bg-paper-50 px-3 py-2.5">
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Session type
            </dt>
            <dd className="mt-1 text-[0.875rem] text-ink-900">Guest, local only</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-[var(--radius-md)] border border-ember-600 bg-ember-100 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ember-700">
            <IconInfo width={14} height={14} />
            Clear this device
          </p>
          <p className="mt-1 text-[0.8125rem] leading-6 text-ink-600">
            Removes your profile, onboarding answers, language choice and lesson progress from this
            browser. This cannot be undone and there is no copy anywhere else.
          </p>
          {confirming ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  resetProfile()
                  setConfirming(false)
                }}
              >
                Yes, clear this device
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => setConfirming(true)}>
              Clear this device
            </Button>
          )}
        </div>
      </section>

      <p className="flex items-start gap-2 rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
        <IconLock width={14} height={14} className="mt-0.5 shrink-0" />
        There is no server-side account to secure yet. When accounts exist, this page will hold
        password changes, active sessions and two-factor settings; nothing here claims those exist
        today.
      </p>
    </div>
  )
}
