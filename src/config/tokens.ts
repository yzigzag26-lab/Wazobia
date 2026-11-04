/**
 * WAZOBIA design tokens.
 *
 * Palette source of truth: the official WAZOBIA logo (public/brand/).
 * The logo is deep forest green, gold and ember orange on white. Those three
 * are the brand's identity, so the interface is built from them rather than
 * from generic SaaS blue.
 *
 * TWO GREEN RAMPS, AND THEY DO OPPOSITE JOBS (see src/index.css):
 *
 * - `forest` is TEXT and ICON colour and INVERTS with the theme: dark green in
 *   light mode, bright green in dark mode. It is never a ground under white type.
 * - `brand` is the GROUND under white type and stays dark in both themes. It is
 *   never used as a text colour.
 *
 * A single ramp cannot do both. When these were one ramp, `text-forest-800` — a
 * label colour at 44 call sites — measured 1.36:1 on the dark card surface,
 * because the same token had to stay dark enough to carry white button text.
 * `themeTokens.test.ts` now fails if the two roles overlap again.
 *
 * Likewise `white` is the raised SURFACE (near-black in dark mode) while
 * `onBrand` is literal white type and never changes.
 *
 * Contrast decisions (measured — see docs/design/brand.md):
 * - white on brand-700 #0b4420 = 11.28:1            → primary action
 * - white on ember-600 #cf3d05 = 4.86:1             → danger / destructive
 * - forest-900 #04240f on gold-500 #f5c518 = 10.19:1 → gold as highlight surface
 * - gold-500 as text on paper = 1.56:1              → never used for text
 *
 * Gold and lime are accent surfaces only. They are never used for body text.
 *
 * NOTE: this file is documentation and has no runtime consumers. The values that
 * actually ship live in `src/index.css`, and `themeContrast.test.ts` measures
 * those directly so the two cannot drift apart unnoticed.
 */

const paper = {
  50: '#fbfaf6',
  100: '#f5f2ea',
  200: '#ebe6da',
  300: '#dbd4c4',
  400: '#8a8271',
} as const

const ink = {
  900: '#0d1710',
  800: '#14201a',
  700: '#26332c',
  600: '#41504a',
  500: '#5a6861',
  400: '#5f6a63',
} as const

/**
 * Forest — TEXT and ICON colour. Inverts to bright green in dark mode.
 * Never a ground under white type; use `brand` for that.
 */
const forest = {
  50: '#eef6f0',
  100: '#d8ecdd',
  300: '#418854',
  400: '#3a8352',
  500: '#177a3a',
  600: '#12622f',
  700: '#0b4420',
  800: '#073116',
  900: '#04240f',
} as const

/**
 * Brand — the GROUND ramp under white type. Stays dark in both themes.
 * Never used as a text colour; use `forest` for that.
 */
const brand = {
  600: '#12622f',
  700: '#0b4420',
  800: '#073116',
  900: '#04240f',
} as const

/** Lime — the wordmark's lit edge. Energy accents, never text. */
const lime = {
  100: '#eef7d9',
  400: '#8ed13a',
  500: '#74bd22',
} as const

/** Gold — the emblem crown and swoosh. Highlight surfaces and emphasis. */
const gold = {
  100: '#fdf4cf',
  300: '#f8dc74',
  500: '#f5c518',
  600: '#d9a908',
  700: '#7d6007',
} as const

/** Ember — the rising ribbon. Warnings, errors, urgency. */
const ember = {
  100: '#fdeae0',
  500: '#f2500f',
  600: '#cf3d05',
  700: '#a52f04',
  800: '#8a2603',
} as const

export const tokens = {
  color: {
    paper,
    ink,
    forest,
    brand,
    lime,
    gold,
    ember,
    /** Semantic aliases consumed by components. */
    surface: paper[50],
    surfaceRaised: '#ffffff',
    surfaceSunken: paper[100],
    surfaceInverse: brand[900],
    border: paper[300],
    borderStrong: paper[400],
    text: ink[900],
    textMuted: ink[600],
    textSubtle: ink[500],
    textInverse: paper[50],
    accent: brand[700],
    accentHover: brand[800],
    accentContrast: '#ffffff',
    highlight: gold[500],
    highlightContrast: forest[900],
    link: forest[700],
    focus: forest[600],
    danger: ember[600],
  },
  font: {
    sans: "'Wazobia Sans', ui-sans-serif, system-ui, sans-serif",
    serif: "'Wazobia Serif', 'Wazobia Sans', ui-serif, Georgia, serif",
  },
  radius: {
    sm: '3px',
    md: '6px',
    lg: '10px',
    button: '4px',
  },
  space: {
    gutter: 'clamp(1rem, 4vw, 2.5rem)',
    sidebarExpanded: '16.5rem',
    sidebarCollapsed: '4.25rem',
    mobileNavHeight: '3.75rem',
    topBarHeight: '3.25rem',
  },
  motion: {
    fast: '120ms',
    base: '180ms',
    slow: '320ms',
    ease: 'cubic-bezier(0.2, 0, 0.2, 1)',
  },
} as const

export type Tokens = typeof tokens
