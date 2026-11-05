// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildHealthReport } from './handler.js'

/**
 * The deployed configuration, expressed as a test.
 *
 * The project publishes ES256 keys and sets no `SUPABASE_JWT_SECRET`. Under the
 * previous code that combination reported "cannot authenticate" and refused
 * every token. This asserts the same configuration now resolves to a working
 * scheme, so the regression cannot come back without a red test.
 */
const URL = 'https://bxifjhhgmomiacehngyj.supabase.co'

describe('the live deployment configuration', () => {
  it('resolves to es256 and reports ok', () => {
    const report = buildHealthReport({
      config: { supabaseUrl: URL, supabaseAnonKey: 'anon', supabaseJwtSecret: null },
      jwks: { reachable: true, keyCount: 2, algorithms: ['ES256'] },
    })

    expect(report.scheme).toBe('es256')
    expect(report.status).toBe('ok')
    expect(report.issuer).toBe(`${URL}/auth/v1`)
  })

  it('would have reported down under the old requirement', () => {
    // `canAuthenticate` used to be `jwtSecret !== null`, which is false here.
    // The new implementation must not depend on the secret at all when a
    // project URL is available.
    const withoutSecret = buildHealthReport({
      config: { supabaseUrl: URL, supabaseAnonKey: 'anon', supabaseJwtSecret: null },
      jwks: { reachable: true, keyCount: 2, algorithms: ['ES256'] },
    })
    expect(withoutSecret.status).not.toBe('down')
    expect(withoutSecret.checks.jwt_secret).toBe(false)
  })
})
