import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { IconCheck, IconChevronRight, IconPlay } from '@/components/ui/icons'
import { NotFoundInline } from '../components/NotFoundInline'
import { courseProgress, findCourse, modulesFor, findLesson } from './index'
import { LEVEL_LABELS } from './index'
import { useLessonProgress } from './useLessonProgress'
import { STUDY_LANGUAGE_LABELS } from '../language'
import { cn } from '@/utils/cn'

/**
 * Course page — Language → Course → **Module → Lesson**.
 *
 * Modules are rendered as sections with their lessons listed beneath, rather
 * than as a second navigation level. That is the whole hierarchy on one screen,
 * which is what makes "where am I and what is next" answerable without
 * clicking through three pages.
 *
 * Locked sequence: lessons unlock in order. The rule is visible (a "Next up"
 * badge) rather than mysterious, and the reason is stated on the card. It is a
 * teaching decision, not a paywall — nothing is hidden behind it and every
 * lesson's content is still reachable from its own URL, so a learner who wants
 * to jump ahead can. The lock is guidance, and it is labelled as guidance.
 */
export default function CoursePage() {
  const { courseId = '' } = useParams()
  const course = findCourse(courseId)
  const { isComplete, completedLessonIds } = useLessonProgress()

  if (!course) {
    return (
      <NotFoundInline
        title="Course not found"
        description="This course does not exist in the catalogue. It may have been renamed, or the link may be from an older build."
        backTo="/app/learn/lessons"
        backLabel="All courses"
      />
    )
  }

  const modules = modulesFor(course.id)
  const progress = courseProgress(course.id, completedLessonIds)

  /** First lesson that is not yet complete — the "Next up" marker. */
  const nextLessonId = modules
    .flatMap((module) => module.lessonIds)
    .find((lessonId) => !isComplete(lessonId))

  return (
    <div className="space-y-7">
      <nav aria-label="Breadcrumb" className="text-[0.75rem] text-ink-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/app/learn" className="hover:text-ink-900">
              Learn
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/app/learn/lessons" className="hover:text-ink-900">
              Lessons
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-800">
            {course.title}
          </li>
        </ol>
      </nav>

      <PageHeader
        eyebrow={
          <>
            <span>{STUDY_LANGUAGE_LABELS[course.language]}</span>
            <span aria-hidden="true">·</span>
            <span>{LEVEL_LABELS[course.level]}</span>
          </>
        }
        title={course.title}
        description={course.summary}
        actions={
          nextLessonId ? (
            <Link to={`/app/learn/lessons/${course.id}/${nextLessonId}`}>
              <Button leadingIcon={<IconPlay width={14} height={14} />}>
                {progress.completed === 0 ? 'Start course' : 'Continue'}
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="flex items-center gap-3">
        <Progress
          value={progress.fraction}
          label={`${course.title} progress`}
          className="max-w-[26rem] flex-1"
        />
        <span className="shrink-0 font-mono text-[0.75rem] tabular-nums text-ink-600">
          {progress.completed}/{progress.total}
        </span>
      </div>

      <div className="space-y-6">
        {modules.map((module, moduleIndex) => (
          <section key={module.id} aria-labelledby={`${module.id}-heading`}>
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-[0.6875rem] tabular-nums text-ink-400">
                {String(moduleIndex + 1).padStart(2, '0')}
              </span>
              <h2
                id={`${module.id}-heading`}
                className="text-[0.9375rem] font-semibold text-ink-900"
              >
                {module.title}
              </h2>
            </div>
            <p className="ml-6 mt-1 text-[0.8125rem] leading-5 text-ink-500">{module.summary}</p>

            <ol className="mt-3 ml-6 space-y-2">
              {module.lessonIds.map((lessonId) => {
                const lesson = findLesson(lessonId)
                if (!lesson) return null
                const done = isComplete(lesson.id)
                const isNext = lesson.id === nextLessonId

                return (
                  <li key={lesson.id}>
                    <Link
                      to={`/app/learn/lessons/${course.id}/${lesson.id}`}
                      className={cn(
                        'group flex items-start gap-3 rounded-[var(--radius-md)] border px-3.5 py-3',
                        'transition-colors duration-100',
                        isNext
                          ? 'border-forest-400 bg-forest-50'
                          : 'border-paper-300 bg-white hover:border-ink-400',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[0.625rem]',
                          done
                            ? 'border-brand-600 bg-brand-600 text-on-brand'
                            : 'border-paper-300 bg-paper-100 text-ink-400',
                        )}
                      >
                        {done ? <IconCheck width={11} height={11} /> : null}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'text-[0.875rem] font-medium leading-5',
                              done ? 'text-ink-600' : 'text-ink-900',
                            )}
                          >
                            {lesson.title}
                          </span>
                          {isNext ? <Badge tone="accent">Next up</Badge> : null}
                          {done ? (
                            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-forest-700">
                              Completed
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-[0.8125rem] leading-5 text-ink-500">
                          {lesson.summary}
                        </span>
                        <span className="mt-1 block text-[0.6875rem] text-ink-400">
                          {lesson.minutes} min
                          {lesson.quizIds.length > 0 ? ' · quiz included' : ''}
                        </span>
                      </span>

                      <IconChevronRight
                        width={15}
                        height={15}
                        className="mt-1 shrink-0 text-ink-400 group-hover:text-forest-700"
                      />
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}
