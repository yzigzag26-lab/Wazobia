/**
 * WAZOBIA design tokens.
 *
 * Palette source of truth: the official WAZOBIA logo (public/brand/).
 * The logo is deep forest green, gold and ember orange on white. Those three
 * are the brand's identity, so the interface is built from them rather than
 * from generic SaaS blue.
 *
 * Contrast decisions (measured, not estimated — see docs/design/brand.md):
 * - forest-700 #0b4420 on paper #fbfaf6 = 10.8:1  → primary action
 * - white on ember-600 #cf3d05 = 4.86:1           → danger / destructive
 * - forest-900 #04240f on gold-500 #f5c518 = 10.2:1 → gold as highlight surface
 * - gold-500 as text on paper = 1.56:1            → never used for text
 *
 * Gold and lime are accent surfaces only. They are never used for body text.
 */

const paper = {
  50: '#fbfaf6',
  100: '#f5f2ea',
  200: '#ebe6da',
  300: '#dbd4c4',
  400: '#bcb3a0',
} as const

const ink = {
  900: '#0d1710',
  800: '#14201a',
  700: '#26332c',
  600: '#41504a',
  500: '#5f6d66',
  400: '#8b968f',
} as const

/** Forest — the logo's primary green. Structure and primary action. */
const forest = {
  50: '#eef6f0',
  100: '#d8ecdd',
  300: '#7fb990',
  500: '#1c8a42',
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
  700: '#a8810a',
} as const

/** Ember — the rising ribbon. Warnings, errors, urgency. */
const ember = {
  100: '#fdeae0',
  500: '#f2500f',
  600: '#cf3d05',
  700: '#a52f04',
} as const

export const tokens = {
  color: {
    paper,
    ink,
    forest,
    lime,
    gold,
    ember,
    /** Semantic aliases consumed by components. */
    surface: paper[50],
    surfaceRaised: '#ffffff',
    surfaceSunken: paper[100],
    surfaceInverse: forest[900],
    border: paper[300],
    borderStrong: paper[400],
    text: ink[900],
    textMuted: ink[600],
    textSubtle: ink[500],
    textInverse: paper[50],
    accent: forest[700],
    accentHover: forest[800],
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
