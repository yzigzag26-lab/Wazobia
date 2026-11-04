import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { IconAlert, IconCheck } from './icons'

/**
 * Form field primitives.
 *
 * Accessibility contract, applied consistently:
 * - the visible <label> is always tied to the input via `htmlFor`/`id`
 * - `aria-invalid` is set when a field has an error
 * - `aria-describedby` points at help text *and* the error message
 * - errors use `role="alert"` so screen readers announce them on submit
 * - the password toggle is a real button with a state-describing accessible name
 */

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string
  /** Optional explicit id, so callers can focus the control on submit. */
  readonly id?: string | undefined
  readonly hint?: ReactNode | undefined
  readonly error?: string | undefined
  /** Renders a password input with a visibility toggle. */
  readonly revealable?: boolean
  /** Optional right-aligned link, e.g. "Forgot password?". */
  readonly labelAction?: ReactNode | undefined
  readonly leadingAdornment?: ReactNode | undefined
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, revealable = false, labelAction, leadingAdornment, className, type, id: providedId, ...props },
  ref,
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const [revealed, setRevealed] = useState(false)

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  const inputType = revealable ? (revealed ? 'text' : 'password') : type

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink-700">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        {leadingAdornment ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 [&>svg]:size-4"
          >
            {leadingAdornment}
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-[var(--radius-sm)] border bg-white px-3 text-[0.9375rem] text-ink-900',
            'placeholder:text-ink-400',
            'transition-colors duration-100',
            leadingAdornment ? 'pl-9' : undefined,
            revealable ? 'pr-11' : undefined,
            error
              ? 'border-ember-600 focus-visible:border-ember-600'
              : 'border-paper-300 hover:border-ink-400 focus-visible:border-forest-600',
          )}
          {...props}
        />

        {revealable ? (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-pressed={revealed}
            className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-r-[var(--radius-sm)] text-ink-500 hover:text-ink-800"
          >
            <span className="sr-only">{revealed ? 'Hide password' : 'Show password'}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              {revealed ? (
                <>
                  <path d="M3 3l18 18" />
                  <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c5 0 9 4.5 9 6 0 .6-.6 1.7-1.7 2.8" />
                  <path d="M6.3 7.9C3.9 9.5 3 11.2 3 12c0 1.5 4 6 9 6 1.3 0 2.5-.3 3.6-.7" />
                </>
              ) : (
                <>
                  <path d="M3 12c0-1.5 4-6 9-6s9 4.5 9 6-4 6-9 6-9-4.5-9-6Z" />
                  <circle cx="12" cy="12" r="2.6" />
                </>
              )}
            </svg>
          </button>
        ) : null}
      </div>

      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs leading-5 text-ink-500">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-ember-700">
          <IconAlert width={13} height={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
})

/** Rule checklist used for live password feedback. */
export interface RuleListProps {
  readonly rules: readonly { readonly id: string; readonly label: string; readonly met: boolean }[]
}

export function RuleList({ rules }: RuleListProps) {
  return (
    <ul className="mt-2 grid gap-1 sm:grid-cols-2">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={cn(
            'flex items-center gap-1.5 text-xs',
            rule.met ? 'text-forest-600' : 'text-ink-400',
          )}
        >
          <IconCheck
            width={12}
            height={12}
            className={rule.met ? 'opacity-100' : 'opacity-25'}
          />
          <span>{rule.label}</span>
          <span className="sr-only">{rule.met ? '(met)' : '(not met)'}</span>
        </li>
      ))}
    </ul>
  )
}

/** Checkbox with a wrapped description, used for consent and "remember me". */
export interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly label: ReactNode
  readonly error?: string | undefined
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  function CheckboxField({ label, error, className, id, ...props }, ref) {
    const generated = useId()
    const inputId = id ?? generated
    const errorId = `${inputId}-error`

    return (
      <div className={className}>
        <div className="flex items-start gap-2.5">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'mt-0.5 size-4 shrink-0 cursor-pointer appearance-none rounded-[3px] border bg-white',
              'checked:border-brand-700 checked:bg-brand-700',
              'checked:bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 12 12%27%3E%3Cpath d=%27M2.2 6.2 4.6 8.6 9.8 3.4%27 fill=%27none%27 stroke=%27white%27 stroke-width=%271.6%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")]',
              'bg-center bg-no-repeat',
              error ? 'border-ember-600' : 'border-paper-400',
            )}
            {...props}
          />
          <label htmlFor={inputId} className="cursor-pointer text-[0.8125rem] leading-5 text-ink-700">
            {label}
          </label>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-ember-700">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)
