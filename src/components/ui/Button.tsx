import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly isLoading?: boolean
  readonly leadingIcon?: ReactNode
  readonly trailingIcon?: ReactNode
  /**
   * When true the button keeps its width while loading. Prevents layout shift
   * on async actions.
   */
  readonly fullWidth?: boolean
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-on-brand hover:bg-brand-800 active:bg-brand-900 border border-brand-700 hover:border-brand-800',
  secondary:
    'bg-white text-ink-900 border border-paper-300 hover:border-ink-400 hover:bg-paper-100 active:bg-paper-200',
  ghost:
    'bg-transparent text-ink-700 border border-transparent hover:bg-paper-100 hover:text-ink-900 active:bg-paper-200',
  danger:
    'bg-ember-600 text-on-brand border border-ember-600 hover:bg-ember-800 hover:border-ember-800',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[0.8125rem] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
}

/**
 * Primary action control.
 *
 * `isLoading` sets `aria-busy` and disables the button so that a double submit
 * cannot fire two requests. Disabled styling is intentionally muted rather than
 * grey-heavy so it still reads as part of the surface.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-button)] font-medium',
        'transition-colors duration-[var(--motion-fast,120ms)]',
        'disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading ? <Spinner size={size === 'sm' ? 13 : 15} className="shrink-0" /> : leadingIcon}
      <span className="truncate">{children}</span>
      {!isLoading && trailingIcon}
    </button>
  )
})
