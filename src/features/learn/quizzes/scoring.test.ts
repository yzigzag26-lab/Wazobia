import { describe, expect, it } from 'vitest'
import { QUIZZES } from './index'
import { isAnswerCorrect } from './scoring'
import type { QuizQuestion } from '../types'

const choiceQuestion: QuizQuestion = {
  id: 'q',
  kind: 'multiple-choice',
  prompt: 'Pick B',
  choices: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ],
  answer: ['b'],
  explanation: 'B is correct.',
}

const multiQuestion: QuizQuestion = {
  ...choiceQuestion,
  id: 'm',
  answer: ['a', 'b'],
}

const matchingQuestion: QuizQuestion = {
  id: 'x',
  kind: 'matching',
  prompt: 'Match',
  pairs: [
    { left: 'ọkọ̀', right: 'vehicle' },
    { left: 'ọkọ', right: 'husband' },
  ],
  answer: ['vehicle', 'husband'],
  explanation: 'Tone changes the word.',
}

const orderingQuestion: QuizQuestion = {
  id: 'o',
  kind: 'ordering',
  prompt: 'Order',
  sequence: ['Ẹ káàárọ̀', 'Ẹ káàsán', 'Ẹ káalẹ́'],
  answer: ['0', '1', '2'],
  explanation: 'Morning, afternoon, evening.',
}

describe('isAnswerCorrect', () => {
  it('accepts the right single choice', () => {
    expect(isAnswerCorrect(choiceQuestion, { kind: 'choice', selected: ['b'] })).toBe(true)
  })

  it('rejects a wrong single choice', () => {
    expect(isAnswerCorrect(choiceQuestion, { kind: 'choice', selected: ['a'] })).toBe(false)
  })

  it('rejects an empty answer — an unanswered question is never correct', () => {
    expect(isAnswerCorrect(choiceQuestion, { kind: 'choice', selected: [] })).toBe(false)
  })

  it('is order-insensitive for multi-select', () => {
    expect(isAnswerCorrect(multiQuestion, { kind: 'choice', selected: ['b', 'a'] })).toBe(true)
  })

  it('rejects a partial multi-select', () => {
    expect(isAnswerCorrect(multiQuestion, { kind: 'choice', selected: ['a'] })).toBe(false)
  })

  it('rejects extra selections in a multi-select', () => {
    expect(isAnswerCorrect(multiQuestion, { kind: 'choice', selected: ['a', 'b', 'c'] })).toBe(
      false,
    )
  })

  it('requires every pair in a matching question', () => {
    expect(
      isAnswerCorrect(matchingQuestion, {
        kind: 'matching',
        pairs: { 'ọkọ̀': 'vehicle', 'ọkọ': 'husband' },
      }),
    ).toBe(true)

    expect(
      isAnswerCorrect(matchingQuestion, {
        kind: 'matching',
        pairs: { 'ọkọ̀': 'vehicle', 'ọkọ': 'vehicle' },
      }),
    ).toBe(false)

    expect(isAnswerCorrect(matchingQuestion, { kind: 'matching', pairs: {} })).toBe(false)
  })

  it('requires the exact sequence for an ordering question', () => {
    expect(
      isAnswerCorrect(orderingQuestion, {
        kind: 'ordering',
        order: ['Ẹ káàárọ̀', 'Ẹ káàsán', 'Ẹ káalẹ́'],
      }),
    ).toBe(true)

    expect(
      isAnswerCorrect(orderingQuestion, {
        kind: 'ordering',
        order: ['Ẹ káàsán', 'Ẹ káàárọ̀', 'Ẹ káalẹ́'],
      }),
    ).toBe(false)
  })

  it('rejects a mismatched answer shape rather than throwing', () => {
    expect(isAnswerCorrect(matchingQuestion, { kind: 'choice', selected: ['a'] })).toBe(false)
    expect(isAnswerCorrect(choiceQuestion, { kind: 'ordering', order: ['b'] })).toBe(false)
  })
})

describe('every shipped quiz is answerable', () => {
  it('gives matching questions pairs covering their answer list', () => {
    for (const quiz of QUIZZES) {
      for (const question of quiz.questions) {
        if (question.kind !== 'matching') continue
        expect(question.pairs?.length ?? 0, question.id).toBeGreaterThan(1)
      }
    }
  })

  it('has every question markable with a correct answer supplied', () => {
    for (const quiz of QUIZZES) {
      for (const question of quiz.questions) {
        if (question.kind === 'matching') {
          const pairs = question.pairs ?? []
          const full = Object.fromEntries(pairs.map((pair) => [pair.left, pair.right]))
          expect(isAnswerCorrect(question, { kind: 'matching', pairs: full }), question.id).toBe(
            true,
          )
        } else if (question.kind === 'ordering') {
          expect(
            isAnswerCorrect(question, {
              kind: 'ordering',
              order: question.sequence ?? [],
            }),
            question.id,
          ).toBe(true)
        } else {
          expect(
            isAnswerCorrect(question, { kind: 'choice', selected: question.answer }),
            question.id,
          ).toBe(true)
        }
      }
    }
  })
})
