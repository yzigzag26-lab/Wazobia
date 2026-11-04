/**
 * Client-side form validation.
 *
 * This exists to give immediate feedback and to keep obvious mistakes from
 * reaching the network. It is **not** a security control: the same rules must be
 * enforced server-side once registration exists (blueprint §10.2).
 */

export type FieldErrors<T extends string> = Partial<Record<T, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/

/* ------------------------------------------------------------------ sign up */

export interface SignUpValues {
  fullName: string
  email: string
  username: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
}

export type SignUpField = keyof SignUpValues

export interface PasswordRule {
  readonly id: string
  readonly label: string
  readonly met: boolean
}

/** Rules are shown live so the requirement is never a surprise on submit. */
export function evaluatePasswordRules(password: string): readonly PasswordRule[] {
  return [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'case', label: 'Upper and lower case', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: 'number', label: 'At least one number', met: /\d/.test(password) },
    {
      id: 'symbol',
      label: 'A symbol (optional but recommended)',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ]
}

/** The rules that must pass for submission. The symbol rule is advisory. */
export function isPasswordAcceptable(password: string): boolean {
  return evaluatePasswordRules(password)
    .filter((rule) => rule.id !== 'symbol')
    .every((rule) => rule.met)
}

export function validateSignUp(values: SignUpValues): FieldErrors<SignUpField> {
  const errors: FieldErrors<SignUpField> = {}

  if (!values.fullName.trim()) errors.fullName = 'Enter your full name.'
  else if (values.fullName.trim().length < 2) errors.fullName = 'That name looks too short.'

  if (!values.email.trim()) errors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address, for example name@example.com.'
  }

  if (!values.username.trim()) errors.username = 'Choose a username.'
  else if (!USERNAME_PATTERN.test(values.username.trim().toLowerCase())) {
    errors.username = 'Use 3–24 characters: lowercase letters, numbers, dots or underscores.'
  }

  if (!values.password) errors.password = 'Choose a password.'
  else if (!isPasswordAcceptable(values.password)) {
    errors.password = 'Your password does not meet the requirements below.'
  }

  if (!values.confirmPassword) errors.confirmPassword = 'Re-enter your password.'
  else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'The passwords do not match.'
  }

  if (!values.acceptedTerms) {
    errors.acceptedTerms = 'You need to accept the terms and privacy notice to continue.'
  }

  return errors
}

/* -------------------------------------------------------------------- login */

export interface LoginValues {
  identifier: string
  password: string
}

export type LoginField = keyof LoginValues

export function validateLogin(values: LoginValues): FieldErrors<LoginField> {
  const errors: FieldErrors<LoginField> = {}

  if (!values.identifier.trim()) {
    errors.identifier = 'Enter your email or username.'
  } else if (values.identifier.includes('@') && !EMAIL_PATTERN.test(values.identifier.trim())) {
    errors.identifier = 'That email address does not look valid.'
  }

  if (!values.password) errors.password = 'Enter your password.'

  return errors
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0
}
