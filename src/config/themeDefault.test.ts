/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/stores/theme'

/**
 * Theme default guards.
 *
 * The default theme is decided in two places that cannot share a module: the
 * React provider (for everything after hydration) and an inline script in
 * `index.html` (because it has to run before the bundle evaluates to avoid a
 * flash). Duplicated logic drifts, so it is asserted here rather than trusted.
 *
 * The product decision these tests protect: **light is the default**. A
 * first-time visitor gets the warm paper palette whatever their operating system
 * is set to. Dark is opt-in, and `system` remains available for anyone who wants
 * the device to decide.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const INDEX_HTML = readFileSync(join(ROOT, '../index.html'), 'utf8')

/** The inline pre-paint script, isolated from the surrounding markup. */
function prePaintScript(): string {
  const start = INDEX_HTML.indexOf(';(function ()')
  const end = INDEX_HTML.indexOf('})()', start)
  return INDEX_HTML.slice(start, end)
}

describe('default theme', () => {
  it('is light', () => {
    expect(DEFAULT_THEME).toBe('light')
  })

  it('is not decided by the operating system', () => {
    // The specific regression this guards: defaulting to 'system' meant a
    // dark-OS device saw the dark palette without ever choosing it.
    expect(DEFAULT_THEME).not.toBe('system')
  })

  it('defaults the pre-paint script to the same value', () => {
    const script = prePaintScript()
    // `stored ? JSON.parse(stored) : '<default>'`
    const fallback = /:\s*'([a-z]+)'\s*$/m.exec(script.split('var preference')[1]?.split('\n')[0] ?? '')
    expect(fallback?.[1]).toBe(DEFAULT_THEME)
  })

  it('keeps the inline script and the provider on the same storage key', () => {
    expect(prePaintScript()).toContain(`'${THEME_STORAGE_KEY}'`)
  })

  it('only honours prefers-color-scheme when the learner asked for system', () => {
    const script = prePaintScript()
    // The media query must be gated behind a 'system' comparison, never used to
    // resolve an unset preference.
    expect(script).toMatch(/preference === 'system'/)
    expect(script).toMatch(/prefers-color-scheme: dark/)
  })

  it('paints a light document when storage throws', () => {
    // Private mode and blocked storage both land in the catch branch; the
    // visitor must still get the product's default, not an unstyled page.
    expect(prePaintScript()).toMatch(/catch[\s\S]{0,400}dataset\.theme = 'light'/)
  })
})

describe('browser chrome colour', () => {
  it('starts light-only, so a dark OS does not frame the light app', () => {
    // A `theme-color` meta gated on prefers-color-scheme would paint a dark bar
    // around the default light page. The script rewrites both metas once it
    // knows the real theme.
    expect(INDEX_HTML).toMatch(/<meta name="theme-color" content="#fbfaf6" \/>/)
    expect(prePaintScript()).toMatch(/meta\[name="theme-color"\]/)
  })

  it('uses each theme’s page colour, not an approximation', () => {
    const css = readFileSync(join(ROOT, 'index.css'), 'utf8')
    const light = /--color-paper-50: (#[0-9a-f]{6});/.exec(css)?.[1]
    const darkBlock = css.slice(css.indexOf(":root[data-theme='dark']"))
    const dark = /--color-paper-50: (#[0-9a-f]{6});/.exec(darkBlock)?.[1]

    expect(light).toBeTruthy()
    expect(dark).toBeTruthy()
    expect(INDEX_HTML).toContain(light)
    expect(INDEX_HTML).toContain(dark)
  })
})
