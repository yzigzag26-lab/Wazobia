import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { IconBack, IconCheck, IconRestart } from '@/components/ui/icons'
import { NotFoundInline } from '../components/NotFoundInline'
import { findLesson } from '../lessons'
import { ALL_STORIES } from '../stories'
import { findQuiz } from './index'
import { useQuizAttempts } from './useQuizAttempts'
import { QuestionCard, type AnswerState } from './QuestionCard'
import { isAnswerCorrect } from './scoring'
import type { QuizQuestion } from '../types'

/**
 * Quiz player.
 *
 * Flow: instructions and progress → one question at a time, answered in any
 * order → submit → score, then a review of every wrong answer with its
 * explanation → retry.
 *
 * The player never submits for you and never scores an unanswered question as
 * correct: submitting with gaps warns, and the count of unanswered questions is
 * visible on the submit control.
 */
export default function QuizPage() {
  const { quizId = '' } = useParams()
  const quiz = findQuiz(quizId)

  if (!quiz) {
    return (
      <NotFoundInline
        title="Quiz not found"
        description="No quiz has this id in the current bank."
        backTo="/app/learn/quizzes"
        backLabel="All quizzes"
      />
    )
  }

  return <QuizRunner key={quiz.id} quizId={quiz.id} />
}

function QuizRunner({ quizId }: { quizId: string }) {
  const quiz = findQuiz(quizId)
  const { record, bestFor } = useQuizAttempts()

  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [submitted, setSubmitted] = useState(false)
  const [attempt, setAttempt] = useState(0)

  if (!quiz) return null

  const questions = quiz.questions
  const answeredCount = questions.filter((question) => isAnswered(answers[question.id])).length
  const score = submitted
    ? questions.filter((question) => {
        const answer = answers[question.id]
        return answer ? isAnswerCorrect(question, answer) : false
      }).length
    : 0

  const wrong = submitted
    ? questions.filter((question) => {
        const answer = answers[question.id]
        return !answer || !isAnswerCorrect(question, answer)
      })
    : []

  const lesson = quiz.lessonId ? findLesson(quiz.lessonId) : undefined
  const relatedStory = ALL_STORIES.find((story) => story.comprehensionQuizIds.includes(quiz.id))
  const best = bestFor(quiz.id)

  function setAnswer(questionId: string, next: AnswerState) {
    setAnswers((previous) => ({ ...previous, [questionId]: next }))
  }

  function handleSubmit() {
    setSubmitted(true)
    record({
      quizId,
      correct: score,
      total: questions.length,
      incorrectQuestionIds: questions
        .filter((question) => {
          const answer = answers[question.id]
          return !answer || !isAnswerCorrect(question, answer)
        })
        .map((question) => question.id),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function retry() {
    setAnswers({})
    setSubmitted(false)
    setAttempt((value) => value + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-[0.75rem] text-ink-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/app/learn/quizzes" className="hover:text-ink-900">
              Quizzes
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-800">
            {quiz.title}
          </li>
        </ol>
      </nav>

      <PageHeader
        eyebrow={<span>Quiz · {quiz.questions.length} questions</span>}
        title={quiz.title}
        description={quiz.instructions}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="pending" withDot>
              Unreviewed
            </Badge>
            {best ? (
              <Badge tone={best.fraction >= 0.8 ? 'approved' : 'neutral'}>
                Best {best.correct}/{best.total}
              </Badge>
            ) : null}
          </div>
        }
      />

      {(lesson ?? relatedStory) ? (
        <div className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-ink-600">
          <span>Reinforces</span>
          {lesson ? (
            <Link
              to={`/app/learn/lessons/${courseOf(lesson.moduleId)}/${lesson.id}`}
              className="font-medium text-forest-800 underline decoration-forest-300 underline-offset-2 hover:decoration-forest-700"
            >
              {lesson.title}
            </Link>
          ) : null}
          {relatedStory ? (
            <Link
              to={`/app/learn/stories/${relatedStory.id}`}
              className="font-medium text-forest-800 underline decoration-forest-300 underline-offset-2 hover:decoration-forest-700"
            >
              {relatedStory.title}
            </Link>
          ) : null}
        </div>
      ) : null}

      {!submitted ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Progress
              value={answeredCount / questions.length}
              label="Questions answered"
              className="max-w-[24rem] flex-1"
            />
            <span className="shrink-0 font-mono text-[0.75rem] tabular-nums text-ink-600">
              {answeredCount}/{questions.length} answered
            </span>
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => (
              <QuestionCard
                key={`${attempt}-${question.id}`}
                question={question}
                index={index}
                total={questions.length}
                language={quiz.language}
                answer={answers[question.id] ?? emptyAnswer(question)}
                onChange={(next) => setAnswer(question.id, next)}
                submitted={false}
                correct={false}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 px-4 py-3">
            <p className="text-[0.8125rem] text-ink-600">
              {answeredCount === questions.length
                ? 'All questions answered. Submit to see your score.'
                : `${questions.length - answeredCount} question${
                    questions.length - answeredCount === 1 ? '' : 's'
                  } left. Unanswered questions count as wrong.`}
            </p>
            <Button
              onClick={handleSubmit}
              className="ml-auto"
              disabled={answeredCount === 0}
            >
              Submit answers
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* <output> is the native live region for a computed result. */}
          <output
            className="block rounded-[var(--radius-lg)] border border-paper-300 bg-white p-6"
            aria-live="polite"
          >
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Result
            </p>
            <p className="mt-1.5 text-[1.75rem] font-semibold leading-tight text-ink-900">
              {score} / {questions.length}
            </p>
            <p className="mt-1 max-w-[56ch] text-[0.875rem] leading-6 text-ink-600">
              {score === questions.length
                ? 'Every answer correct. The explanations below are still worth reading — they say why, not just what.'
                : `${wrong.length} to review below. Each one shows the correct answer and the reason.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={retry}
                leadingIcon={<IconRestart width={14} height={14} />}
              >
                Try again
              </Button>
              <Link to="/app/learn/quizzes">
                <Button variant="ghost" leadingIcon={<IconBack width={14} height={14} />}>
                  All quizzes
                </Button>
              </Link>
            </div>
          </output>

          {wrong.length > 0 ? (
            <section aria-labelledby="review-heading" className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 id="review-heading" className="text-[0.9375rem] font-semibold text-ink-900">
                  Review
                </h2>
                <Badge tone="danger">{wrong.length} wrong</Badge>
              </div>
              {wrong.map((question) => {
                const answer = answers[question.id] ?? emptyAnswer(question)
                return (
                  <QuestionCard
                    key={`review-${question.id}`}
                    question={question}
                    index={questions.indexOf(question)}
                    total={questions.length}
                    language={quiz.language}
                    answer={answer}
                    onChange={() => {}}
                    submitted
                    correct={false}
                  />
                )
              })}
            </section>
          ) : (
            <p className="flex items-center gap-2 text-[0.875rem] text-forest-800">
              <IconCheck width={15} height={15} />
              Nothing to review.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- helpers */

function isAnswered(answer: AnswerState | undefined): boolean {
  if (!answer) return false
  if (answer.kind === 'choice') return answer.selected.length > 0
  if (answer.kind === 'matching') return Object.keys(answer.pairs).length > 0
  return answer.order.length > 0
}

function emptyAnswer(question: QuizQuestion): AnswerState {
  if (question.kind === 'matching') return { kind: 'matching', pairs: {} }
  if (question.kind === 'ordering') return { kind: 'ordering', order: [] }
  return { kind: 'choice', selected: [] }
}

/** Module ids are `<course>-mod-<n>`, so the course is the prefix. */
function courseOf(moduleId: string): string {
  return moduleId.replace(/-mod-\d+$/, '')
}

