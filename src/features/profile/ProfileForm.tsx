import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconCheck, IconInfo } from '@/components/ui/icons'
import { useAuth } from '@/hooks/useAuth'
import { WazobiaApiError } from '@/services/client'
import type { Profile, ProfileUpdate } from '@/services/contracts/endpoints'

/**
 * Profile details form — saves to the ACCOUNT.
 *
 * ## What this used to do, and why it was wrong
 *
 * It wrote to `localStorage` through the device-local profile store, then
 * rendered "Saved in this browser" over its own input. Nothing left the device.
 * So:
 *
 *   - the name and username captured at registration were never visible here,
 *     because they were stored on the account and this form read local state;
 *   - editing a field changed one browser and nothing else;
 *   - the page reported success for an operation that never happened.
 *
 * Every field now round-trips through `PATCH /api/v1/users/me`, and the form
 * renders the row the server returned rather than the values it sent. If the
 * server disagrees with the input — a username someone else already holds — the
 * user is told that, because only the database can answer it.
 *
 * ## Email
 *
 * Shown, never editable. It is the identity the session token was issued for;
 * `profiles` deliberately has no email column, so there is nothing here to
 * drift out of sync. Changing an address is a different operation (verify the
 * old one, verify the new one) and is not offered until it can be done properly.
 */
export function ProfileForm() {
  const { profile, updateProfile, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState(profile?.display_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [errors, setErrors] = useState<{ username?: string; fullName?: string }>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  /*
   * Re-seed when the profile arrives or changes.
   *
   * The form mounts before `/users/me` has resolved, so the initial state is
   * empty. Without this the fields stay blank for a signed-in user whose account
   * has a name and a handle — the exact symptom being fixed.
   *
   * Done during render rather than in an effect: React recommends "adjusting
   * state when a prop changes" this way, and an effect would render once with
   * the stale value first, briefly showing empty fields to a signed-in user.
   */
  const [seed, setSeed] = useState({
    name: profile?.display_name ?? '',
    handle: profile?.username ?? '',
  })
  if (seed.name !== (profile?.display_name ?? '') || seed.handle !== (profile?.username ?? '')) {
    const next = { name: profile?.display_name ?? '', handle: profile?.username ?? '' }
    setSeed(next)
    setFullName(next.name)
    setUsername(next.handle)
  }

  const dirty =
    fullName !== (profile?.display_name ?? '') || username !== (profile?.username ?? '')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFailure(null)
    setSaved(false)

    const next: typeof errors = {}
    const name = fullName.trim()
    if (name.length === 0) next.fullName = 'Enter a name.'
    else if (name.length > 80) next.fullName = 'Keep this under 80 characters.'

    const handle = username.trim().toLowerCase()
    if (handle.length === 0) next.username = 'Choose a username.'
    else if (!/^[a-z0-9_.]{3,24}$/.test(handle)) {
      next.username = '3–24 characters: letters, numbers, underscore or full stop.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    try {
      // Only send what actually changed. A PATCH that carries an unchanged
      // username would still trip the unique index against the caller's own
      // row on some databases, and it is a needless write either way.
      const update: ProfileUpdate = {
        ...(name === profile?.display_name ? {} : { display_name: name }),
        ...(handle === (profile?.username ?? '') ? {} : { username: handle }),
      }

      if (Object.keys(update).length > 0) {
        await updateProfile(update)
      }
      setSaved(true)
    } catch (error) {
      setFailure(messageFor(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      aria-labelledby="details-heading"
      className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
    >
      <h2 id="details-heading" className="text-[0.9375rem] font-semibold text-ink-900">
        Your details
      </h2>
      <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
        Saved to your account, so they follow you to any device you sign in on.
      </p>

      {failure !== null ? (
        <div className="mt-4">
          <StateMessage
            tone="error"
            icon={<IconInfo width={18} height={18} />}
            title="Those changes were not saved"
            description={failure}
          />
        </div>
      ) : null}

      {saved && !dirty ? (
        <div className="mt-4">
          <StateMessage
            tone="info"
            icon={<IconCheck width={18} height={18} />}
            title="Details saved to your account"
            description="Your details were updated on the server."
          />
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="mt-5 space-y-5">
        <Field
          id="profile-full-name"
          name="fullName"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value)
            setSaved(false)
          }}
          error={errors.fullName}
        />

        <Field
          id="profile-username"
          name="username"
          label="Username"
          autoComplete="username"
          leadingAdornment={<span className="text-ink-400">@</span>}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value.toLowerCase())
            setSaved(false)
          }}
          error={errors.username}
          hint="Shown next to your contributions. Must be unique."
        />

        <Field
          id="profile-email"
          name="email"
          label="Email address"
          type="email"
          value={profile?.email ?? ''}
          readOnly
          disabled
          hint="This is the address you sign in with. Changing it is not available yet."
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {!dirty && !saving ? (
            <span className="text-[0.75rem] text-ink-400">No changes to save.</span>
          ) : null}
        </div>
      </form>

      <p className="mt-4 border-t border-paper-200 pt-3 text-[0.75rem] leading-5 text-ink-400">
        <button
          type="button"
          className="font-medium text-forest-700 underline underline-offset-2"
          onClick={() => void refreshProfile()}
        >
          Reload from the server
        </button>{' '}
        if you changed these elsewhere.
      </p>
    </section>
  )
}

/** Turn a save failure into copy a user can act on. */
function messageFor(error: unknown): string {
  if (error instanceof WazobiaApiError) {
    if (error.code === 'CONFLICT') {
      return 'That username is already taken. Try another one.'
    }
    if (error.code === 'VALIDATION_ERROR' || error.code === 'SEMANTIC_ERROR') {
      return error.message
    }
    if (error.code === 'UNAUTHENTICATED') {
      return 'Your session ended before the change was saved. Sign in again and retry.'
    }
  }
  return 'The change could not be saved. Check your connection and try again.'
}

/** Narrowed export for tests that need the profile shape. */
export type ProfileDetailsProps = { readonly profile: Profile | null }
