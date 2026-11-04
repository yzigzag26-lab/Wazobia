/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Contrast guards — every foreground/background pair the interface actually uses,
 * in BOTH themes.
 *
 * This file used to carry a hand-copied table of ~26 hex values. It was green
 * while the app was unusable in dark mode: `text-forest-800` — a label colour at
 * 44 call sites — measured 1.36:1 against the dark card surface, and `text-white`
 * on the primary button measured 2.64:1 because `--color-white` is re-pointed at
 * the near-black *surface* in dark mode. A test built from the tokens someone
 * remembered to list cannot catch a token that silently does two jobs.
 *
 * So it now reads the stylesheet itself and measures the pairs the components
 * really render. Two design rules follow from the failures that were found:
 *
 *  1. `forest-*` is TEXT/ICON colour and inverts to bright green in dark mode.
 *     `brand-*` is GROUND under white type and stays dark in both themes.
 *  2. `white` is the raised card surface and flips; `on-brand` is literal white
 *     and never flips.
 *
 * If a future edit collapses either pair of ramps back into one, these tests
 * fail with the measured ratio.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CSS = readFileSync(join(ROOT, 'index.css'), 'utf8')

/** Extract the `--color-*` custom properties from a braced CSS block. */
function blockTokens(source: string, marker: string): Record<string, string> {
  const start = source.indexOf(marker)
  if (start === -1) throw new Error(`Could not find ${marker} in index.css`)
  let depth = 0
  let end = source.length
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  const slice = source.slice(start, end)
  const found: Record<string, string> = {}
  for (const match of slice.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    const [, name, hex] = match
    if (name && hex) found[name] = hex
  }
  return found
}

/** Light palette, from the `@theme` block. */
const LIGHT = blockTokens(CSS, '@theme {')
/** Dark palette: light values with the `:root[data-theme='dark']` block on top. */
const DARK: Record<string, string> = {
  ...LIGHT,
  ...blockTokens(CSS, ":root[data-theme='dark'] {"),
}

function channel(value: number): number {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.1 contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** AA for body text. */
const AA_TEXT = 4.5
/** WCAG 1.4.11 for non-text UI: borders, rings, indicator fills. */
const AA_NON_TEXT = 3

/** Split a `#rrggbb` string into its three 0–255 channels. */
function channels(hex: string): number[] {
  const clean = hex.replace('#', '')
  return [0, 2, 4].map((i) => Number.parseInt(clean.slice(i, i + 2), 16))
}

/**
 * Alpha-composite `hex` at `alpha` over an opaque `background` and return the
 * resulting `#rrggbb`. Used for the `text-on-brand/60`-style utilities, which
 * Tailwind compiles to a literal `#ffffffNN` instead of a custom property — so
 * nothing else in this file can see them.
 */
function composite(hex: string, alpha: number, background: string): string {
  const fg = channels(hex)
  const bg = channels(background)
  return `#${fg
    .map((c, i) => Math.round(c * alpha + bg[i]! * (1 - alpha)))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`
}

type Pair = readonly [label: string, foreground: string, background: string]

/**
 * Text-on-surface pairs. Every combination below corresponds to a class that
 * exists in `src/` — `text-<fg>` on a surface painted `bg-<bg>`. The list is
 * grouped by the token that was wrong in the audit that produced it.
 */
const TEXT_PAIRS: readonly Pair[] = [
  // ink on the page, cards, and tinted panels
  ['ink-900 on paper-50', 'ink-900', 'paper-50'],
  ['ink-900 on white', 'ink-900', 'white'],
  ['ink-900 on paper-100', 'ink-900', 'paper-100'],
  ['ink-900 on forest-50', 'ink-900', 'forest-50'],
  ['ink-800 on white', 'ink-800', 'white'],
  ['ink-800 on forest-50', 'ink-800', 'forest-50'],
  ['ink-700 on white', 'ink-700', 'white'],
  ['ink-700 on paper-50', 'ink-700', 'paper-50'],
  ['ink-700 on paper-200', 'ink-700', 'paper-200'],
  ['ink-700 on forest-50', 'ink-700', 'forest-50'],
  ['ink-700 on gold-100', 'ink-700', 'gold-100'],
  ['ink-600 on white', 'ink-600', 'white'],
  ['ink-600 on paper-50', 'ink-600', 'paper-50'],
  ['ink-600 on paper-100', 'ink-600', 'paper-100'],
  ['ink-600 on forest-50', 'ink-600', 'forest-50'],
  ['ink-600 on gold-100', 'ink-600', 'gold-100'],
  ['ink-500 on paper-50', 'ink-500', 'paper-50'],
  ['ink-500 on white', 'ink-500', 'white'],
  ['ink-500 on paper-100', 'ink-500', 'paper-100'],
  ['ink-500 on forest-50', 'ink-500', 'forest-50'],
  ['ink-500 on forest-100', 'ink-500', 'forest-100'],
  ['ink-500 on gold-100', 'ink-500', 'gold-100'],
  ['ink-400 on paper-50', 'ink-400', 'paper-50'],
  ['ink-400 on white', 'ink-400', 'white'],
  ['ink-400 on paper-100', 'ink-400', 'paper-100'],
  ['ink-400 on forest-50', 'ink-400', 'forest-50'],
  ['ink-400 on forest-100', 'ink-400', 'forest-100'],
  ['ink-400 on gold-100', 'ink-400', 'gold-100'],

  // forest used as TEXT — the 80+ `text-forest-*` call sites
  ['forest-600 on white', 'forest-600', 'white'],
  ['forest-600 on paper-50', 'forest-600', 'paper-50'],
  ['forest-600 on paper-100', 'forest-600', 'paper-100'],
  ['forest-700 on white', 'forest-700', 'white'],
  ['forest-700 on paper-50', 'forest-700', 'paper-50'],
  ['forest-700 on paper-100', 'forest-700', 'paper-100'],
  ['forest-700 on forest-50', 'forest-700', 'forest-50'],
  ['forest-700 on forest-100', 'forest-700', 'forest-100'],
  ['forest-700 on gold-100', 'forest-700', 'gold-100'],
  ['forest-800 on white', 'forest-800', 'white'],
  ['forest-800 on paper-50', 'forest-800', 'paper-50'],
  ['forest-800 on paper-100', 'forest-800', 'paper-100'],
  ['forest-800 on forest-50', 'forest-800', 'forest-50'],
  ['forest-800 on forest-100', 'forest-800', 'forest-100'],
  ['forest-800 on gold-100', 'forest-800', 'gold-100'],
  ['forest-900 on white', 'forest-900', 'white'],
  ['forest-900 on paper-50', 'forest-900', 'paper-50'],
  ['forest-900 on paper-200', 'forest-900', 'paper-200'],
  ['forest-900 on forest-100', 'forest-900', 'forest-100'],
  ['forest-900 on gold-100', 'forest-900', 'gold-100'],

  // gold and ember as text
  ['gold-700 on white', 'gold-700', 'white'],
  ['gold-700 on paper-50', 'gold-700', 'paper-50'],
  ['gold-700 on paper-100', 'gold-700', 'paper-100'],
  ['gold-700 on gold-100', 'gold-700', 'gold-100'],
  ['gold-700 on forest-100', 'gold-700', 'forest-100'],
  ['ember-700 on white', 'ember-700', 'white'],
  ['ember-700 on paper-50', 'ember-700', 'paper-50'],
  ['ember-700 on ember-100', 'ember-700', 'ember-100'],

  // white type on a brand ground — buttons, banners, the auth panel
  ['on-brand on brand-600', 'on-brand', 'brand-600'],
  ['on-brand on brand-700', 'on-brand', 'brand-700'],
  ['on-brand on brand-800', 'on-brand', 'brand-800'],
  ['on-brand on brand-900', 'on-brand', 'brand-900'],
  ['on-brand on ember-600', 'on-brand', 'ember-600'],
  ['on-brand on ember-800', 'on-brand', 'ember-800'],
  ['gold-500 on brand-900', 'gold-500', 'brand-900'],
]

/**
 * Non-text pairs: control boundaries, focus rings and indicator fills. These
 * must clear 3:1 against the surface they are drawn on, but they are not type,
 * so the 4.5:1 threshold does not apply.
 */
const NON_TEXT_PAIRS: readonly Pair[] = [
  ['paper-400 input border on white', 'paper-400', 'white'],
  ['paper-400 input border on paper-50', 'paper-400', 'paper-50'],
  ['paper-400 input border on paper-100', 'paper-400', 'paper-100'],
  ['ink-300 chevron on paper-50', 'ink-300', 'paper-50'],
  ['ink-300 chevron on white', 'ink-300', 'white'],
  ['ink-300 chevron on paper-100', 'ink-300', 'paper-100'],
  ['forest-600 focus border on white', 'forest-600', 'white'],
  ['forest-600 focus border on paper-50', 'forest-600', 'paper-50'],
  ['forest-400 hover border on white', 'forest-400', 'white'],
  ['forest-400 hover border on paper-50', 'forest-400', 'paper-50'],
  ['forest-400 hover border on paper-300', 'forest-400', 'paper-300'],
  ['forest-400 hover border on forest-50', 'forest-400', 'forest-50'],
  ['forest-500 selected border on forest-50', 'forest-500', 'forest-50'],
  ['forest-500 selected border on forest-100', 'forest-500', 'forest-100'],
  ['forest-300 read-aloud ring on forest-50', 'forest-300', 'forest-50'],
  ['forest-300 read-aloud border on forest-100', 'forest-300', 'forest-100'],
  ['forest-300 ring on white', 'forest-300', 'white'],
  ['forest-700 progress fill on paper-200', 'forest-700', 'paper-200'],
  ['forest-700 progress fill on paper-50', 'forest-700', 'paper-50'],
  ['forest-700 progress fill on white', 'forest-700', 'white'],
  ['forest-700 progress fill on paper-100', 'forest-700', 'paper-100'],
  ['forest-500 current-step marker on paper-300', 'forest-500', 'paper-300'],
  ['brand-700 nav marker on paper-50', 'brand-700', 'paper-50'],
  ['brand-700 nav marker on white', 'brand-700', 'white'],
  ['brand-700 nav marker on forest-50', 'brand-700', 'forest-50'],
  ['brand-600 tick fill on white', 'brand-600', 'white'],
  ['ember-600 invalid border on white', 'ember-600', 'white'],
  ['ember-600 invalid border on paper-50', 'ember-600', 'paper-50'],
]

/** Resolve a token name to its hex value, failing loudly on a typo. */
function resolveToken(palette: Record<string, string>, token: string, theme: string): string {
  const value = palette[token]
  if (!value) throw new Error(`Token "${token}" is not defined in the ${theme} palette`)
  return value
}

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
] as const)('%s theme — text legibility', (themeName, palette) => {
  it.each(TEXT_PAIRS)('%s is at least 4.5:1', (label, foreground, background) => {
    const ratio = contrastRatio(
      resolveToken(palette, foreground, themeName),
      resolveToken(palette, background, themeName),
    )
    expect(
      ratio,
      `${themeName}: ${label} measured ${ratio.toFixed(2)}:1, below AA (4.5:1)`,
    ).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
] as const)('%s theme — non-text and decorative tokens', (themeName, palette) => {
  it.each(NON_TEXT_PAIRS)('%s is at least 3:1', (label, foreground, background) => {
    const ratio = contrastRatio(
      resolveToken(palette, foreground, themeName),
      resolveToken(palette, background, themeName),
    )
    expect(
      ratio,
      `${themeName}: ${label} measured ${ratio.toFixed(2)}:1, below 3:1`,
    ).toBeGreaterThanOrEqual(AA_NON_TEXT)
  })
})

describe('theme ramps keep their two jobs apart', () => {
  // These four assertions are the structural reason the contrast table above
  // can pass at all. A single ramp cannot be both a dark ground under white
  // type and a light text colour in dark mode, so the split is asserted
  // directly rather than inferred from a ratio.
  it('dark forest text steps get lighter as the step number rises', () => {
    const steps = ['forest-600', 'forest-700', 'forest-800', 'forest-900'] as const
    const luminances = steps.map((step) => luminance(resolveToken(DARK, step, 'dark')))
    for (let i = 1; i < luminances.length; i += 1) {
      expect(
        luminances[i]!,
        `${steps[i]} should be lighter than ${steps[i - 1]} in dark mode`,
      ).toBeGreaterThan(luminances[i - 1]!)
    }
  })

  it('dark brand grounds stay dark enough for white label text', () => {
    for (const step of ['brand-600', 'brand-700', 'brand-800', 'brand-900'] as const) {
      const ratio = contrastRatio(DARK['on-brand']!, DARK[step]!)
      expect(ratio, `white on ${step} measured ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        AA_TEXT,
      )
    }
  })

  it('forest text stays dark in light mode and light in dark mode', () => {
    for (const step of ['forest-600', 'forest-700', 'forest-800', 'forest-900'] as const) {
      expect(
        luminance(LIGHT[step]!),
        `${step} must be dark in the light theme`,
      ).toBeLessThan(0.2)
      expect(
        luminance(DARK[step]!),
        `${step} must be light in the dark theme`,
      ).toBeGreaterThan(0.2)
    }
  })

  it('the raised surface flips while literal white does not', () => {
    expect(LIGHT.white).toBe('#ffffff')
    expect(DARK.white).not.toBe('#ffffff')
    expect(LIGHT['on-brand']).toBe('#ffffff')
    expect(DARK['on-brand']).toBe('#ffffff')
  })

  it('every token used by a pair is defined in both themes', () => {
    const used = new Set<string>()
    for (const [, foreground, background] of [...TEXT_PAIRS, ...NON_TEXT_PAIRS]) {
      used.add(foreground)
      used.add(background)
    }
    const missing: string[] = []
    for (const token of used) {
      if (!LIGHT[token]) missing.push(`${token} (light)`)
      if (!DARK[token]) missing.push(`${token} (dark)`)
    }
    expect(missing).toEqual([])
  })
})

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
] as const)('%s theme — translucent white on brand panels', (themeName, palette) => {
  /*
   * The HowItWorks and auth panels put body copy on `bg-brand-900` using white
   * at 60–85% opacity. Those compile to a literal `#ffffffNN` rather than a
   * custom property, so they were invisible to every token-based guard and had
   * to be composited by hand to be measured at all.
   */

  it.each([
    ['60% white caption', 0.6],
    ['75% white body', 0.75],
    ['80% white body', 0.8],
    ['85% white intro', 0.85],
  ])('%s on a brand-900 panel is at least 4.5:1', (label, alpha) => {
    const panel = resolveToken(palette, 'brand-900', themeName)
    const rendered = composite(resolveToken(palette, 'on-brand', themeName), alpha, panel)
    const ratio = contrastRatio(rendered, panel)
    expect(ratio, `${themeName}: ${label} measured ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      AA_TEXT,
    )
  })
})

describe('tokens.ts stays in step with the stylesheet', () => {
  // `src/config/tokens.ts` is documentation-only, which is exactly why it went
  // stale: nothing imported it, so nothing failed when the palette moved. It is
  // now parsed and compared against `index.css` so the docs cannot lie.
  it('mirrors every light-mode token value', () => {
    const tokensSource = readFileSync(join(ROOT, 'config/tokens.ts'), 'utf8')
    const mismatches: string[] = []

    // Each `const <ramp> = { <step>: '<hex>', ... }` block in tokens.ts.
    for (const block of tokensSource.matchAll(/const (paper|ink|forest|brand|lime|gold|ember) = \{([^}]*)\}/g)) {
      const [, ramp, body] = block
      if (!ramp || !body) continue
      for (const entry of body.matchAll(/(\d+):\s*'(#[0-9a-fA-F]{6})'/g)) {
        const [, step, hex] = entry
        if (!step || !hex) continue
        const cssValue = LIGHT[`${ramp}-${step}`]
        if (!cssValue) {
          mismatches.push(`${ramp}-${step} is documented but not defined in index.css`)
        } else if (cssValue.toLowerCase() !== hex.toLowerCase()) {
          mismatches.push(`${ramp}-${step}: tokens.ts ${hex} vs index.css ${cssValue}`)
        }
      }
    }
    expect(
      mismatches,
      `tokens.ts has drifted from index.css:\n${mismatches.join('\n')}`,
    ).toEqual([])
  })
})
