import { cn } from '@/utils/cn'

export interface QuestionProgressProps {
  /** Zero-based index of the current question. */
  readonly index: number
  readonly total: number
  /** Which of the three specification groups this question belongs to. */
  readonly step: 1 | 2 | 3
  readonly stepName: string
}

/**
 * Progress for a one-question-per-page questionnaire.
 *
 * Two things are communicated, because both matter:
 *   1. position in the whole questionnaire — "Question 3 of 10"
 *   2. which group you are in — "Background · Step 1 of 3"
 *
 * The bar is a single segmented track of one segment per question, so the user
 * can see how much is left without reading a number. `aria-current` plus the
 * visible text keep it meaningful without relying on colour.
 */
export function QuestionProgress({ index, total, step, stepName }: QuestionProgressProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p
          data-progress
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-forest-700"
        >
          Question {index + 1} of {total}
        </p>
        <p className="text-xs text-ink-500">
          {stepName} · Step {step} of 3
        </p>
      </div>

      <ol className="mt-2.5 flex items-center gap-1" aria-label="Questionnaire progress">
        {Array.from({ length: total }, (_, i) => {
          const done = i < index
          const active = i === index
          return (
            <li key={i} className="flex-1">
              <span
                aria-hidden="true"
                className={cn(
                  'block h-1 rounded-full transition-colors duration-200',
                  done ? 'bg-forest-700' : active ? 'bg-forest-500' : 'bg-paper-300',
                )}
              />
              <span className="sr-only">
                {`Question ${i + 1}${done ? ' (answered)' : active ? ' (current)' : ''}`}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
