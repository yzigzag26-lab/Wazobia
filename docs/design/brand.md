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

There are **two green ramps, and they do opposite jobs**. This is the single most important rule in
the palette, because collapsing them back into one ramp is what made dark mode unreadable:

| Ramp | Job | Light | Dark |
|---|---|---|---|
| `forest-*` | **Text and icon colour.** Inverts with the theme. | dark green | bright green |
| `brand-*` | **Ground under white type.** Stays dark in both themes. | dark green | dark green |

A single ramp cannot do both: a value dark enough to carry white label text puts `text-forest-*`
labels at 1.4:1 on a dark page, and a value light enough to be a label turns the primary button into
white-on-mint. `themeTokens.test.ts` fails if a class string paints white type on a `forest-*`
ground, or uses `brand-*` as a text colour.

Likewise `white` is the raised **surface** (it becomes near-black in dark mode) while `on-brand` is
literal white type and never changes. `text-white` therefore must not be used — it compiles to the
surface token.

| Token | Light hex | Dark hex | Role |
|---|---|---|---|
| `forest-900` | `#04240f` | `#b3ebc4` | Strongest text step |
| `forest-800` | `#073116` | `#93e0ac` | Card labels, stat figures |
| `forest-700` | `#0b4420` | `#74d495` | Links, active nav |
| `forest-600` | `#12622f` | `#46b76d` | Focus ring, success text |
| `brand-700` | `#0b4420` | `#1b7c46` | Primary button ground |
| `brand-900` | `#04240f` | `#10432a` | Dark panels (HowItWorks, auth) |
| `on-brand` | `#ffffff` | `#ffffff` | Literal white type / dots |
| `gold-500` | `#f5c518` | `#f5c518` | Highlight surface, emphasis |
| `ember-600` | `#cf3d05` | `#c73f04` | Error border, destructive ground |
| `ember-700` | `#a52f04` | `#ff8256` | Error text |
| `paper-50` | `#fbfaf6` | `#0b100d` | Page surface |
| `white` | `#ffffff` | `#131c18` | Raised card surface |

Discipline applied throughout:

- **Gold and lime are surfaces and accents, never body text.** `gold-500` is 1.56:1 on paper and
  `lime-400` is 1.77:1, so they only ever sit under `forest-*` text, which is dark in light mode and
  bright in dark mode.
- **Every foreground/background pair the components actually use is measured in both themes**, not
  just the tokens someone remembered to list: `src/config/themeContrast.test.ts` reads the real
  stylesheet and asserts 195 pairs. Translucent white (`text-on-brand/60`…`/85`) is alpha-composited
  before measuring, because Tailwind compiles it to a literal hex.
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
