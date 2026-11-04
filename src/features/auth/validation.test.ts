import { describe, expect, it } from 'vitest'
import {
  evaluatePasswordRules,
  hasErrors,
  isPasswordAcceptable,
  validateLogin,
  validateSignUp,
  type SignUpValues,
} from './validation'

const valid: SignUpValues = {
  fullName: 'Adaeze Okonkwo',
  email: 'adaeze@example.com',
  username: 'adaeze_x',
  password: 'Wazobia1',
  confirmPassword: 'Wazobia1',
  acceptedTerms: true,
}

describe('sign-up validation', () => {
  it('accepts a complete, valid form', () => {
    expect(validateSignUp(valid)).toEqual({})
  })

  it('requires every field', () => {
    const errors = validateSignUp({
      fullName: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    })
    expect(Object.keys(errors).toSorted()).toEqual(
      ['acceptedTerms', 'confirmPassword', 'email', 'fullName', 'password', 'username'].toSorted(),
    )
  })

  it('rejects a malformed email', () => {
    expect(validateSignUp({ ...valid, email: 'adaeze@' }).email).toMatch(/valid email/i)
    expect(validateSignUp({ ...valid, email: 'not-an-email' }).email).toMatch(/valid email/i)
  })

  it('rejects an invalid username', () => {
    expect(validateSignUp({ ...valid, username: 'ab' }).username).toBeDefined()
    expect(validateSignUp({ ...valid, username: 'has space' }).username).toBeDefined()
    expect(validateSignUp({ ...valid, username: 'bad!chars' }).username).toBeDefined()
  })

  it('normalises username case instead of rejecting typed capitals', () => {
    // The input lowercases as the user types, so validation must not punish it.
    expect(validateSignUp({ ...valid, username: 'UPPER' }).username).toBeUndefined()
  })

  it('requires a strong enough password', () => {
    expect(validateSignUp({ ...valid, password: 'short', confirmPassword: 'short' }).password).toBeDefined()
    expect(validateSignUp({ ...valid, password: 'alllowercase1', confirmPassword: 'alllowercase1' }).password).toBeDefined()
  })

  it('rejects mismatched passwords', () => {
    expect(validateSignUp({ ...valid, confirmPassword: 'Different1' }).confirmPassword).toMatch(/do not match/i)
  })

  it('requires the terms acknowledgement', () => {
    expect(validateSignUp({ ...valid, acceptedTerms: false }).acceptedTerms).toBeDefined()
  })

  it('reports password rules live', () => {
    const rules = evaluatePasswordRules('Wazobia1')
    expect(rules.find((r) => r.id === 'length')?.met).toBe(true)
    expect(rules.find((r) => r.id === 'case')?.met).toBe(true)
    expect(rules.find((r) => r.id === 'number')?.met).toBe(true)
    expect(isPasswordAcceptable('Wazobia1')).toBe(true)
    expect(isPasswordAcceptable('nope')).toBe(false)
  })

  it('treats the symbol rule as advisory only', () => {
    expect(isPasswordAcceptable('Wazobia12')).toBe(true)
    expect(evaluatePasswordRules('Wazobia12').find((r) => r.id === 'symbol')?.met).toBe(false)
  })
})

describe('login validation', () => {
  it('accepts email or username identifiers', () => {
    expect(validateLogin({ identifier: 'adaeze@example.com', password: 'x' })).toEqual({})
    expect(validateLogin({ identifier: 'adaeze_x', password: 'x' })).toEqual({})
  })

  it('requires both fields', () => {
    expect(Object.keys(validateLogin({ identifier: '', password: '' })).toSorted()).toEqual([
      'identifier',
      'password',
    ])
  })

  it('only checks email shape when the identifier contains @', () => {
    expect(validateLogin({ identifier: 'adaeze@bad', password: 'x' }).identifier).toBeDefined()
    expect(validateLogin({ identifier: 'plainusername', password: 'x' }).identifier).toBeUndefined()
  })
})

describe('hasErrors', () => {
  it('is false only for an empty error map', () => {
    expect(hasErrors({})).toBe(false)
    expect(hasErrors({ email: 'bad' })).toBe(true)
  })
})
