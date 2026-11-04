import { useState, type FormEvent } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { IconCheck } from '@/components/ui/icons'

/**
 * Profile details form.
 *
 * Validation is deliberately modest and honest:
 *
 *  - **Username uniqueness cannot be checked.** There is no account table. The
 *    field says "availability will be checked when accounts exist" rather than
 *    showing a green tick it cannot earn.
 *  - **Email is checked for shape only.** No inbox is contacted.
 *  - **Full name** is free text, trimmed, with a length bound.
 *
 * Saving writes to `localStorage` via the profile context and says "saved in
 * this browser" — never "saved".
 */
export function ProfileForm() {
  const { details, setDetails } = useProfile()

  const [fullName, setFullName] = useState(details.fullName)
  const [username, setUsername] = useState(details.username)
  const [email, setEmail] = useState(details.email)
  const [errors, setErrors] = useState<{ username?: string; email?: string; fullName?: string }>({})
  const [saved, setSaved] = useState(false)

  const dirty =
    fullName !== details.fullName || username !== details.username || email !== details.email

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next: typeof errors = {}

    if (fullName.trim().length === 0) next.fullName = 'Enter a name.'
    else if (fullName.trim().length > 80) next.fullName = 'Keep this under 80 characters.'

    const name = username.trim()
    if (name.length === 0) next.username = 'Choose a username.'
    else if (!/^[a-z0-9_.]{3,24}$/i.test(name))
      next.username = '3–24 characters: letters, numbers, underscore or full stop.'

    const address = email.trim()
    if (address.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address))
      next.email = 'That does not look like an email address.'

    setErrors(next)
    if (Object.keys(next).length > 0) {
      setSaved(false)
      return
    }

    setDetails({ fullName: fullName.trim(), username: name, email: address })
    setSaved(true)
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
        These were collected at sign-up and can be edited here.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-4 grid gap-4 sm:grid-cols-2"
      >
        <Field
          label="Full name"
          id="profile-full-name"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value)
            setSaved(false)
          }}
          error={errors.fullName}
          autoComplete="name"
        />

        <Field
          label="Username"
          id="profile-username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value)
            setSaved(false)
          }}
          error={errors.username}
          hint="Availability will be checked once accounts exist."
          autoComplete="username"
          leadingAdornment={<span className="text-[0.8125rem]">@</span>}
        />

        <div className="sm:col-span-2">
          <Field
            label="Email address"
            id="profile-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setSaved(false)
            }}
            error={errors.email}
            hint="Shape-checked only. No verification email is sent, and none can be yet."
            autoComplete="email"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={!dirty}>
            Save changes
          </Button>
          {saved && !dirty ? (
            <output className="flex items-center gap-1.5 text-[0.8125rem] text-forest-800">
              <IconCheck width={14} height={14} />
              Saved in this browser
            </output>
          ) : null}
          {dirty ? (
            <span className="text-[0.75rem] text-ink-400">Unsaved changes</span>
          ) : null}
        </div>
      </form>
    </section>
  )
}
