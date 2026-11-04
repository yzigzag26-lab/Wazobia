import type { ProverbVisual } from './types'

/**
 * Proverb illustrations.
 *
 * Hand-drawn SVG on the same 24-unit grid as the icon set, rendered large and
 * flat. Two rules govern every drawing here:
 *
 *  1. **The image must come from the proverb.** A proverb about a tree gets a
 *     tree; one about a calabash gets a calabash. This is why the component is a
 *     lookup keyed by `proverb.visual` rather than a random decorative motif —
 *     the data chooses the image, not the layout.
 *  2. **No generic "African" ornament.** No invented pan-African patterns, no
 *     drums sprinkled in for atmosphere. Where a drawing references something
 *     cultural it is because the proverb itself is about that thing (the
 *     masquerade's cloth, the market, the compound wall).
 *
 * The style is intentionally flat and low-contrast so it reads as an
 * illustration block rather than competing with the proverb text. Colours come
 * from the brand tokens, so it behaves in both themes.
 */

export interface ProverbIllustrationProps {
  readonly visual: ProverbVisual
  readonly className?: string
}

const STROKE = 'var(--color-forest-700)'
const SOFT = 'var(--color-forest-100)'
const MID = 'var(--color-forest-300)'
const GOLD = 'var(--color-gold-500)'
const GOLD_SOFT = 'var(--color-gold-300)'
const EMBER = 'var(--color-ember-500)'

function Frame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string | undefined
}) {
  return (
    <svg
      viewBox="0 0 120 84"
      className={className}
      role="presentation"
      aria-hidden="true"
      fill="none"
      stroke={STROKE}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

const DRAWINGS: Record<ProverbVisual, React.ReactNode> = {
  elephant: (
    <>
      <path d="M28 46c0-11 9-19 22-19s22 8 22 19v10c0 6-4 10-9 10h-3" fill={SOFT} />
      <path d="M28 46c0-11 9-19 22-19s22 8 22 19v10c0 6-4 10-9 10h-3" />
      <path d="M72 66c0 6 4 10 9 10s9-4 9-9-4-8-9-8" />
      <circle cx="43" cy="42" r="2.2" fill={STROKE} stroke="none" />
      <path d="M30 44c-4 3-6 7-6 11" />
      <path d="M52 27v-7M60 28v-7" />
    </>
  ),
  tortoise: (
    <>
      <ellipse cx="60" cy="50" rx="26" ry="16" fill={MID} />
      <path d="M60 34v32M40 38l8 12-8 12M80 38l-8 12 8 12" stroke={SOFT} />
      <path d="M34 50h-8M86 50h8" />
      <circle cx="26" cy="48" r="4" fill={SOFT} />
      <path d="M44 64v6M76 64v6" />
    </>
  ),
  bird: (
    <>
      <path d="M40 52c0-9 8-16 18-16 8 0 14 4 17 10l9 3-9 4c-2 6-9 10-17 10-10 0-18-5-18-11Z" fill={SOFT} />
      <path d="M40 52c0-9 8-16 18-16 8 0 14 4 17 10l9 3-9 4c-2 6-9 10-17 10-10 0-18-5-18-11Z" />
      <circle cx="64" cy="43" r="1.8" fill={STROKE} stroke="none" />
      <path d="M52 60 44 68M60 62l-2 8" />
      <path d="M84 40c4-6 9-9 14-9" stroke={GOLD} />
    </>
  ),
  tree: (
    <>
      <path d="M60 68V44" strokeWidth="3" />
      <circle cx="60" cy="34" r="17" fill={SOFT} />
      <circle cx="60" cy="34" r="17" />
      <path d="M48 62c-7-3-11-8-12-14M72 62c7-3 11-8 12-14" />
      <circle cx="53" cy="30" r="2.4" fill={GOLD} stroke="none" />
      <circle cx="66" cy="38" r="2.4" fill={GOLD} stroke="none" />
    </>
  ),
  river: (
    <>
      <path d="M8 44c14-8 26-8 40 0s26 8 40 0 16-6 24-3" strokeWidth="2.6" stroke={MID} />
      <path d="M8 56c14-8 26-8 40 0s26 8 40 0 16-6 24-3" strokeWidth="2.6" />
      <path d="M8 68c14-8 26-8 40 0s26 8 40 0 16-6 24-3" stroke={SOFT} />
      <path d="M30 32l6-6M52 34l6-6" stroke={GOLD} />
    </>
  ),
  calabash: (
    <>
      <path d="M60 24c-4 0-6 3-6 7 0 3 1 5 3 6-8 3-13 9-13 16 0 8 7 13 16 13s16-5 16-13c0-7-5-13-13-16 2-1 3-3 3-6 0-4-2-7-6-7Z" fill={GOLD_SOFT} />
      <path d="M60 24c-4 0-6 3-6 7 0 3 1 5 3 6-8 3-13 9-13 16 0 8 7 13 16 13s16-5 16-13c0-7-5-13-13-16 2-1 3-3 3-6 0-4-2-7-6-7Z" />
      <path d="M47 50c4-3 8-4 13-4s9 1 13 4" stroke={GOLD} />
    </>
  ),
  drum: (
    <>
      <path d="M40 30h40v12c0 6-9 11-20 11s-20-5-20-11Z" fill={SOFT} />
      <path d="M40 30h40v12c0 6-9 11-20 11s-20-5-20-11Z" />
      <ellipse cx="60" cy="30" rx="20" ry="6" fill={GOLD_SOFT} />
      <path d="M44 40l32 8M76 40l-32 8" stroke={GOLD} />
      <path d="M46 53v14M74 53v14" strokeWidth="2.4" />
    </>
  ),
  basket: (
    <>
      <path d="M30 40h60l-7 26c-1 4-4 6-8 6H45c-4 0-7-2-8-6Z" fill={SOFT} />
      <path d="M30 40h60l-7 26c-1 4-4 6-8 6H45c-4 0-7-2-8-6Z" />
      <path d="M28 40h64" strokeWidth="2.2" />
      <path d="M44 40c0-8 7-14 16-14s16 6 16 14" />
      <path d="M45 52h30M49 62h22" stroke={GOLD} />
    </>
  ),
  farm: (
    <>
      <path d="M14 62c18-6 34-6 52-2s28 4 40 0" strokeWidth="2.4" />
      <path d="M22 56c8-4 14-4 22-1M52 54c8-3 14-3 22 0M82 54c6-2 10-2 16 0" stroke={GOLD} />
      <path d="M38 56V34M38 34c-6-2-9-6-9-11 6 0 10 3 12 8M38 34c6-2 9-6 9-11-6 0-10 3-12 8" />
      <path d="M74 54V40M74 40c-4-2-6-4-6-8 4 0 7 2 8 6M74 40c4-2 6-4 6-8-4 0-7 2-8 6" />
    </>
  ),
  compound: (
    <>
      <path d="M18 62V38l18-12 18 12v24" fill={SOFT} />
      <path d="M18 62V38l18-12 18 12v24Z" />
      <path d="M44 62V30l16-8 16 8v32" stroke={MID} />
      <path d="M28 62V48h10v14" />
      <path d="M70 50h8v6h-8z" stroke={GOLD} />
      <path d="M10 62h100" strokeWidth="2.2" />
    </>
  ),
  market: (
    <>
      <path d="M24 34h72l-8 -14H32Z" fill={GOLD_SOFT} />
      <path d="M24 34h72l-8-14H32Z" />
      <path d="M24 34v28h72V34" />
      <path d="M40 62V44h12v18M58 62V44h12v18" />
      <path d="M92 20v-6h10v6" stroke={GOLD} />
      <path d="M14 62h94" strokeWidth="2.2" />
    </>
  ),
  moon: (
    <>
      <path d="M70 22a24 24 0 1 0 0 40 28 28 0 0 1 0-40Z" fill={GOLD_SOFT} />
      <path d="M70 22a24 24 0 1 0 0 40 28 28 0 0 1 0-40Z" />
      <path d="M28 30l1.5 3.5L33 35l-3.5 1.5L28 40l-1.5-3.5L23 35l3.5-1.5Z" fill={GOLD} stroke="none" />
      <path d="M34 52l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1Z" fill={STROKE} stroke="none" />
    </>
  ),
  fire: (
    <>
      <path d="M60 20c8 10 16 15 16 26 0 10-7 17-16 17s-16-7-16-17c0-11 8-16 16-26Z" fill={GOLD_SOFT} />
      <path d="M60 20c8 10 16 15 16 26 0 10-7 17-16 17s-16-7-16-17c0-11 8-16 16-26Z" />
      <path d="M60 40c4 5 7 7 7 12 0 5-3 8-7 8s-7-3-7-8c0-5 3-7 7-12Z" stroke={EMBER} />
    </>
  ),
  hand: (
    <>
      <path d="M40 50V32c0-2 1.5-3.5 3.5-3.5S47 30 47 32v14" stroke={MID} />
      <path d="M47 46V28c0-2 1.5-3.5 3.5-3.5S54 26 54 28v18" stroke={MID} />
      <path d="M54 46V32c0-2 1.5-3.5 3.5-3.5S61 30 61 32v14" stroke={MID} />
      <path d="M33 52c0-8 4-14 11-16l16-5c2-1 4 0 4 2s-1 3-3 4l-8 4" fill={SOFT} />
      <path d="M33 52c0-8 4-14 11-16l16-5c2-1 4 0 4 2s-1 3-3 4l-8 4" />
      <path d="M33 52v10h34V52" />
      <circle cx="60" cy="24" r="2.6" fill={GOLD} stroke="none" />
    </>
  ),
  path: (
    <>
      <path d="M52 74c0-14 6-20 8-30s-2-16-2-24" strokeWidth="3" stroke={MID} />
      <path d="M56 74c0-14 6-20 8-30" strokeWidth="3" />
      <path d="M30 66c4-6 4-10 0-16M86 58c-4-6-4-10 0-16" stroke={GOLD} />
      <circle cx="20" cy="26" r="4" fill={GOLD_SOFT} />
      <circle cx="96" cy="30" r="3" fill={SOFT} />
    </>
  ),
  child: (
    <>
      <circle cx="60" cy="34" r="11" fill={SOFT} />
      <circle cx="60" cy="34" r="11" />
      <path d="M50 30c2-6 6-8 10-8s8 2 10 8" />
      <path d="M60 45v16M50 74l10-13 10 13" />
      <path d="M46 54l14-4 14 4" />
      <path d="M60 52v6" stroke={GOLD} />
      <circle cx="56" cy="33" r="1.4" fill={STROKE} stroke="none" />
      <circle cx="64" cy="33" r="1.4" fill={STROKE} stroke="none" />
    </>
  ),
  cloth: (
    <>
      <path d="M32 24h56v52H32Z" fill={SOFT} />
      <path d="M32 24h56v52H32Z" />
      <path d="M32 34h56M32 66h56" stroke={GOLD} />
      <path d="M48 24v52M72 24v52" stroke={SOFT} />
      <circle cx="60" cy="50" r="6" stroke={GOLD} />
      <path d="M54 50h12M60 44v12" stroke={GOLD} />
    </>
  ),
  pot: (
    <>
      <path d="M42 34h36c2 0 3 2 2 4l-4 8c4 4 6 9 6 14 0 8-8 13-18 13s-18-5-18-13c0-5 2-10 6-14l-4-8c-1-2 0-4 2-4Z" fill={SOFT} />
      <path d="M42 34h36c2 0 3 2 2 4l-4 8c4 4 6 9 6 14 0 8-8 13-18 13s-18-5-18-13c0-5 2-10 6-14l-4-8c-1-2 0-4 2-4Z" />
      <path d="M44 42h32" stroke={GOLD} />
      <path d="M50 58c3-2 6-3 10-3s7 1 10 3" stroke={GOLD} />
    </>
  ),
  fish: (
    <>
      <path d="M28 44c10-9 24-9 34 0-10 9-24 9-34 0Z" fill={SOFT} />
      <path d="M62 44c6-6 14-8 22-6-3 4-4 8-4 12 2 2 4 4 4 4-8 2-16 0-22-6" />
      <path d="M28 44c10-9 24-9 34 0-10 9-24 9-34 0Z" />
      <circle cx="38" cy="43" r="1.6" fill={STROKE} stroke="none" />
      <path d="M44 53c0 6 3 10 8 12M52 51c0 6 3 10 8 12" stroke={MID} />
      <path d="M18 32c6-2 10-2 16 1" stroke={GOLD} />
    </>
  ),
  rain: (
    <>
      <path d="M34 44a14 14 0 0 1 14-14c6 0 11 4 13 9a11 11 0 0 1 2 22H40a11 11 0 0 1-6-17Z" fill={SOFT} />
      <path d="M34 44a14 14 0 0 1 14-14c6 0 11 4 13 9a11 11 0 0 1 2 22H40a11 11 0 0 1-6-17Z" />
      <path d="M42 62l-4 10M56 62l-4 10M70 62l-4 10" stroke={MID} strokeWidth="2.4" />
      <path d="M92 26c0 4-3 7-3 9M20 28c0 3-2 5-2 7" stroke={GOLD} />
    </>
  ),
}

export function ProverbIllustration({ visual, className }: ProverbIllustrationProps) {
  return <Frame className={className}>{DRAWINGS[visual]}</Frame>
}
