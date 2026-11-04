import { useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckboxField, Field, RuleList } from '@/components/ui/Field'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconArrowRight, IconInfo } from '@/components/ui/icons'
import { useSession } from '@/hooks/useSession'
import {
  evaluatePasswordRules,
  hasErrors,
  isPasswordAcceptable,
  validateSignUp,
  type FieldErrors,
  type SignUpField,
  type SignUpValues,
} from './validation'

const INITIAL: SignUpValues = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
}

/**
 * Registration form.
 *
 * The form validates fully and then **stops**. There is no backend, so it does
 * not pretend to create an account: it shows an honest notice and offers the one
 * path that genuinely works — continuing as a guest.
 *
 * Integration point: replace the body of `handleSubmit` with a call to
 * `authService.register()` (Supabase Auth via a server route). Everything above
 * that line — state, validation, error rendering, accessibility wiring —
 * is already final.
 */
export function SignUpForm() {
  const [values, setValues] = useState<SignUpValues>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors<SignUpField>>({})
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<SignUpField, boolean>>>({})
  const { startGuestSession } = useSession()
  const navigate = useNavigate()

  const passwordRules = evaluatePasswordRules(values.password)

  function setField<K extends SignUpField>(key: K, value: SignUpValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    // Clear a field's error as soon as the user edits it.
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function handleBlur(key: SignUpField) {
    setTouched((current) => ({ ...current, [key]: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateSignUp(values)
    setErrors(nextErrors)
    setTouched({
      fullName: true,
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
      acceptedTerms: true,
    })

    if (hasErrors(nextErrors)) {
      // Move focus to the first invalid control so keyboard users are not lost.
      const firstKey = Object.keys(nextErrors)[0]
      if (firstKey) document.getElementById(`signup-${firstKey}`)?.focus()
      return
    }

    /**
     * No backend exists. Passing validation does not mean an account was made,
     * and this branch deliberately does not imply otherwise.
     *
     * The recommended journey is Sign Up → Account Details → Onboarding. We
     * therefore hand the user straight to the questionnaire rather than to a
     * dead end, while keeping the "no account was created" notice on screen so
     * the state is never misrepresented.
     */
    setSubmitted(true)
  }

  function continueAsGuest() {
    startGuestSession()
    navigate('/app', { replace: true })
  }

  if (submitted) {
    return (
      <div className="space-y-5">
        <StateMessage
          tone="waiting"
          icon={<IconInfo width={18} height={18} />}
          title="Account registration is not available yet"
          description={
            <>
              Your details passed validation, but WAZOBIA does not have an account service
              connected. Nothing was sent and no account was created. You can continue exploring
              WAZOBIA as a guest.
            </>
          }
        />
        <div className="flex flex-col gap-2.5">
          <Button
            onClick={() => navigate('/onboarding')}
            fullWidth
            trailingIcon={<IconArrowRight width={15} height={15} />}
          >
            Continue to onboarding
          </Button>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Button variant="secondary" onClick={continueAsGuest}>
              Continue as guest
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSubmitted(false)
              }}
            >
              Back to the form
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field
        id="signup-fullName"
        name="fullName"
        label="Full name"
        autoComplete="name"
        placeholder="Adaeze Okonkwo"
        value={values.fullName}
        onChange={(event) => setField('fullName', event.target.value)}
        onBlur={() => handleBlur('fullName')}
        error={touched.fullName ? errors.fullName : undefined}
      />

      <Field
        id="signup-email"
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        inputMode="email"
        placeholder="name@example.com"
        value={values.email}
        onChange={(event) => setField('email', event.target.value)}
        onBlur={() => handleBlur('email')}
        error={touched.email ? errors.email : undefined}
      />

      <Field
        id="signup-username"
        name="username"
        label="Username"
        autoComplete="username"
        placeholder="adaeze_x"
        value={values.username}
        onChange={(event) => setField('username', event.target.value.toLowerCase())}
        onBlur={() => handleBlur('username')}
        error={touched.username ? errors.username : undefined}
        hint="Lowercase letters, numbers, dots or underscores."
      />

      <div>
        <Field
          id="signup-password"
          name="password"
          label="Password"
          autoComplete="new-password"
          revealable
          value={values.password}
          onChange={(event) => setField('password', event.target.value)}
          onBlur={() => handleBlur('password')}
          error={touched.password ? errors.password : undefined}
          aria-describedby="signup-password-rules"
        />
        <div id="signup-password-rules">
          <RuleList rules={passwordRules} />
        </div>
      </div>

      <Field
        id="signup-confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        revealable
        value={values.confirmPassword}
        onChange={(event) => setField('confirmPassword', event.target.value)}
        onBlur={() => handleBlur('confirmPassword')}
        error={touched.confirmPassword ? errors.confirmPassword : undefined}
      />

      <CheckboxField
        id="signup-terms"
        name="acceptedTerms"
        checked={values.acceptedTerms}
        onChange={(event) => setField('acceptedTerms', event.target.checked)}
        error={errors.acceptedTerms}
        label={
          <>
            I agree to the <span className="font-medium text-forest-800">Terms of Use</span> and{' '}
            <span className="font-medium text-forest-800">Privacy Notice</span>, including how
            contributions and recordings may be used.
          </>
        }
      />

      <Button type="submit" size="md" fullWidth>
        Create account
      </Button>

      <p className="text-center text-xs leading-5 text-ink-500">
        Terms and privacy documents are drafts until legal review is complete. Nothing is submitted
        or stored by this form.
      </p>

      <div className="relative py-1 text-center">
        <span className="relative z-10 bg-paper-50 px-3 text-xs uppercase tracking-[0.1em] text-ink-400">
          or
        </span>
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-paper-300" />
      </div>

      <Button variant="secondary" fullWidth onClick={continueAsGuest} type="button">
        Continue as guest
      </Button>

      {/* Keeps the advisory password rule honest without blocking submission. */}
      {values.password && !isPasswordAcceptable(values.password) ? (
        <p className="text-center text-xs text-ink-500">
          A stronger password will be required once accounts are live.
        </p>
      ) : null}
    </form>
  )
}
