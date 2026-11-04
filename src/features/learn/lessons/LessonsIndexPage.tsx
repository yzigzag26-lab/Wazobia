import { Link } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { IconChevronRight } from '@/components/ui/icons'
import { ComingSoon, LanguageNotSelected } from '../components/LanguageState'
import { STUDY_LANGUAGE_LABELS, isStudyLanguage } from '../language'
import { LEVEL_LABELS } from './index'
import { coursesFor, courseProgress, lessonsInCourse } from './index'
import { useLessonProgress, useStudyStreak } from './useLessonProgress'

/**
 * Lessons index — the language's course catalogue.
 *
 * Level is visible on every card, and completion is shown for the courses that
 * have lessons. There is no "catalogue" that is empty: the counts come from the
 * same data the lesson page renders.
 */
export default function LessonsIndexPage() {
  const { primaryLanguage } = useProfile()
  const { completedLessonIds } = useLessonProgress()
  const { currentDays } = useStudyStreak()

  if (!primaryLanguage) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={<span>Learn · Lessons</span>}
          title="Lessons"
          description="Structured courses from greeting to grammar."
        />
        <LanguageNotSelected />
      </div>
    )
  }

  if (!isStudyLanguage(primaryLanguage)) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={<span>Learn · Lessons</span>} title="Lessons" />
        <ComingSoon languageName={STUDY_LANGUAGE_LABELS[primaryLanguage]} />
      </div>
    )
  }

  const courses = coursesFor(primaryLanguage)
  const languageName = STUDY_LANGUAGE_LABELS[primaryLanguage]

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={<span>Learn · Lessons</span>}
        title={`${languageName} lessons`}
        description="Work through a course in order: each module builds on the one before it. Completing a lesson is recorded in this browser."
        actions={
          currentDays > 0 ? (
            <Badge tone="accent">
              {currentDays} day{currentDays === 1 ? '' : 's'} in a row
            </Badge>
          ) : null
        }
      />

      {courses.length === 0 ? (
        <ComingSoon languageName={languageName} />
      ) : (
        <ul className="space-y-4">
          {courses.map((course) => {
            const progress = courseProgress(course.id, completedLessonIds)
            const lessons = lessonsInCourse(course.id)
            const complete = progress.total > 0 && progress.completed === progress.total

            return (
              <li key={course.id}>
                <Link
                  to={`/app/learn/lessons/${course.id}`}
                  className="group block rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 transition-colors hover:border-forest-400"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{LEVEL_LABELS[course.level]}</Badge>
                        {complete ? <Badge tone="approved">Complete</Badge> : null}
                      </div>
                      <h2 className="mt-2 text-[1.0625rem] font-semibold leading-6 text-ink-900">
                        {course.title}
                      </h2>
                      <p className="mt-1.5 max-w-[58ch] text-[0.875rem] leading-6 text-ink-600">
                        {course.summary}
                      </p>
                    </div>
                    <IconChevronRight
                      width={17}
                      height={17}
                      className="mt-1 shrink-0 text-ink-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-forest-700"
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Progress
                      value={progress.fraction}
                      label={`${course.title} progress`}
                      className="max-w-[22rem] flex-1"
                    />
                    <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-ink-500">
                      {progress.completed} of {progress.total} lessons
                    </span>
                  </div>
                  <p className="mt-2 text-[0.75rem] text-ink-400">
                    {lessons.length} lessons across {course.moduleIds.length} modules
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-[0.75rem] leading-5 text-ink-400">
        Intermediate and advanced courses are not written yet. The catalogue shows only what
        exists, so nothing here is a placeholder you can open and find empty.
      </p>
    </div>
  )
}
