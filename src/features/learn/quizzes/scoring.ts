import type { QuizQuestion } from '../types'
import type { AnswerState } from './QuestionCard'

/**
 * Marks one answer.
 *
 * Kept apart from the card so the card file exports only components (Fast
 * Refresh) and so the scoring rule is testable without rendering anything.
 * Comparison is order-insensitive for choices and exact for sequences.
 */
export function isAnswerCorrect(question: QuizQuestion, answer: AnswerState): boolean {
  if (question.kind === 'matching') {
    if (answer.kind !== 'matching') return false
    const pairs = question.pairs ?? []
    if (pairs.length === 0) return false
    return pairs.every((pair) => answer.pairs[pair.left] === pair.right)
  }

  if (question.kind === 'ordering') {
    if (answer.kind !== 'ordering') return false
    const expected = question.sequence ?? []
    return (
      expected.length === answer.order.length &&
      expected.every((item, index) => item === answer.order[index])
    )
  }

  if (answer.kind !== 'choice') return false
  const expected = question.answer.toSorted()
  const given = answer.selected.toSorted()
  return expected.length === given.length && expected.every((id, index) => id === given[index])
}
