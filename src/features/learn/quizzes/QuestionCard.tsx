import { useMemo } from 'react'
import type { QuizQuestion } from '../types'
import type { StudyLanguage } from '../types'
import { cn } from '@/utils/cn'
import { IconCheck, IconClose } from '@/components/ui/icons'

/**
 * One question, in one of three interaction modes.
 *
 *  - **Choice** (multiple choice, vocabulary, translation, sentence completion,
 *    grammar, listening): radio group, or checkbox group when the question has
 *    more than one correct answer.
 *  - **Matching**: pick a left item, then a right item, to pair them. Pairs are
 *    chosen deliberately rather than by dragging, because drag-and-drop is
 *    unusable with a keyboard and unreliable on touch.
 *  - **Ordering**: move items up and down with buttons. Same reason.
 *
 * After submission the card switches to a review state: the learner's answer,
 * the correct answer and the explanation. The review state never disappears —
 * a wrong answer stays visible so the learner can study it.
 */

export type AnswerState =
  | { readonly kind: 'choice'; readonly selected: readonly string[] }
  | { readonly kind: 'matching'; readonly pairs: Readonly<Record<string, string>> }
  | { readonly kind: 'ordering'; readonly order: readonly string[] }

export interface QuestionCardProps {
  readonly question: QuizQuestion
  readonly index: number
  readonly total: number
  readonly language: StudyLanguage
  readonly answer: AnswerState
  readonly onChange: (next: AnswerState) => void
  readonly submitted: boolean
  readonly correct: boolean
}

function shuffleDeterministic<T>(items: readonly T[], seed: number): readonly T[] {
  // A stable shuffle so a question does not re-order on every render (which
  // would make matching impossible to complete). Not cryptographic — it only
  // needs to avoid presenting the answer in its authored order.
  const output = [...items]
  let state = seed
  for (let i = output.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) % 2147483648
    const j = state % (i + 1)
    const a = output[i]
    const b = output[j]
    if (a !== undefined && b !== undefined) {
      output[i] = b
      output[j] = a
    }
  }
  return output
}

export function QuestionCard({
  question,
  index,
  total,
  language,
  answer,
  onChange,
  submitted,
  correct,
}: QuestionCardProps) {
  return (
    <section
      aria-labelledby={`q-${question.id}`}
      className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5"
    >
      <div className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
        <span>
          Question {index + 1} of {total}
        </span>
      </div>

      <h2 id={`q-${question.id}`} className="mt-2 text-[1rem] font-medium leading-6 text-ink-900">
        {question.prompt}
      </h2>

      {question.target ? (
        <p lang={language} className="mt-2 font-serif text-[1.0625rem] leading-7 text-ink-800">
          {question.target}
        </p>
      ) : null}

      <div className="mt-4">
        {question.kind === 'matching' ? (
          <MatchingAnswer
            question={question}
            answer={answer}
            onChange={onChange}
            submitted={submitted}
            language={language}
          />
        ) : question.kind === 'ordering' ? (
          <OrderingAnswer question={question} answer={answer} onChange={onChange} submitted={submitted} language={language} />
        ) : (
          <ChoiceAnswer
            question={question}
            answer={answer}
            onChange={onChange}
            submitted={submitted}
            language={language}
          />
        )}
      </div>

      {submitted ? (
        <div
          className={cn(
            'mt-4 rounded-[var(--radius-md)] border px-3.5 py-3',
            correct ? 'border-forest-300 bg-forest-50' : 'border-ember-600 bg-ember-100',
          )}
        >
          <p
            className={cn(
              'flex items-center gap-1.5 text-[0.8125rem] font-semibold',
              correct ? 'text-forest-800' : 'text-ember-700',
            )}
          >
            {correct ? <IconCheck width={14} height={14} /> : <IconClose width={14} height={14} />}
            {correct ? 'Correct' : 'Not quite'}
          </p>
          {!correct ? <CorrectAnswer question={question} language={language} /> : null}
          <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-700">{question.explanation}</p>
        </div>
      ) : null}
    </section>
  )
}

/* ---------------------------------------------------------------- choices */

function ChoiceAnswer({
  question,
  answer,
  onChange,
  submitted,
  language,
}: {
  question: QuizQuestion
  answer: AnswerState
  onChange: (next: AnswerState) => void
  submitted: boolean
  language: StudyLanguage
}) {
  const choices = question.choices ?? []
  const multi = question.answer.length > 1
  const selected = answer.kind === 'choice' ? answer.selected : []

  return (
    <fieldset>
      <legend className="sr-only">{multi ? 'Select all that apply' : 'Select one answer'}</legend>
      {multi ? (
        <p className="mb-2 text-[0.75rem] text-ink-500">Select all that apply.</p>
      ) : null}
      <div className="space-y-2">
        {choices.map((choice) => {
          const isSelected = selected.includes(choice.id)
          const isCorrectChoice = question.answer.includes(choice.id)
          const showAsCorrect = submitted && isCorrectChoice
          const showAsWrong = submitted && isSelected && !isCorrectChoice

          return (
            <label
              key={choice.id}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border px-3 py-2.5',
                'transition-colors duration-100',
                showAsCorrect && 'border-forest-500 bg-forest-50',
                showAsWrong && 'border-ember-600 bg-ember-100',
                !submitted && isSelected && 'border-forest-500 bg-forest-50',
                !submitted && !isSelected && 'border-paper-300 hover:border-ink-400',
                submitted && 'cursor-default',
              )}
            >
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={`q-${question.id}`}
                value={choice.id}
                checked={isSelected}
                disabled={submitted}
                onChange={() => {
                  if (multi) {
                    onChange({
                      kind: 'choice',
                      selected: isSelected
                        ? selected.filter((id) => id !== choice.id)
                        : [...selected, choice.id],
                    })
                  } else {
                    onChange({ kind: 'choice', selected: [choice.id] })
                  }
                }}
                className="mt-1 size-4 shrink-0 accent-[var(--color-forest-700)]"
              />
              <span lang={language} className="text-[0.9375rem] leading-6 text-ink-800">
                {choice.label}
              </span>
              {showAsCorrect ? (
                <IconCheck width={14} height={14} className="ml-auto mt-1 shrink-0 text-forest-700" />
              ) : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/* --------------------------------------------------------------- matching */

function MatchingAnswer({
  question,
  answer,
  onChange,
  submitted,
  language,
}: {
  question: QuizQuestion
  answer: AnswerState
  onChange: (next: AnswerState) => void
  submitted: boolean
  language: StudyLanguage
}) {
  const pairs = question.pairs ?? []
  // Join to a primitive so the memo below does not re-run on every render —
  // `question.pairs` is a fresh array reference each time the parent re-renders.
  const pairKey = pairs.map((pair) => `${pair.left}|${pair.right}`).join('~')
  const pairsMap = answer.kind === 'matching' ? answer.pairs : {}

  const rights = useMemo(
    () =>
      shuffleDeterministic(
        pairKey
          .split('~')
          .filter((entry) => entry.length > 0)
          .map((entry) => entry.split('|')[1] ?? ''),
        question.id.length * 7,
      ),
    [pairKey, question.id],
  )

  const assigned = new Set(Object.values(pairsMap))

  function setPair(left: string, right: string) {
    // A right-hand item can only be used once: picking it moves it off whichever
    // left item had it before. Without this, two lefts could claim one right.
    const next: Record<string, string> = {}
    for (const [existingLeft, existingRight] of Object.entries(pairsMap)) {
      if (existingRight !== right) next[existingLeft] = existingRight
    }
    next[left] = right
    onChange({ kind: 'matching', pairs: next })
  }

  return (
    <div className="space-y-3">
      {pairs.map((pair) => {
        const chosen = pairsMap[pair.left]
        const isRight = chosen === pair.right
        return (
          <div key={pair.left} className="flex flex-wrap items-center gap-2">
            <span lang={language} className="min-w-0 flex-1 font-serif text-[0.9375rem] text-ink-900">
              {pair.left}
            </span>
            <select
              aria-label={`Match for ${pair.left}`}
              value={chosen ?? ''}
              disabled={submitted}
              onChange={(event) => {
                if (event.target.value === '') {
                  const next = { ...pairsMap }
                  delete next[pair.left]
                  onChange({ kind: 'matching', pairs: next })
                } else {
                  setPair(pair.left, event.target.value)
                }
              }}
              className={cn(
                'min-w-[10rem] max-w-full rounded-[var(--radius-sm)] border bg-white px-2 py-1.5 text-[0.8125rem]',
                submitted && isRight && 'border-forest-500 text-forest-800',
                submitted && !isRight && 'border-ember-600 text-ember-700',
                !submitted && 'border-paper-300 text-ink-800',
              )}
            >
              <option value="">Choose…</option>
              {rights.map((right) => (
                <option key={right} value={right} disabled={assigned.has(right) && right !== chosen}>
                  {right}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------------- ordering */

function OrderingAnswer({
  question,
  answer,
  onChange,
  submitted,
  language,
}: {
  question: QuizQuestion
  answer: AnswerState
  onChange: (next: AnswerState) => void
  submitted: boolean
  language: StudyLanguage
}) {
  const correctOrder = question.sequence ?? []
  const order =
    answer.kind === 'ordering'
      ? answer.order
      : shuffleDeterministic(correctOrder, question.id.length * 13)

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return
    const next = [...order]
    const [item] = next.splice(from, 1)
    if (item === undefined) return
    next.splice(to, 0, item)
    onChange({ kind: 'ordering', order: next })
  }

  return (
    <ol className="space-y-2">
      {order.map((item, position) => (
        <li
          key={item}
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-paper-300 bg-paper-50 px-3 py-2"
        >
          <span className="font-mono text-[0.6875rem] tabular-nums text-ink-400">
            {position + 1}
          </span>
          <span lang={language} className="min-w-0 flex-1 font-serif text-[0.9375rem] text-ink-900">
            {item}
          </span>
          {!submitted ? (
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => move(position, position - 1)}
                disabled={position === 0}
                aria-label={`Move ${item} earlier`}
                className="grid size-7 place-items-center rounded-[var(--radius-sm)] border border-paper-300 text-ink-600 hover:bg-paper-200 disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(position, position + 1)}
                disabled={position === order.length - 1}
                aria-label={`Move ${item} later`}
                className="grid size-7 place-items-center rounded-[var(--radius-sm)] border border-paper-300 text-ink-600 hover:bg-paper-200 disabled:opacity-40"
              >
                ↓
              </button>
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

/* ----------------------------------------------------------- correct answer */

function CorrectAnswer({
  question,
  language,
}: {
  question: QuizQuestion
  language: StudyLanguage
}) {
  if (question.kind === 'matching') {
    return (
      <ul className="mt-2 space-y-1">
        {question.pairs?.map((pair) => (
          <li key={pair.left} className="text-[0.8125rem] text-ink-700">
            <span lang={language} className="font-serif">
              {pair.left}
            </span>{' '}
            → {pair.right}
          </li>
        ))}
      </ul>
    )
  }

  if (question.kind === 'ordering') {
    return (
      <p className="mt-2 text-[0.8125rem] text-ink-700">
        Correct order:{' '}
        <span lang={language} className="font-serif">
          {question.sequence?.join(' → ')}
        </span>
      </p>
    )
  }

  const labels = (question.choices ?? [])
    .filter((choice) => question.answer.includes(choice.id))
    .map((choice) => choice.label)

  if (labels.length === 0) return null

  return (
    <p className="mt-2 text-[0.8125rem] text-ink-700">
      Correct answer:{' '}
      <span lang={language} className="font-medium">
        {labels.join(', ')}
      </span>
    </p>
  )
}
