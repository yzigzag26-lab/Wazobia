import type { CSSProperties } from 'react'
import { brand } from '@/config/brand'
import { cn } from '@/utils/cn'

export type LogoVariant = 'emblem' | 'mark' | 'wordmark' | 'lockup' | 'lockup-compact'

export interface WazobiaLogoProps {
  /**
   * - `emblem`          transparent emblem with no wordmark — every corner logo
   * - `mark`            emblem on white (the original cropped raster)
   * - `wordmark`        wordmark only
   * - `lockup`          full artwork incl. tagline — hero and auth panels
   * - `lockup-compact`  emblem + wordmark, tagline cropped out
   */
  readonly variant?: LogoVariant
  /** Rendered height in px. Width follows the asset's aspect ratio. */
  readonly height?: number
  readonly className?: string
  /**
   * True when an adjacent text label already names the product, so the image
   * itself is decorative and should not be announced twice.
   */
  readonly decorative?: boolean
  /** Load eagerly only for above-the-fold usage. */
  readonly priority?: boolean
}

/**
 * The single logo render point for the whole application.
 *
 * The supplied lockup contains the tagline beneath the wordmark. For the app
 * navigation we need emblem + wordmark without the tagline, so `lockup-compact`
 * crops the artwork with a wrapper that hides the tagline band. The image is
 * never stretched: every variant preserves the source aspect ratio.
 */
export function WazobiaLogo({
  variant = 'lockup-compact',
  height = 40,
  className,
  decorative = false,
  priority = false,
}: WazobiaLogoProps) {
  const alt = decorative ? '' : brand.markAlt
  const fetchPriority = priority ? ('high' as const) : undefined

  /** WebP first with a PNG fallback — the supplied artwork is heavy as PNG. */
  function picture(
    src: string,
    webp: string,
    intrinsicWidth: number,
    intrinsicHeight: number,
    imageClassName: string,
    style?: CSSProperties,
  ) {
    return (
      <picture className={cn('contents', imageClassName)}>
        <source srcSet={webp} type="image/webp" />
        <img
          src={src}
          alt={alt}
          aria-hidden={decorative || undefined}
          width={intrinsicWidth}
          height={intrinsicHeight}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={fetchPriority}
          className={imageClassName}
          style={style}
        />
      </picture>
    )
  }

  if (variant === 'emblem') {
    const width = Math.round((height * brand.emblem.width) / brand.emblem.height)
    return picture(
      brand.emblemSrc,
      brand.emblemWebp,
      width,
      height,
      cn('select-none object-contain', className),
      { height, width },
    )
  }

  if (variant === 'mark') {
    const width = Math.round((height * brand.mark.width) / brand.mark.height)
    return picture(
      brand.markSrc,
      brand.markWebp,
      width,
      height,
      cn('shrink-0 select-none object-contain', className),
      { height, width },
    )
  }

  if (variant === 'wordmark') {
    const width = Math.round((height * brand.wordmark.width) / brand.wordmark.height)
    return picture(
      brand.wordmarkSrc,
      brand.wordmarkWebp,
      width,
      height,
      cn('select-none object-contain', className),
      { height, width },
    )
  }

  if (variant === 'lockup') {
    const width = Math.round((height * brand.lockup.width) / brand.lockup.height)
    return picture(
      brand.lockupSrc,
      brand.lockupWebp,
      width,
      height,
      cn('h-auto max-w-full select-none object-contain', className),
      { maxWidth: '100%', width },
    )
  }

  /**
   * lockup-compact — emblem + wordmark.
   * The source lockup is 1000×715; the tagline and swoosh occupy the lower
   * ~21% of that box. We show the top 79% by clipping the wrapper, keeping the
   * aspect ratio of the visible region exactly.
   */
  const visibleRatio = 0.795
  const naturalWidth = brand.lockup.width
  const visibleHeight = Math.round(brand.lockup.height * visibleRatio)
  const width = Math.round((height * naturalWidth) / visibleHeight)

  return (
    <span
      className={cn('relative inline-block shrink-0 overflow-hidden', className)}
      style={{ height, width }}
    >
      {picture(
        brand.lockupSrc,
        brand.lockupWebp,
        naturalWidth,
        brand.lockup.height,
        'absolute left-0 top-0 h-auto w-full select-none object-contain',
        { width },
      )}
    </span>
  )
}
