import { useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckboxField, Field } from '@/components/ui/Field'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconInfo } from '@/components/ui/icons'
import { useSession } from '@/hooks/useSession'
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
 * Validates, then stops — there is no auth service to call, so it never fakes a
 * successful sign-in. "Remember me" and password recovery are shown because they
 * are real parts of the finished flow, but both state clearly that they activate
 * only after backend integration.
 */
export function LoginForm() {
  const [values, setValues] = useState<LoginValues>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors<LoginField>>({})
  const [remember, setRemember] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [recoveryNotice, setRecoveryNotice] = useState(false)
  const { startGuestSession } = useSession()
  const navigate = useNavigate()

  function setField<K extends LoginField>(key: K, value: LoginValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateLogin(values)
    setErrors(nextErrors)
    setTouched({ identifier: true, password: true })

    if (hasErrors(nextErrors)) {
      const firstKey = Object.keys(nextErrors)[0]
      if (firstKey) document.getElementById(`login-${firstKey}`)?.focus()
      return
    }

    // No auth service exists. Do not simulate a session.
    setSubmitted(true)
  }

  function continueAsGuest() {
    startGuestSession()
    navigate('/app', { replace: true })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {submitted ? (
        <StateMessage
          tone="waiting"
          icon={<IconInfo width={18} height={18} />}
          title="Sign-in is not available yet"
          description="WAZOBIA does not have an authentication service connected, so this form cannot sign you in. You were not logged in and nothing was sent. Continue as a guest to explore the platform."
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
          title="Password recovery opens with accounts"
          description="Sending reset links needs the authentication service, which is not connected yet. Nothing has been emailed."
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
              Applied once sign-in is live. Does not affect guest sessions.
            </span>
          </>
        }
      />

      <Button type="submit" fullWidth>
        Log in
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
