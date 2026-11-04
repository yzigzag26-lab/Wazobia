import { Link } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { IconQuiz } from '@/components/ui/icons'
import { ComingSoon, LanguageNotSelected } from '../components/LanguageState'
import { STUDY_LANGUAGE_LABELS, isStudyLanguage } from '../language'
import { QUIZ_KIND_LABELS, quizzesFor } from './index'
import { useQuizAttempts } from './useQuizAttempts'

/**
 * Quiz index.
 *
 * Grouped by what the quiz reinforces — a lesson, or a story — because that is
 * how a learner arrives at a quiz: they have just read something and want to
 * check it. The kind tally on each card is derived from the questions, not
 * hand-written, so it cannot overstate coverage.
 */
export default function QuizzesIndexPage() {
  const { primaryLanguage } = useProfile()
  const { bestFor } = useQuizAttempts()

  if (!primaryLanguage || !isStudyLanguage(primaryLanguage)) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={<span>Learn · Quizzes</span>}
          title="Quizzes"
          description="Check what you have learned, with an explanation for every answer."
        />
        {primaryLanguage ? (
          <ComingSoon languageName={STUDY_LANGUAGE_LABELS[primaryLanguage]} />
        ) : (
          <LanguageNotSelected />
        )}
      </div>
    )
  }

  const quizzes = quizzesFor(primaryLanguage)
  const lessonQuizzes = quizzes.filter((quiz) => quiz.lessonId)
  const storyQuizzes = quizzes.filter((quiz) => !quiz.lessonId)

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={<span>Learn · Quizzes</span>}
        title={`${STUDY_LANGUAGE_LABELS[primaryLanguage]} quizzes`}
        description="Every question tells you why an answer is right or wrong. Results are kept in this browser so you can come back and beat your own score."
      />

      {quizzes.length === 0 ? (
        <ComingSoon languageName={STUDY_LANGUAGE_LABELS[primaryLanguage]} />
      ) : (
        <>
          <QuizGroup
            heading="Course quizzes"
            description="One per lesson, so you can check the material straight after studying it."
            quizzes={lessonQuizzes}
            bestFor={bestFor}
          />
          <QuizGroup
            heading="Story comprehension"
            description="Questions about stories you have read — details, vocabulary and the moral."
            quizzes={storyQuizzes}
            bestFor={bestFor}
          />
        </>
      )}
    </div>
  )
}

function QuizGroup({
  heading,
  description,
  quizzes,
  bestFor,
}: {
  heading: string
  description: string
  quizzes: ReturnType<typeof quizzesFor>
  bestFor: (id: string) => { correct: number; total: number; fraction: number } | null
}) {
  if (quizzes.length === 0) return null

  return (
    <section aria-labelledby={`group-${heading}`}>
      <h2 id={`group-${heading}`} className="text-[0.9375rem] font-semibold text-ink-900">
        {heading}
      </h2>
      <p className="mt-1 text-[0.8125rem] leading-5 text-ink-500">{description}</p>

      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {quizzes.map((quiz) => {
          const best = bestFor(quiz.id)
          const kinds = [...new Set(quiz.questions.map((question) => question.kind))]

          return (
            <li key={quiz.id}>
              <Link
                to={`/app/learn/quizzes/${quiz.id}`}
                className="group flex h-full flex-col rounded-[var(--radius-md)] border border-paper-300 bg-white p-4 transition-colors hover:border-forest-400"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-paper-300 bg-paper-100 text-forest-800">
                    <IconQuiz width={17} height={17} />
                  </span>
                  {best ? (
                    <Badge tone={best.fraction >= 0.8 ? 'approved' : 'neutral'}>
                      Best {best.correct}/{best.total}
                    </Badge>
                  ) : null}
                </div>

                <h3 className="mt-3 text-[0.9375rem] font-semibold leading-5 text-ink-900">
                  {quiz.title}
                </h3>
                <p className="mt-1 flex-1 text-[0.8125rem] leading-5 text-ink-600">
                  {quiz.instructions}
                </p>
                <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.6875rem] text-ink-400">
                  <span className="font-mono">{quiz.questions.length} questions</span>
                  <span aria-hidden="true">·</span>
                  <span>{kinds.map((kind) => QUIZ_KIND_LABELS[kind]).join(', ')}</span>
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
