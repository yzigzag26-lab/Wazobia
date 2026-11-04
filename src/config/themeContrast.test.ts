import { describe, expect, it } from 'vitest'

/**
 * Dark-theme contrast guards.
 *
 * The dark palette is a second, hand-authored set of custom properties in
 * `src/index.css`. Without a test it is the kind of table that drifts back to
 * failing values after one "nicer looking" tweak — this was already caught live
 * during implementation, when `ink-400` measured 4.38:1 and white-on-`ember-600`
 * measured 3.54:1.
 *
 * These hex values are duplicated from `index.css` on purpose. If you change the
 * stylesheet, change it here too and the maths will tell you whether the change
 * is legible.
 */

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

/** Mirrors the `:root[data-theme='dark']` block in src/index.css. */
const DARK = {
  page: '#0b100d', // paper-50
  surface: '#131c18', // white / surface
  sunken: '#111815', // paper-100
  ink900: '#f2f5f3',
  ink800: '#e2e8e4',
  ink700: '#cdd6d0',
  ink600: '#aebbb3',
  ink500: '#92a099',
  ink400: '#77867e',
  forest600: '#46b76d',
  forest700: '#126b37',
  forest800: '#0a3a1e',
  forest900: '#04240f',
  forest50: '#12251a',
  ember600: '#d44508',
  ember700: '#ff8256',
  ember100: '#34180e',
  gold500: '#f5c518',
  gold100: '#2a2209',
  gold700: '#f0cb52',
  ink300: '#61706a',
  forest400: '#3d8a58',
  white: '#ffffff',
} as const

const AA_TEXT = 4.5

describe('dark theme — text legibility', () => {
  it.each([
    ['ink-900 body copy', DARK.ink900, DARK.page],
    ['ink-800 body copy', DARK.ink800, DARK.page],
    ['ink-700 secondary copy', DARK.ink700, DARK.page],
    ['ink-600 muted copy', DARK.ink600, DARK.page],
    ['ink-500 subtle copy', DARK.ink500, DARK.page],
    ['ink-400 micro copy', DARK.ink400, DARK.page],
    ['ink-900 on a raised surface', DARK.ink900, DARK.surface],
    ['ink-600 on a raised surface', DARK.ink600, DARK.surface],
    ['ink-500 on a raised surface', DARK.ink500, DARK.surface],
    ['ink-400 on a raised surface', DARK.ink400, DARK.surface],
    ['forest-600 link', DARK.forest600, DARK.page],
    ['forest-600 link on a surface', DARK.forest600, DARK.surface],
    ['ember-700 error text', DARK.ember700, DARK.page],
    ['ember-700 on ember-100', DARK.ember700, DARK.ember100],
    ['gold-700 on the page', DARK.gold700, DARK.page],
    ['gold-700 on gold-100', DARK.gold700, DARK.gold100],
    ['ink-600 on forest-50', DARK.ink600, DARK.forest50],
  ])('%s is at least 4.5:1', (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe('dark theme — non-text and decorative tokens', () => {
  // Hover borders and chevrons are not text, so WCAG's 1.4.11 threshold (3:1)
  // applies. These existed as class names before the tokens did, which meant the
  // hover border rendered as nothing at all — hence the explicit guard.
  it.each([
    ['forest-400 hover border on the page', DARK.forest400, DARK.page],
    ['forest-400 hover border on a surface', DARK.forest400, DARK.surface],
    ['ink-300 chevron on a surface', DARK.ink300, DARK.surface],
  ])('%s is at least 3:1', (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(3)
  })
})

describe('dark theme — control labels', () => {
  it('white label text passes on the forest-700 primary button', () => {
    expect(contrastRatio(DARK.white, DARK.forest700)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('white label text passes on the forest-800 hover state', () => {
    expect(contrastRatio(DARK.white, DARK.forest800)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('white label text passes on the ember-600 destructive button', () => {
    // This is the case that failed at #f2500f (3.54:1) before the palette was
    // darkened to #d44508. Keep it asserting.
    expect(contrastRatio(DARK.white, DARK.ember600)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('forest-800 and forest-900 stay dark enough to sit on gold surfaces', () => {
    expect(contrastRatio(DARK.forest800, DARK.gold500)).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrastRatio(DARK.forest900, DARK.gold500)).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe('light theme — unchanged baselines still hold', () => {
  const LIGHT = {
    page: '#fbfaf6',
    ink900: '#0d1710',
    ink600: '#41504a',
    forest700: '#0b4420',
    white: '#ffffff',
  } as const

  it('body copy remains well above AA', () => {
    expect(contrastRatio(LIGHT.ink900, LIGHT.page)).toBeGreaterThanOrEqual(10)
    expect(contrastRatio(LIGHT.ink600, LIGHT.page)).toBeGreaterThanOrEqual(4.5)
  })

  it('the light primary button still passes', () => {
    expect(contrastRatio(LIGHT.white, LIGHT.forest700)).toBeGreaterThanOrEqual(4.5)
  })
})
