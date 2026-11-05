// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { buildHealthReport, createHealthHandler, resolveScheme, probeJwks } from './handler.js'
import type { ServerConfig } from '../config.js'

/**
 * The health endpoint exists because diagnosing a broken deployment required a
 * human reading a browser console. These tests pin the judgement calls:
 *
 *   * an HMAC secret on an ES256 project is DEGRADED, not ok — it will reject
 *     every real token, which is the exact bug this endpoint was built to expose
 *   * an unreachable key set is distinguished from an unconfigured one, because
 *     one is transient and the other needs a human
 *   * nothing secret ever appears in the response
 */

const URL = 'https://bxifjhhgmomiacehngyj.supabase.co'

function config(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    supabaseUrl: URL,
    supabaseAnonKey: 'anon-key',
    supabaseJwtSecret: null,
    ...overrides,
  }
}

const jwksOk = { reachable: true, keyCount: 2, algorithms: ['ES256'] }
const jwksDown = { reachable: false, keyCount: 0, algorithms: [] as string[] }

describe('resolveScheme', () => {
  it('reports es256 when only the key set is available', () => {
    expect(resolveScheme({ hasSecret: false, jwks: 'ok' })).toBe('es256')
  })

  it('reports hs256 when only a shared secret is configured', () => {
    expect(resolveScheme({ hasSecret: true, jwks: 'unreachable' })).toBe('hs256')
  })

  it('reports mixed when both schemes are usable', () => {
    expect(resolveScheme({ hasSecret: true, jwks: 'ok' })).toBe('mixed')
  })

  it('distinguishes an unconfigured deployment from an unreachable one', () => {
    expect(resolveScheme({ hasSecret: false, jwks: 'not_checked' })).toBe('none')
    expect(resolveScheme({ hasSecret: false, jwks: 'unreachable' })).toBe('unverified')
  })
})

describe('buildHealthReport', () => {
  it('is ok when the project key set is reachable', () => {
    const report = buildHealthReport({ config: config(), jwks: jwksOk })

    expect(report.status).toBe('ok')
    expect(report.scheme).toBe('es256')
    expect(report.checks.jwks).toBe('ok')
    expect(report.checks.jwks_key_count).toBe(2)
    expect(report.summary).toContain('2 published keys')
  })

  it('is down when nothing can verify a token', () => {
    const report = buildHealthReport({
      config: { supabaseUrl: null, supabaseAnonKey: null, supabaseJwtSecret: null },
      jwks: { reachable: false, keyCount: 0, algorithms: [] },
    })

    expect(report.status).toBe('down')
    expect(report.scheme).toBe('none')
    expect(report.checks.jwks).toBe('not_checked')
  })

  it('is degraded when the key set cannot be fetched', () => {
    const report = buildHealthReport({ config: config(), jwks: jwksDown })
    expect(report.status).toBe('degraded')
    expect(report.scheme).toBe('unverified')
  })

  it('reports the issuer so a project mismatch is visible', () => {
    const report = buildHealthReport({ config: config(), jwks: jwksOk })
    expect(report.issuer).toBe(`${URL}/auth/v1`)
  })

  it('flags a URL with no anon key, because profile lookups will fail', () => {
    const report = buildHealthReport({
      config: config({ supabaseAnonKey: null }),
      jwks: jwksOk,
    })
    expect(report.status).toBe('degraded')
    expect(report.summary).toContain('anon key')
  })

  it('does NOT report ok for a secret with no project URL', () => {
    /*
     * The live outage, exactly.
     *
     * Vercel had SUPABASE_JWT_SECRET and neither SUPABASE_URL nor
     * SUPABASE_ANON_KEY. Health answered `status: "ok"`, `scheme: "hs256"`,
     * "Ready" — while every authenticated request returned 401, because the
     * project signs ES256 and the JWKS URL derives from a URL that was never
     * set. Both statements were "consistent" only because nothing checked.
     */
    const report = buildHealthReport({
      config: {
        supabaseUrl: null,
        supabaseAnonKey: null,
        supabaseJwtSecret: 'the-legacy-secret',
      },
      jwks: { reachable: false, keyCount: 0, algorithms: [] },
    })

    expect(report.status).not.toBe('ok')
    expect(report.status).toBe('degraded')
    expect(report.summary).not.toContain('Ready')
    // The fix must be stated, not implied.
    expect(report.problems.join(' ')).toContain('SUPABASE_URL')
    expect(report.problems.join(' ')).toContain('ES256')
  })

  it('reports ok for a secret only when a project URL confirms the scheme', () => {
    const report = buildHealthReport({
      config: config({ supabaseJwtSecret: 'the-legacy-secret' }),
      jwks: jwksDown,
    })
    // A URL is present but the JWKS is not, so HS256 may legitimately be right.
    expect(report.status).toBe('ok')
    expect(report.scheme).toBe('hs256')
    expect(report.problems).toHaveLength(0)
  })

  it('lists what to fix, as data rather than prose', () => {
    const report = buildHealthReport({
      config: { supabaseUrl: null, supabaseAnonKey: null, supabaseJwtSecret: null },
      jwks: { reachable: false, keyCount: 0, algorithms: [] },
    })
    expect(report.problems.length).toBeGreaterThan(0)
    expect(report.problems.some((p) => p.includes('SUPABASE_URL'))).toBe(true)
    expect(report.problems.some((p) => p.includes('SUPABASE_ANON_KEY'))).toBe(true)
  })

  it('names which environment variable supplied each value', () => {
    const report = buildHealthReport({
      config: config(),
      jwks: jwksOk,
      sources: { projectUrl: 'SUPABASE_URL', anonKey: 'SUPABASE_ANON_KEY', jwtSecret: null },
    })
    expect(report.resolved_from.project_url).toBe('SUPABASE_URL')
    expect(report.resolved_from.anon_key).toBe('SUPABASE_ANON_KEY')
  })

  it('never leaks a secret, key, or token', () => {
    const report = buildHealthReport({
      config: config({ supabaseJwtSecret: 'super-secret-hmac-value' }),
      jwks: jwksOk,
    })
    const serialised = JSON.stringify(report)

    expect(serialised).not.toContain('super-secret-hmac-value')
    // Booleans and counts only — never key material.
    expect(report.checks.jwt_secret).toBe(true)
    expect(serialised).not.toContain('x":')
    expect(serialised).not.toContain('eyJ')
  })
})

function handlerWith(configOverrides: Partial<ServerConfig>, jwks: unknown) {
  return createHealthHandler({
    config: config(configOverrides),
    fetchJwks: async () => jwks as { reachable: boolean; keyCount: number; algorithms: string[] },
    version: 'abc123',
  })
}

describe('createHealthHandler', () => {
  it('answers 200 with a success envelope', async () => {
    const response = await handlerWith({}, jwksOk)({ requestIdHeader: null })
    expect(response.status).toBe(200)

    const body = response.body as { success: boolean; data: { status: string } }
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
  })

  it('is never cached', async () => {
    const response = await handlerWith({}, jwksOk)({ requestIdHeader: null })
    // A stale `ok` is worse than no report at all.
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('still answers 200 when degraded, so the reason is readable', async () => {
    const response = await handlerWith({}, jwksDown)({ requestIdHeader: null })
    expect(response.status).toBe(200)

    const body = response.body as { data: { status: string; summary: string } }
    expect(body.data.status).toBe('degraded')
    expect(body.data.summary).toContain('could not be fetched')
  })

  it('reports the build version, so a stale tab is identifiable', async () => {
    const response = await handlerWith({}, jwksOk)({ requestIdHeader: null })
    const body = response.body as { data: { version: string } }
    expect(body.data.version).toBe('abc123')
  })

  it('does not probe the key set when no project URL is configured', async () => {
    let probed = false
    const handle = createHealthHandler({
      config: { supabaseUrl: null, supabaseAnonKey: null, supabaseJwtSecret: null },
      fetchJwks: async () => {
        probed = true
        return jwksOk
      },
    })
    await handle({ requestIdHeader: null })
    expect(probed).toBe(false)
  })
})

describe('probeJwks', () => {
  it('never touches the network for a malformed URL in tests', async () => {
    // Injected probes are the supported path in tests; this asserts the default
    // probe fails closed rather than throwing when the origin is unroutable.
    const result = await probeJwks('http://127.0.0.1:9/jwks.json')
    expect(result.reachable).toBe(false)
    expect(result.keyCount).toBe(0)
  })
})
