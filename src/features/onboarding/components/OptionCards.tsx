import { useId } from 'react'
import type { Option } from '@/config/onboarding'
import { cn } from '@/utils/cn'
import { IconCheck } from '@/components/ui/icons'

/**
 * Single-select option cards.
 *
 * Implemented as a real radio group: one tab stop, arrow-key navigation, and a
 * `<fieldset>`/`<legend>` so the question is announced with its options. The
 * visual card is a `<label>` wrapping a visually-hidden radio, so clicking the
 * whole card selects it and keyboard behaviour comes from the browser.
 */
export interface OptionCardsProps<T extends string> {
  readonly legend: string
  readonly hint?: string | undefined
  readonly name: string
  readonly options: readonly Option<T>[]
  readonly value: T | null
  readonly onChange: (value: T) => void
  readonly columns?: 1 | 2
  readonly error?: string | undefined
}

export function OptionCards<T extends string>({
  legend,
  hint,
  name,
  options,
  value,
  onChange,
  columns = 2,
  error,
}: OptionCardsProps<T>) {
  const groupId = useId()
  const errorId = `${groupId}-error`

  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="min-w-0">
      <legend className="text-[0.9375rem] font-medium text-ink-900">{legend}</legend>
      {hint ? <p className="mt-1 text-[0.8125rem] leading-6 text-ink-500">{hint}</p> : null}

      <div
        className={cn(
          'mt-3 grid gap-2.5',
          columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1',
        )}
      >
        {options.map((option) => {
          const selected = value === option.id
          return (
            <label
              key={option.id}
              className={cn(
                'group relative flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-3.5',
                'transition-colors duration-100',
                selected
                  ? 'border-forest-600 bg-forest-50'
                  : 'border-paper-300 bg-white hover:border-ink-400 hover:bg-paper-50',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors',
                  selected
                    ? 'border-brand-700 bg-brand-700 text-on-brand'
                    : 'border-paper-400 bg-white group-hover:border-ink-400',
                )}
              >
                {selected ? <span className="size-1.5 rounded-full bg-on-brand" /> : null}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[0.875rem] font-medium leading-5 text-ink-900">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="mt-0.5 block text-[0.75rem] leading-5 text-ink-500">
                    {option.description}
                  </span>
                ) : null}
              </span>

              <span className="sr-only">{selected ? '(selected)' : ''}</span>
            </label>
          )
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-xs text-ember-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

/* --------------------------------------------------------------- multi-select */

export interface CheckboxGridProps<T extends string> {
  readonly legend: string
  readonly hint?: string | undefined
  readonly options: readonly Option<T>[]
  readonly values: readonly T[]
  readonly onToggle: (value: T) => void
  readonly columns?: 2 | 3
  readonly error?: string | undefined
  /** Rendered under each option, e.g. an "unavailable" note. */
  readonly badgeFor?: ((value: T) => string | null) | undefined
}

/**
 * Multi-select checkbox grid. A native `<fieldset>` of checkboxes: each card is
 * an independent tab stop with a real checkbox state, so assistive technology
 * announces "checked" correctly and no custom keyboard handling is needed.
 */
export function CheckboxGrid<T extends string>({
  legend,
  hint,
  options,
  values,
  onToggle,
  columns = 2,
  error,
  badgeFor,
}: CheckboxGridProps<T>) {
  const groupId = useId()
  const errorId = `${groupId}-error`

  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="min-w-0">
      <legend className="text-[0.9375rem] font-medium text-ink-900">{legend}</legend>
      {hint ? <p className="mt-1 text-[0.8125rem] leading-6 text-ink-500">{hint}</p> : null}

      <div
        className={cn(
          'mt-3 grid gap-2',
          columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'sm:grid-cols-2',
        )}
      >
        {options.map((option) => {
          const checked = values.includes(option.id)
          const badge = badgeFor?.(option.id) ?? null
          return (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border px-3 py-2.5',
                'transition-colors duration-100',
                checked
                  ? 'border-forest-600 bg-forest-50'
                  : 'border-paper-300 bg-white hover:border-ink-400 hover:bg-paper-50',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.id)}
                className={cn(
                  'mt-0.5 size-4 shrink-0 cursor-pointer appearance-none rounded-[3px] border bg-white',
                  'checked:border-brand-700 checked:bg-brand-700',
                  'checked:bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 12 12%27%3E%3Cpath d=%27M2.2 6.2 4.6 8.6 9.8 3.4%27 fill=%27none%27 stroke=%27white%27 stroke-width=%271.6%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")]',
                  'bg-center bg-no-repeat',
                  checked ? 'border-brand-700' : 'border-paper-400',
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.875rem] leading-5 text-ink-900">
                  {option.label}
                </span>
                {badge ? (
                  <span className="mt-0.5 block text-[0.6875rem] leading-4 text-gold-700">{badge}</span>
                ) : null}
              </span>
              {checked ? (
                <IconCheck width={13} height={13} className="mt-1 shrink-0 text-forest-700" />
              ) : null}
            </label>
          )
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-xs text-ember-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

/* -------------------------------------------------------------------- select */

export interface SelectFieldProps {
  readonly id: string
  readonly label: string
  readonly hint?: string | undefined
  readonly value: string | null
  readonly onChange: (value: string) => void
  readonly groups: readonly {
    readonly label: string
    readonly options: readonly { readonly value: string; readonly label: string }[]
  }[]
  readonly placeholder: string
  readonly error?: string | undefined
  readonly optional?: boolean
}

/** Grouped native `<select>`. Native wins here: it is usable on low-end phones. */
export function SelectField({
  id,
  label,
  hint,
  value,
  onChange,
  groups,
  placeholder,
  error,
  optional = false,
}: SelectFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.9375rem] font-medium text-ink-900">
          {label}
        </label>
        {optional ? <span className="text-xs text-ink-400">Optional</span> : null}
      </div>
      {hint ? (
        <p id={hintId} className="mb-2 text-[0.8125rem] leading-5 text-ink-500">
          {hint}
        </p>
      ) : null}

      <div className="relative">
        <select
          id={id}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full appearance-none rounded-[var(--radius-sm)] border bg-white pl-3 pr-9 text-[0.9375rem]',
            'transition-colors duration-100',
            value ? 'text-ink-900' : 'text-ink-500',
            error
              ? 'border-ember-600'
              : 'border-paper-300 hover:border-ink-400 focus-visible:border-forest-600',
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-ink-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-ember-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
