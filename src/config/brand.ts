/**
 * Brand configuration — the single replacement point for brand assets.
 *
 * The official WAZOBIA logo is supplied as a full lockup (3D emblem + wordmark +
 * tagline + swoosh) on a white background. It is used exactly as supplied:
 * never redrawn, recoloured, distorted or substituted.
 *
 * Three variants are derived from the original by cropping only — no editing:
 *   wazobia-lockup.png   full lockup, for the landing hero and auth panels
 *   wazobia-mark.png     emblem only, for navigation, favicons and tight spaces
 *   wazobia-wordmark.png wordmark only, used where the emblem is already present
 *
 * The source asset is `public/brand/wazobia-source.png`. To install a future
 * revision of the logo, replace those files — no component changes are needed.
 *
 * Note on transparency: the artwork is raster with a baked white background, so
 * surfaces that host the logo are kept light. A transparent-background SVG is
 * the recommended next brand deliverable (blueprint §5.3).
 */

export interface BrandConfig {
  readonly name: string
  readonly positioning: string
  readonly promise: string
  readonly descriptor: string
  /** Full lockup: emblem + wordmark + tagline. */
  readonly lockupSrc: string
  readonly lockupWebp: string
  /** Emblem only. */
  readonly markSrc: string
  readonly markWebp: string
  /** Transparent-background emblem. Used for all navigation/corner logos. */
  readonly emblemSrc: string
  readonly emblemWebp: string
  readonly wordmarkWebp: string
  /** Wordmark only. */
  readonly wordmarkSrc: string
  readonly markAlt: string
  /** Intrinsic dimensions, so layouts reserve the right space and never shift. */
  readonly lockup: { readonly width: number; readonly height: number }
  readonly mark: { readonly width: number; readonly height: number }
  readonly emblem: { readonly width: number; readonly height: number }
  readonly wordmark: { readonly width: number; readonly height: number }
  /** Brand colours, sourced from the logo. */
  readonly colors: {
    readonly forest: string
    readonly gold: string
    readonly ember: string
    readonly lime: string
  }
}

export const brand: BrandConfig = {
  name: 'WAZOBIA',
  positioning: 'The African Language Ecosystem',
  promise: 'Learn. Speak. Understand. Preserve.',
  descriptor: 'Yorùbá · Hausa · Igbo',
  lockupSrc: '/brand/wazobia-lockup.png',
  lockupWebp: '/brand/wazobia-lockup.webp',
  markSrc: '/brand/wazobia-mark.png',
  markWebp: '/brand/wazobia-mark.webp',
  emblemSrc: '/brand/wazobia-emblem.png',
  emblemWebp: '/brand/wazobia-emblem.webp',
  wordmarkSrc: '/brand/wazobia-wordmark.png',
  wordmarkWebp: '/brand/wazobia-wordmark.webp',
  markAlt: 'WAZOBIA — The African Language Ecosystem',
  lockup: { width: 1000, height: 715 },
  mark: { width: 512, height: 408 },
  emblem: { width: 512, height: 421 },
  wordmark: { width: 900, height: 142 },
  colors: {
    forest: '#073116',
    gold: '#f5c518',
    ember: '#cf3d05',
    lime: '#8ed13a',
  },
}
