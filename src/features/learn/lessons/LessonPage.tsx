import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconBack, IconCheck, IconChevronRight, IconQuiz } from '@/components/ui/icons'
import { NotFoundInline } from '../components/NotFoundInline'
import { ReadAloudPlayer } from '../readAloud/ReadAloudPlayer'
import { HighlightedLines } from '../readAloud/HighlightedLines'
import { lessonLines } from '../readAloud/speakable'
import { useSpeech } from '../readAloud/useSpeech'
import { adjacentLessons, findCourse, findLesson, findModule, LEVEL_LABELS } from './index'
import { useLessonProgress } from './useLessonProgress'
import { quizForLesson } from '../quizzes'
import { STUDY_LANGUAGE_LABELS } from '../language'
import type { Lesson, StudyLanguage } from '../types'

/**
 * Lesson page.
 *
 * Two things this page is careful about:
 *
 *  1. **Read Aloud reads the content, not the chrome.** The lines come from
 *     `lessonLines()`, which walks the lesson's content blocks only — the title,
 *     the breadcrumb, the buttons and the badges are never spoken. The block
 *     list below and the spoken list are the *same* data, rendered twice, so
 *     they cannot drift apart.
 *
 *  2. **Completing a lesson is a claim about this browser.** The button says
 *     "Mark as complete" and stores it locally. Nothing here says "saved to your
 *     account", because there is no account.
 */
export default function LessonPage() {
  const { courseId = '', lessonId = '' } = useParams()
  const lesson = findLesson(lessonId)
  const { markComplete, markIncomplete, isComplete } = useLessonProgress()

  if (!lesson) {
    return (
      <NotFoundInline
        title="Lesson not found"
        description="No lesson has this id. It may belong to a course that has not been published in this build."
        backTo="/app/learn/lessons"
        backLabel="All courses"
      />
    )
  }

  const module = findModule(lesson.moduleId)
  const course = module ? findCourse(module.courseId) : undefined
  const { previous, next } = adjacentLessons(lesson.id)
  const done = isComplete(lesson.id)
  const language = (course?.language ?? 'yo') as StudyLanguage

  return (
    <div className="space-y-7">
      <nav aria-label="Breadcrumb" className="text-[0.75rem] text-ink-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/app/learn/lessons" className="hover:text-ink-900">
              Lessons
            </Link>
          </li>
          {course ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  to={`/app/learn/lessons/${course.id}`}
                  className="hover:text-ink-900"
                >
                  {course.title}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-800">
            {lesson.title}
          </li>
        </ol>
      </nav>

      <PageHeader
        eyebrow={
          <>
            <span>{STUDY_LANGUAGE_LABELS[language]}</span>
            {course ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{LEVEL_LABELS[course.level]}</span>
              </>
            ) : null}
            {module ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{module.title}</span>
              </>
            ) : null}
          </>
        }
        title={lesson.title}
        description={lesson.summary}
        actions={
          <Badge tone="pending" withDot>
            Unreviewed content
          </Badge>
        }
      />

      <LessonBody
        lesson={lesson}
        language={language}
        done={done}
        onComplete={() => markComplete(lesson.id)}
        onUncomplete={() => markIncomplete(lesson.id)}
      />

      <div className="flex flex-col gap-3 border-t border-paper-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        {previous ? (
          <Link to={`/app/learn/lessons/${courseId}/${previous.id}`}>
            <Button variant="ghost" leadingIcon={<IconBack width={14} height={14} />}>
              {previous.title}
            </Button>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link to={`/app/learn/lessons/${courseId}/${next.id}`} className="sm:ml-auto">
            <Button variant="secondary" trailingIcon={<IconChevronRight width={14} height={14} />}>
              Next: {next.title}
            </Button>
          </Link>
        ) : (
          <Link to="/app/learn/quizzes" className="sm:ml-auto">
            <Button variant="secondary" trailingIcon={<IconChevronRight width={14} height={14} />}>
              Practise with a quiz
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

/**
 * The lesson body, split out so the speech hook and the block rendering read
 * from one extraction of the lesson.
 */
function LessonBody({
  lesson,
  language,
  done,
  onComplete,
  onUncomplete,
}: {
  readonly lesson: Lesson
  readonly language: StudyLanguage
  readonly done: boolean
  readonly onComplete: () => void
  readonly onUncomplete: () => void
}) {
  const [mode, setMode] = useState<'read' | 'listen'>('read')
  const lines = lessonLines(lesson)
  const quiz = quizForLesson(lesson.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={mode === 'read' ? 'secondary' : 'ghost'}
          onClick={() => setMode('read')}
          aria-pressed={mode === 'read'}
        >
          Read
        </Button>
        <Button
          size="sm"
          variant={mode === 'listen' ? 'secondary' : 'ghost'}
          onClick={() => setMode('listen')}
          aria-pressed={mode === 'listen'}
        >
          Listen line by line
        </Button>
      </div>

      {mode === 'listen' ? (
        <ListenMode lesson={lesson} language={language} lines={lines} />
      ) : (
        <ReadMode lesson={lesson} language={language} />
      )}

      {quiz ? (
        <Link
          to={`/app/learn/quizzes/${quiz.id}`}
          className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-paper-300 bg-white px-4 py-3 transition-colors hover:border-forest-400"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-paper-300 bg-paper-100 text-forest-800">
            <IconQuiz width={17} height={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.875rem] font-medium text-ink-900">{quiz.title}</span>
            <span className="block text-[0.75rem] text-ink-500">
              {quiz.questions.length} questions · {quiz.instructions}
            </span>
          </span>
          <IconChevronRight
            width={15}
            height={15}
            className="shrink-0 text-ink-400 group-hover:text-forest-700"
          />
        </Link>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 px-4 py-3">
        {done ? (
          <>
            <span className="flex items-center gap-2 text-[0.875rem] font-medium text-forest-800">
              <IconCheck width={15} height={15} />
              Marked complete on this device
            </span>
            <Button size="sm" variant="ghost" onClick={onUncomplete} className="ml-auto">
              Undo
            </Button>
          </>
        ) : (
          <>
            <p className="text-[0.8125rem] text-ink-600">
              Finished this lesson? Completion is recorded in this browser only.
            </p>
            <Button size="sm" variant="primary" onClick={onComplete} className="ml-auto">
              Mark as complete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ read mode */

function ReadMode({ lesson, language }: { lesson: Lesson; language: StudyLanguage }) {
  return (
    <div className="space-y-5">
      <ReadAloudPlayer language={language} lines={lessonLines(lesson)} unitLabel="sentences" />

      {/*
        The blocks below carry their own h3 sub-headings (grammar notes,
        listening), so the body needs an h2 above them — otherwise the outline
        jumps h1 → h3 and a screen-reader user loses a level.
      */}
      <section aria-labelledby={`${lesson.id}-body`}>
        <h2 id={`${lesson.id}-body`} className="sr-only">
          Lesson content
        </h2>
        <div className="space-y-5">
        {lesson.blocks.map((block, blockIndex) => {
          const blockKey = `${lesson.id}-b${blockIndex}`
          if (block.kind === 'paragraph') {
            return (
              <p
                key={blockKey}
                lang={language}
                className="font-serif text-[1rem] leading-8 text-ink-800"
              >
                {block.text}
              </p>
            )
          }

          if (block.kind === 'vocabulary') {
            return (
              <div
                key={blockKey}
                // Horizontal scroll belongs to the table, not the page: the phone
                // must never scroll sideways as a whole.
                className="overflow-x-auto rounded-[var(--radius-md)] border border-paper-300"
              >
                <table className="w-full min-w-[22rem] border-collapse text-left">
                  <caption className="sr-only">Vocabulary in this lesson</caption>
                  <thead>
                    <tr className="bg-paper-100">
                      <th
                        scope="col"
                        className="px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-500"
                      >
                        Word
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-500"
                      >
                        Meaning
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.entries.map((entry) => (
                      <tr key={entry.term} className="border-t border-paper-200">
                        <td className="px-3 py-2 align-top">
                          <span lang={language} className="font-serif text-[0.9375rem] text-ink-900">
                            {entry.term}
                          </span>
                          {entry.partOfSpeech ? (
                            <span className="mt-0.5 block text-[0.6875rem] italic text-ink-400">
                              {entry.partOfSpeech}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top text-[0.875rem] leading-6 text-ink-700">
                          {entry.gloss}
                          {entry.note ? (
                            <span className="mt-1 block text-[0.75rem] leading-5 text-ink-500">
                              {entry.note}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }

          if (block.kind === 'example') {
            return (
              <figure
                key={blockKey}
                className="rounded-[var(--radius-md)] border-l-2 border-forest-400 bg-paper-100 px-4 py-3"
              >
                <blockquote
                  lang={language}
                  className="font-serif text-[1rem] leading-7 text-ink-900"
                >
                  {block.target}
                </blockquote>
                <figcaption className="mt-1.5 text-[0.8125rem] leading-5 text-ink-600">
                  {block.gloss}
                  {block.note ? (
                    <span className="mt-1 block text-[0.75rem] text-ink-500">{block.note}</span>
                  ) : null}
                </figcaption>
              </figure>
            )
          }

          if (block.kind === 'grammar') {
            return (
              <div
                key={blockKey}
                className="rounded-[var(--radius-md)] border border-paper-300 bg-white px-4 py-3.5"
              >
                <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-500">
                  {block.title}
                </h3>
                <p className="mt-1.5 text-[0.9375rem] leading-7 text-ink-800">{block.body}</p>
              </div>
            )
          }

          return (
            <div
              key={blockKey}
              className="rounded-[var(--radius-md)] border border-paper-300 bg-white px-4 py-3.5"
            >
              <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-500">
                Listening
              </h3>
              <p className="mt-1.5 text-[0.875rem] leading-6 text-ink-700">{block.prompt}</p>
              <ul className="mt-2.5 space-y-1.5">
                {block.lines.map((line) => (
                  <li key={line.target}>
                    <span lang={language} className="font-serif text-[0.9375rem] text-ink-900">
                      {line.target}
                    </span>
                    <span className="ml-2 text-[0.8125rem] text-ink-500">— {line.gloss}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        </div>
      </section>
    </div>
  )
}

/* ---------------------------------------------------------------- listen mode */

function ListenMode({
  lesson,
  language,
  lines,
}: {
  lesson: Lesson
  language: StudyLanguage
  lines: ReturnType<typeof lessonLines>
}) {
  const speech = useSpeech({ language, lines })

  return (
    <div className="space-y-3">
      <ReadAloudPlayer language={language} lines={lines} unitLabel="sentences" />
      <div className="rounded-[var(--radius-md)] border border-paper-300 bg-white px-3 py-3 sm:px-4">
        {speech.status === 'unavailable' || speech.status === 'unsupported' ? (
          <p className="px-2 text-[0.8125rem] leading-6 text-ink-500">
            Line-by-line playback needs a {STUDY_LANGUAGE_LABELS[language]} voice, which this
            device does not have. The text below is the same content, in order.
          </p>
        ) : (
          <p className="px-2 pb-2 text-[0.75rem] text-ink-400">
            Select any line to hear it again. The highlight follows playback.
          </p>
        )}
        <HighlightedLines
          language={language}
          lines={lines}
          activeIndex={speech.activeIndex}
          onSpeakLine={(index) => speech.speakOne(index)}
          enabled={speech.status !== 'unavailable' && speech.status !== 'unsupported'}
        />
        <p className="mt-3 px-2 text-[0.6875rem] text-ink-400">
          {lesson.blocks.length} content blocks ·{' '}
          {lesson.quizIds.length > 0 ? 'quiz attached' : 'no quiz attached'}
        </p>
      </div>
    </div>
  )
}
