import { useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckboxField, Field } from '@/components/ui/Field'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconInfo } from '@/components/ui/icons'
import { useSession } from '@/hooks/useSession'
import { useAuth } from '@/hooks/useAuth'
import { AuthError } from '@/services/authClient'
import {
  hasErrors,
  validateLogin,
  type FieldErrors,
  type LoginField,
  type LoginValues,
} from './validation'

const INITIAL: LoginValues = { identifier: '', password: '' }

/**
 * Login form.
 *
 * This is a real sign-in. On submit it calls Supabase Auth through
 * `authService`, stores the returned session, and navigates into the app.
 *
 * There is no email-verification step: the project runs with
 * `mailer_autoconfirm` on, so a correct email + password is immediately a
 * signed-in session. If that were ever turned back off, `signIn` would still
 * work for existing users — Supabase issues a token to a confirmed account
 * regardless — and the honest failure for an unconfirmed one is the message
 * below.
 *
 * "Continue as guest" is kept: public pages genuinely work without an account.
 * Protected endpoints answer 401, and the UI says so rather than pretending.
 */
export function LoginForm() {
  const [values, setValues] = useState<LoginValues>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors<LoginField>>({})
  const [remember, setRemember] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({})
  const [recoveryNotice, setRecoveryNotice] = useState(false)
  const { startGuestSession } = useSession()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  function setField<K extends LoginField>(key: K, value: LoginValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateLogin(values)
    setErrors(nextErrors)
    setTouched({ identifier: true, password: true })
    setFailure(null)

    if (hasErrors(nextErrors)) {
      const firstKey = Object.keys(nextErrors)[0]
      if (firstKey) document.getElementById(`login-${firstKey}`)?.focus()
      return
    }

    setSubmitting(true)
    try {
      // The identifier is an email: accounts are email-based, and the field
      // label says so once the user starts typing something without an "@".
      await signIn(values.identifier.trim(), values.password)
      navigate('/app', { replace: true })
    } catch (error) {
      if (error instanceof AuthError) {
        setFailure(error.message)
      } else {
        setFailure('Something went wrong while signing you in. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function continueAsGuest() {
    startGuestSession()
    navigate('/app', { replace: true })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {failure !== null ? (
        <StateMessage
          tone="error"
          icon={<IconInfo width={18} height={18} />}
          title="Could not sign you in"
          description={failure}
        />
      ) : null}

      <Field
        id="login-identifier"
        name="identifier"
        label="Email or username"
        autoComplete="username"
        placeholder="name@example.com"
        value={values.identifier}
        onChange={(event) => setField('identifier', event.target.value)}
        onBlur={() => setTouched((current) => ({ ...current, identifier: true }))}
        error={touched.identifier ? errors.identifier : undefined}
      />

      <div>
        <Field
          id="login-password"
          name="password"
          label="Password"
          autoComplete="current-password"
          revealable
          value={values.password}
          onChange={(event) => setField('password', event.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, password: true }))}
          error={touched.password ? errors.password : undefined}
          labelAction={
            <button
              type="button"
              onClick={() => setRecoveryNotice(true)}
              className="text-xs font-medium text-forest-700 underline underline-offset-4 hover:text-forest-800"
            >
              Forgot password?
            </button>
          }
        />
      </div>

      {recoveryNotice ? (
        <StateMessage
          tone="neutral"
          icon={<IconInfo width={16} height={16} />}
          title="Password recovery is not wired up yet"
          description="Reset emails need the project's SMTP sender configured. Until then, ask an administrator to reset your password. Nothing has been emailed."
          action={
            <Button variant="ghost" size="sm" onClick={() => setRecoveryNotice(false)} type="button">
              Dismiss
            </Button>
          }
        />
      ) : null}

      <CheckboxField
        id="login-remember"
        name="remember"
        checked={remember}
        onChange={(event) => setRemember(event.target.checked)}
        label={
          <>
            Keep me signed in on this device
            <span className="block text-xs text-ink-500">
              Your session is stored in this browser and refreshed automatically.
            </span>
          </>
        }
      />

      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? 'Signing in…' : 'Log in'}
      </Button>

      <div className="relative py-1 text-center">
        <span className="relative z-10 bg-paper-50 px-3 text-xs uppercase tracking-[0.1em] text-ink-400">
          or
        </span>
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-paper-300" />
      </div>

      <Button variant="secondary" fullWidth onClick={continueAsGuest} type="button">
        Continue as guest
      </Button>

      <p className="text-center text-xs leading-5 text-ink-500">
        Guest access is stored in this browser only. It creates no account and grants no
        privileges.
      </p>
    </form>
  )
}
