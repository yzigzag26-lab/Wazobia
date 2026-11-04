# Brand integration

**Asset:** official WAZOBIA logo, supplied as `Wazobia_ Africa in Motion.png`.
**Rule:** used as supplied — never redrawn, recoloured, distorted or replaced.

## Variants

Derived from the original by **cropping only**, no editing:

| File | Source region | Size | Used for |
|---|---|---|---|
| `public/brand/wazobia-emblem.png` / `.webp` | emblem only, **transparent background** | 512×421 | **every corner logo** — marketing header, sidebar (both states), mobile header, auth screens, footer, "More" sheet |
| `public/brand/wazobia-lockup.png` | full artwork (emblem + wordmark + tagline + swoosh) | 1000×715 | landing hero card, auth brand panel |
| `public/brand/wazobia-mark.png` | emblem on its original white background | 512×408 | legacy / print-style use only |
| `public/brand/wazobia-wordmark.png` | wordmark only | 900×142 | available where the emblem is already present |
| `public/brand/favicon-32.png`, `apple-touch-icon.png`, `icon-512.png` | derived from the transparent emblem | 32 / 180 / 512 | browser tab and home-screen icons |
| `public/brand/wazobia-source.png` | untouched original | 1200×800 | archive / future re-export |

### Transparent emblem

The original artwork is raster with a baked white background, which renders as a white box in a
navigation corner. `wazobia-emblem.png` was therefore matted to transparency:

1. Foreground segmented on **chroma and darkness**, not on a simple brightness threshold — the
   emblem is vivid green/gold/red, the background is near-white.
2. Interior holes closed and filled, so the emblem's own white highlights survive.
3. Small stray components dropped (an artifact sat on the baseline under the artwork).
4. One-pixel erosion plus a small Gaussian feather for a smooth, non-jagged edge.
5. **White matting undone at the edge** (`C = (C_obs − (1−α)·bg) / α`) so anti-aliased pixels keep
   their true colour instead of going pale.
6. Verified visually on paper, pure white, forest `#04240f`, and gold `#f5c518` — no halo on any.

The earlier naive extraction produced a visible white outline on dark surfaces; that approach was
discarded rather than shipped.

A `lockup-compact` variant is also derived at render time: it shows the top 79.5% of the lockup,
which is emblem + wordmark with the tagline and swoosh cropped out. That ratio was verified
visually — at 0.795 the wordmark is complete and no tagline bleeding occurs. Nothing is stretched:
every variant preserves the source aspect ratio.

## Palette, taken from the logo

The logo is deep forest green, gold and ember orange on white. Those three drive the interface.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `forest-900` | `#04240f` | Headings, dark panels | 15.9:1 on paper |
| `forest-800` | `#073116` | Primary button, brand | 13.8:1 on paper |
| `forest-700` | `#0b4420` | Links, primary action | 10.8:1 on paper |
| `forest-600` | `#12622f` | Focus ring | 7.2:1 on paper |
| `gold-500` | `#f5c518` | Highlight surface, emphasis | **1.56:1 — never text** |
| `ember-600` | `#cf3d05` | Error, destructive | 4.65:1 on paper |
| `lime-400` | `#8ed13a` | Small accent dot only | **1.77:1 — never text** |
| `paper-50` | `#fbfaf6` | Page surface | — |

Discipline applied throughout:

- **Gold and lime are surfaces and accents, never body text.** Both fail AA for text on paper, so
  they only ever sit under `forest-900` text (10.2:1 and 9.0:1 respectively).
- One accent carries action (forest). No purple, no gradient washes, no glass.
- Gradients are limited to two radial brand glows and the auth panel ambience.

## Logo usage in the interface

The brief for the application chrome is **emblem only, no wordmark**:

| Surface | Variant | Height |
|---|---|---|
| Marketing header | `emblem` | 40px |
| Sidebar (expanded) | `emblem` | 34px |
| Sidebar (collapsed) | `emblem` | 28px |
| Mobile app header | `emblem` | 34px |
| Sign-up / login | `emblem` | 42px |
| Footer + "More" sheet | `emblem` | 44 / 30px |
| Landing hero + auth panel | `lockup` (full branded artwork) | 320 / 230px |

No corner logo carries a plate, ring or background: the emblem is transparent and sits directly on
the surface.

## Known limitations

- There is still **no vector source**. The emblem is a matted raster; it is clean at navigation sizes
  but will soften if displayed above roughly 200px.
- Only the emblem was matted to transparency. The full lockup still has its baked white background,
  which is why the landing hero and auth panel present it on a deliberate white card.
- The matted edge is produced algorithmically from the supplied artwork. If the designer can supply
  a native transparent PNG or SVG, replace `wazobia-emblem.png` and delete the matting step — no
  component changes are required.
- At 1× on a standard display the wordmark detail is soft below roughly 34px tall, which is why
  navigation uses 30–38px lockups.

**Recommended next brand deliverable** (blueprint §5.3): transparent SVG/PNG mark, a monochrome
variant, and a dark-background variant. When they arrive, drop them into `public/brand/` and update
`src/config/brand.ts` — no component changes are needed.
