import { Link, useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckboxField, Field, RuleList } from '@/components/ui/Field'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconArrowRight, IconInfo } from '@/components/ui/icons'
import { useAuth } from '@/hooks/useAuth'
import { AuthError } from '@/services/authClient'
import {
  evaluatePasswordRules,
  hasErrors,
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
 * Creates a real Supabase account and signs the user in immediately.
 *
 * ## Why there is no "check your email" screen
 *
 * The project runs with `mailer_autoconfirm: true`, so signup returns a usable
 * access token in the same response. A verification screen here would be a
 * screen the user could never leave. If the backend is ever reconfigured to
 * require confirmation, `authService.signUp` throws instead of silently landing
 * the user in a signed-in shell with a dead token — see the null-session branch
 * in `signUp`.
 *
 * ## What is sent and what is not
 *
 * Supabase receives an email and a password. The display name and username go
 * into user metadata, where the `handle_new_user` trigger reads them to populate
 * `profiles.display_name` and `profiles.username` (columns added in migration
 * 0006). Everything the form collects is therefore readable by the rest of the
 * app — previously the username was collected, validated and then discarded.
 */
export function SignUpForm() {
  const [values, setValues] = useState<SignUpValues>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors<SignUpField>>({})
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<SignUpField, boolean>>>({})
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFailure(null)
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

    setSubmitting(true)
    try {
      // The username is sent too. It used to be dropped on the floor: the form
      // validated it, then had nowhere to put it, so every account was created
      // with no handle and Profile showed "No username set" forever.
      await signUp(
        values.email.trim(),
        values.password,
        values.fullName.trim(),
        values.username.trim(),
      )
      setSubmitted(true)
    } catch (error) {
      setFailure(
        error instanceof AuthError
          ? error.message
          : 'Something went wrong while creating your account. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-5">
        <StateMessage
          tone="info"
          icon={<IconInfo width={18} height={18} />}
          title="Your account is ready"
          description={
            <>
              You are signed in as <strong>{values.email.trim()}</strong>. No email
              confirmation is needed, so you can start straight away. Next, tell us which
              language you want to learn.
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
          <Button variant="ghost" onClick={() => navigate('/app')} fullWidth>
            Skip for now
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {failure !== null ? (
        <StateMessage
          tone="error"
          icon={<IconInfo width={18} height={18} />}
          title="Could not create your account"
          description={failure}
        />
      ) : null}

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

      <Button type="submit" size="md" fullWidth disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-xs leading-5 text-ink-500">
        No email confirmation is required — your account works immediately. Terms and privacy
        documents are drafts until legal review is complete.
      </p>

      <p className="text-center text-xs leading-5 text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-forest-700 underline underline-offset-4">
          Log in
        </Link>
      </p>

    </form>
  )
}
