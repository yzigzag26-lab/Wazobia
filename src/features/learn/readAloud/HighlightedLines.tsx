import { cn } from '@/utils/cn'
import type { StudyLanguage } from '../types'

export interface HighlightedLinesProps {
  readonly language: StudyLanguage
  readonly lines: readonly { readonly id: string; readonly text: string; readonly gloss?: string }[]
  /** Index currently being spoken, or -1. */
  readonly activeIndex: number
  readonly onSpeakLine: (index: number) => void
  readonly enabled: boolean
  readonly className?: string
}

/**
 * Content lines with the spoken sentence highlighted.
 *
 * Two honest behaviours:
 *  - The highlight follows the player's `activeIndex`, which advances on the
 *    utterance `end` event. That is real timing, not a timer pretending to
 *    match speech. If the voice has no timing metadata, there is simply no
 *    finer-grained sync — and it is not faked.
 *  - Each line is its own button so a learner can replay one sentence. The
 *    button is the affordance; the text is not a clickable div.
 *
 * `lang` is set per line so the browser and assistive technology use the right
 * language rules — this is what keeps tone marks rendered in the serif face.
 */
export function HighlightedLines({
  language,
  lines,
  activeIndex,
  onSpeakLine,
  enabled,
  className,
}: HighlightedLinesProps) {
  return (
    <ol className={cn('space-y-1', className)} aria-label="Lesson content">
      {lines.map((line, index) => {
        const active = index === activeIndex
        return (
          <li key={line.id}>
            <button
              type="button"
              lang={language}
              onClick={() => onSpeakLine(index)}
              disabled={!enabled}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'group flex w-full items-start gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-left',
                'transition-colors duration-100',
                enabled && 'hover:bg-paper-100',
                !enabled && 'cursor-default',
                active && 'bg-forest-50 ring-1 ring-inset ring-forest-300',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-[0.45rem] size-1.5 shrink-0 rounded-full transition-colors',
                  active ? 'bg-forest-600' : 'bg-transparent',
                )}
              />
              <span className="min-w-0">
                <span className="font-serif text-[0.9375rem] leading-7 text-ink-900">
                  {line.text}
                </span>
                {line.gloss ? (
                  <span
                    lang="en"
                    className="mt-0.5 block text-[0.8125rem] leading-5 text-ink-500"
                  >
                    {line.gloss}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
