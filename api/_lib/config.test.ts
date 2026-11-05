// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'

import {
  readServerConfig,
  readConfigSources,
  projectUrlFromAnonKey,
} from './config.js'

/**
 * Server configuration, tested against the failure that reached production.
 *
 * The live deployment had `SUPABASE_JWT_SECRET` set and neither `SUPABASE_URL`
 * nor `SUPABASE_ANON_KEY`. Health reported `scheme: "hs256"` and therefore
 * `status: "ok"` — while every real request 401'd, because the project signs
 * ES256 and the JWKS URL derives from a URL that was never set.
 *
 * "Configured enough to pass a health check" and "configured enough to verify a
 * real user" were allowed to disagree. These tests pin them together.
 */

const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWZqaGhnbW9taWFjZWhuZ3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDI4NzIsImV4cCI6MjEwNDgxODg3Mn0.DL9625gL9d3gKOhYBeIlkaWCiUMpUr6glFjMaOaiWw0'

const ENV_NAMES = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'PUBLIC_SUPABASE_URL',
  'PUBLIC_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const

function encodePayload(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function clearEnv(): void {
  for (const name of ENV_NAMES) delete process.env[name]
}

afterEach(clearEnv)

describe('projectUrlFromAnonKey', () => {
  it('derives the project URL from the real anon key’s `ref` claim', () => {
    // This is the live key. Its `ref` is `bxifjhhgmomiacehngyj`, so the URL is
    // recoverable even when SUPABASE_URL was never configured.
    expect(projectUrlFromAnonKey(ANON_KEY)).toBe(
      'https://bxifjhhgmomiacehngyj.supabase.co',
    )
  })

  it('returns null for a value that is not a JWT', () => {
    expect(projectUrlFromAnonKey('sb_publishable_abc123')).toBeNull()
    expect(projectUrlFromAnonKey('')).toBeNull()
    expect(projectUrlFromAnonKey('a.b')).toBeNull()
  })

  it('returns null when the payload has no usable ref', () => {
    const token = `h.${encodePayload({ role: 'anon' })}.s`
    expect(projectUrlFromAnonKey(token)).toBeNull()

    // A ref containing characters that cannot appear in a project reference is
    // rejected rather than interpolated into a URL.
    const bad = `h.${encodePayload({ ref: '../../evil.example.com' })}.s`
    expect(projectUrlFromAnonKey(bad)).toBeNull()
  })
})

describe('readServerConfig', () => {
  it('reproduces the live deployment: secret only, no URL, no key', () => {
    process.env['SUPABASE_JWT_SECRET'] = 'some-legacy-secret'

    const config = readServerConfig()
    expect(config.supabaseUrl).toBeNull()
    expect(config.supabaseAnonKey).toBeNull()
    expect(config.supabaseJwtSecret).toBe('some-legacy-secret')

    // The URL staying null is what made ES256 verification impossible. This
    // assertion is the guard: if a future change starts inventing a URL here,
    // it must be a real one.
    expect(config.supabaseUrl).toBeNull()
  })

  it('derives the project URL when only the anon key is configured', () => {
    process.env['SUPABASE_ANON_KEY'] = ANON_KEY

    const config = readServerConfig()
    expect(config.supabaseUrl).toBe('https://bxifjhhgmomiacehngyj.supabase.co')
    expect(config.supabaseAnonKey).toBe(ANON_KEY)
  })

  it('prefers an explicit URL over the derived one', () => {
    process.env['SUPABASE_ANON_KEY'] = ANON_KEY
    process.env['SUPABASE_URL'] = 'https://explicit.supabase.co'

    expect(readServerConfig().supabaseUrl).toBe('https://explicit.supabase.co')
  })

  it('accepts the common alias spellings of the same public values', () => {
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://aliased.supabase.co'
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = ANON_KEY

    const config = readServerConfig()
    expect(config.supabaseUrl).toBe('https://aliased.supabase.co')
    expect(config.supabaseAnonKey).toBe(ANON_KEY)
  })

  it('falls back to the VITE_ pair, which is what a browser-only setup has', () => {
    /*
     * The live deployment exactly: the client signs in, so the VITE_ pair is
     * configured, but the server pair never was. Every endpoint was dead —
     * including the public /languages — while the app looked fine until it made
     * its first API call.
     */
    process.env['VITE_SUPABASE_URL'] = 'https://bxifjhhgmomiacehngyj.supabase.co'
    process.env['VITE_SUPABASE_ANON_KEY'] = ANON_KEY

    const config = readServerConfig()
    expect(config.supabaseUrl).toBe('https://bxifjhhgmomiacehngyj.supabase.co')
    expect(config.supabaseAnonKey).toBe(ANON_KEY)
    expect(readConfigSources().anonKey).toBe('VITE_SUPABASE_ANON_KEY')
  })

  it('prefers the server pair over the VITE_ pair when both exist', () => {
    process.env['VITE_SUPABASE_URL'] = 'https://vite.supabase.co'
    process.env['SUPABASE_URL'] = 'https://server.supabase.co'

    expect(readServerConfig().supabaseUrl).toBe('https://server.supabase.co')
  })

  it('treats blank and whitespace-only values as unset', () => {
    process.env['SUPABASE_URL'] = '   '
    process.env['SUPABASE_ANON_KEY'] = ''
    expect(readServerConfig().supabaseUrl).toBeNull()
  })

  it('trims surrounding whitespace, which a pasted value often carries', () => {
    process.env['SUPABASE_URL'] = '  https://padded.supabase.co  '
    expect(readServerConfig().supabaseUrl).toBe('https://padded.supabase.co')
  })
})

describe('readConfigSources', () => {
  it('names the variable that supplied each value', () => {
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = ANON_KEY
    process.env['SUPABASE_JWT_SECRET'] = 'legacy'

    const sources = readConfigSources()
    expect(sources.anonKey).toBe('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    expect(sources.jwtSecret).toBe('SUPABASE_JWT_SECRET')
    // Not configured, so no name to report.
    expect(sources.projectUrl).toBeNull()
  })

  it('never returns a value, only a name', () => {
    process.env['SUPABASE_ANON_KEY'] = ANON_KEY
    const serialised = JSON.stringify(readConfigSources())
    expect(serialised).not.toContain(ANON_KEY)
  })
})
