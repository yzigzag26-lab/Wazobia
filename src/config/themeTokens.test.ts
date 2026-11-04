/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Theme token coverage guards.
 *
 * Two defects were found by inspection during this build, and both were
 * invisible to TypeScript, to the linter and to any rendering test:
 *
 *  1. `border-forest-400` / `text-ink-300` were used as hover states but neither
 *     token existed, so Tailwind emitted no rule and the hover border simply
 *     never appeared.
 *  2. A translucent background modifier on a themed colour compiles to a
 *     literal hex, bypassing the custom property — so those surfaces stayed
 *     pale in dark mode. (The exact class names are deliberately not written
 *     here: Tailwind scans comments too and would re-emit the rules.)
 *
 * These tests read the stylesheet and the source tree directly and fail on both
 * patterns, which is the only way to catch them before a human notices a border
 * that does not light up.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CSS = readFileSync(join(ROOT, 'index.css'), 'utf8')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx?|jsx?)$/.test(full) && !/\.test\./.test(full)) out.push(full)
  }
  return out
}

const SOURCE_FILES = walk(join(ROOT))

/** Tokens available in light mode, from the `@theme` block. */
function lightTokens(): Set<string> {
  const block = CSS.slice(CSS.indexOf('@theme'), CSS.indexOf(':root[data-theme'))
  return new Set(
    [...block.matchAll(/--color-([a-z]+-\d+):/g)].map((match) => match[1] ?? '').filter(Boolean),
  )
}

/** Tokens overridden for dark mode — the palette block, before the `.on-brand` pin. */
function darkTokens(): Set<string> {
  const start = CSS.indexOf(":root[data-theme='dark'] {")
  const end = CSS.indexOf('}', CSS.indexOf('--color-lime-500', start))
  const block = CSS.slice(start, end)
  return new Set(
    [...block.matchAll(/--color-([a-z]+-\d+):/g)].map((match) => match[1] ?? '').filter(Boolean),
  )
}

const UTILITY = /(?:^|[\s"'`:])(?:bg|text|border|ring|from|to|via|divide|outline|decoration|accent|shadow)-([a-z]+-\d{2,3})(?:[\s"'`/]|$)/g

function usedTokens(): Map<string, string[]> {
  const found = new Map<string, string[]>()
  for (const file of SOURCE_FILES) {
    const content = readFileSync(file, 'utf8')
    for (const match of content.matchAll(UTILITY)) {
      const token = match[1]
      if (!token) continue
      const existing = found.get(token) ?? []
      existing.push(file.replace(ROOT, ''))
      found.set(token, existing)
    }
  }
  return found
}

describe('theme tokens', () => {
  it('defines every colour token the source uses', () => {
    const light = lightTokens()
    const missing: string[] = []

    for (const [token, files] of usedTokens()) {
      // `white` and `transparent` carry no numeric step and are handled by
      // Tailwind itself, so the pattern above cannot match them.
      if (!light.has(token)) missing.push(`${token} (${[...new Set(files)].join(', ')})`)
    }

    expect(missing, `Undefined colour tokens would compile to no rule at all:\n${missing.join('\n')}`).toEqual([])
  })

  it('overrides every used colour token in dark mode', () => {
    const dark = darkTokens()
    const notThemed = [...usedTokens().keys()].filter((token) => !dark.has(token))
    expect(
      notThemed,
      `These tokens have no dark-theme value, so they keep their light colour:\n${notThemed.join('\n')}`,
    ).toEqual([])
  })

  it('never uses an opacity modifier on a themed colour', () => {
    // `/70` on a custom-property colour compiles to a literal hex and silently
    // ignores the theme. Use `color-mix(in oklab, var(--color-x) N%, transparent)`
    // or a solid token instead.
    const offenders: string[] = []
    for (const file of SOURCE_FILES) {
      const content = readFileSync(file, 'utf8')
      for (const match of content.matchAll(
        /(?:bg|text|border|ring|divide|from|to|via)-(?:paper|ink|forest|gold|ember|lime|white)-\d{2,3}\/\d{1,3}/g,
      )) {
        offenders.push(`${file.replace(ROOT, '')}: ${match[0]}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('does not name an offending utility in prose either', () => {
    // Tailwind's scanner reads class-shaped strings out of comments and docs, so
    // documenting the bad pattern re-emits the bad rule. This cost a debug cycle
    // during the build; the guard makes it permanent.
    const prose = readFileSync(join(ROOT, 'layouts/MarketingLayout.tsx'), 'utf8')
    expect(prose).not.toMatch(/50\/9[0-9]/)
  })

  it('does not hard-code a light surface inside the dark block', () => {
    const start = CSS.indexOf(":root[data-theme='dark']")
    const block = CSS.slice(start, CSS.indexOf('--wz-shadow-color', start))
    // Pure white is allowed only for `.on-brand`, which is handled outside this
    // slice; inside the theme block a `#fff` value would be a light surface.
    expect(block).not.toMatch(/--color-paper-[0-9]+:\s*#f/i)
  })
})
