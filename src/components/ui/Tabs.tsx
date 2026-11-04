import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/utils/cn'

export interface TabItem<T extends string> {
  readonly id: T
  readonly label: string
}

export interface TabsProps<T extends string> {
  readonly items: readonly TabItem<T>[]
  readonly active: T
  readonly onChange: (id: T) => void
  /** Accessible name for the tab list. */
  readonly label: string
  readonly className?: string
}

/**
 * Segmented tab control.
 *
 * Implements the WAI-ARIA tabs pattern with *manual* activation: arrow keys move
 * focus, Enter or Space selects. Manual activation is deliberate — these tabs
 * swap whole panels, and auto-activating on arrow would re-render heavy content
 * on every keypress while the user is just browsing the list.
 *
 * Roving tabindex: exactly one tab is in the tab order at a time.
 */
export function Tabs<T extends string>({ items, active, onChange, label, className }: TabsProps<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>())

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.id === active)
    if (index === -1) return

    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = items.length - 1
    else return

    event.preventDefault()
    const next = items[nextIndex]
    if (!next) return
    refs.current.get(next.id)?.focus()
  }

  return (
    <div
      // The tablist is a composite widget: the container owns arrow-key handling
      // by design (WAI-ARIA tabs pattern). Its children are the focusable tabs,
      // which carry roving tabindex, so the container itself needs no tab stop.
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      role="tablist"
      aria-label={label}
      // -1, not 0: the container is programmatically focusable (satisfying the
      // composite-widget rule) while the tabs keep the roving tabindex.
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex max-w-full gap-1 overflow-x-auto rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === active
        return (
          <button
            key={item.id}
            ref={(node) => {
              if (node) refs.current.set(item.id, node)
              else refs.current.delete(item.id)
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-1.5',
              'text-[0.8125rem] font-medium transition-colors duration-100',
              selected
                ? 'bg-white text-ink-900 shadow-[inset_0_0_0_1px_var(--color-paper-300)]'
                : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
