// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Deployment configuration, asserted rather than assumed.
 *
 * `vercel.json` is the only file that decides whether a deep link works and
 * whether the API is reachable at all, and nothing else in the suite reads it.
 * Both rules below encode bugs that reached production:
 *
 *   1. No SPA fallback => `https://<app>/login` returned Vercel's 404 page on a
 *      hard refresh. Client-side routing hid it until someone reloaded.
 *   2. A catch-all ordered before `/api` => every endpoint would answer with
 *      `index.html`, so a 401 would become a 200 of HTML and every client
 *      parser would fail in a confusing way.
 */

interface Rewrite {
  readonly source: string
  readonly destination: string
}

const root = resolve(import.meta.dirname, '../..')

function vercelJson(): { rewrites?: Rewrite[] } {
  return JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
    rewrites?: Rewrite[]
  }
}

describe('vercel.json', () => {
  it('keeps the API passthrough as the FIRST rewrite', () => {
    const rewrites = vercelJson().rewrites ?? []
    expect(rewrites.length).toBeGreaterThan(0)
    expect(rewrites[0]?.source).toBe('/api/(.*)')
    expect(rewrites[0]?.destination).toBe('/api/$1')
  })

  it('has an SPA fallback so a deep link survives a reload', () => {
    const rewrites = vercelJson().rewrites ?? []
    const fallback = rewrites.find((rule) => rule.destination === '/index.html')

    expect(fallback).toBeDefined()
    // The fallback must be last: anything after it is unreachable.
    expect(rewrites[rewrites.length - 1]?.destination).toBe('/index.html')
  })

  it('does not let the SPA fallback swallow the API', () => {
    const rewrites = vercelJson().rewrites ?? []
    const fallback = rewrites.find((rule) => rule.destination === '/index.html')
    expect(fallback).toBeDefined()

    // A negative lookahead is the only thing standing between "SPA routes work"
    // and "every API call returns HTML". Assert it is actually there.
    expect(fallback?.source).toContain('(?!api/)')
  })
})

describe('.env.development', () => {
  const env = readFileSync(resolve(root, '.env.development'), 'utf8')

  it('configures the two public Supabase values', () => {
    // Without these, sign-in reports "not configured" on any fresh checkout —
    // the failure that made a healthy app look broken three times.
    expect(env).toMatch(/^VITE_SUPABASE_URL=https:\/\/\S+\.supabase\.co$/m)
    expect(env).toMatch(/^VITE_SUPABASE_ANON_KEY=eyJ[\w-]+\.[\w-]+\.[\w-]+$/m)
  })

  it('never contains a service-role key or other server secret', () => {
    // The anon key is public by design. A service-role key is not, and must
    // never appear in a file that reaches the browser bundle.
    expect(env).not.toMatch(/SERVICE_ROLE/)
    expect(env).not.toMatch(/SUPABASE_JWT_SECRET\s*=/)
    expect(env).not.toMatch(/GROQ_API_KEY\s*=/)
    expect(env).not.toMatch(/GEMINI_API_KEY\s*=/)
  })
})
