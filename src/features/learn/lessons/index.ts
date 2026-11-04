import type { Course, CourseModule, Lesson, ProficiencyLevel, StudyLanguage } from '../types'
import { HAUSA_COURSES, HAUSA_LESSONS, HAUSA_MODULES } from './hausa-course'
import { IGBO_COURSES, IGBO_LESSONS, IGBO_MODULES } from './igbo-course'
import { YORUBA_COURSES, YORUBA_LESSONS, YORUBA_MODULES } from './yoruba-course'

/**
 * Course catalogue.
 *
 * Hierarchy: Language → Course → Module → Lesson.
 *
 * A `Course`'s `level` is the only thing a learner filters on, so a language can
 * add an intermediate course later without touching any component: append the
 * course, its modules and its lessons to that language's file.
 *
 * Lookups are plain array scans. The whole corpus is a few hundred records, and
 * an index would be premature; if the content ever moves to `GET /api/v1/courses`
 * these functions become the seam where the query goes.
 */

export const COURSES: readonly Course[] = [...YORUBA_COURSES, ...HAUSA_COURSES, ...IGBO_COURSES]
export const MODULES: readonly CourseModule[] = [
  ...YORUBA_MODULES,
  ...HAUSA_MODULES,
  ...IGBO_MODULES,
]
export const LESSONS: readonly Lesson[] = [...YORUBA_LESSONS, ...HAUSA_LESSONS, ...IGBO_LESSONS]

export const LEVEL_LABELS: Readonly<Record<ProficiencyLevel, string>> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function coursesFor(language: StudyLanguage): readonly Course[] {
  return COURSES.filter((course) => course.language === language)
}

export function findCourse(id: string): Course | undefined {
  return COURSES.find((course) => course.id === id)
}

export function findModule(id: string): CourseModule | undefined {
  return MODULES.find((module) => module.id === id)
}

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id)
}

export function modulesFor(courseId: string): readonly CourseModule[] {
  return MODULES.filter((module) => module.courseId === courseId)
}

export function lessonsFor(moduleId: string): readonly Lesson[] {
  return LESSONS.filter((lesson) => lesson.moduleId === moduleId)
}

/** All lessons of a course, in module order — the lesson list on a course page. */
export function lessonsInCourse(courseId: string): readonly Lesson[] {
  return modulesFor(courseId).flatMap((module) =>
    module.lessonIds
      .map((id) => findLesson(id))
      .filter((lesson): lesson is Lesson => lesson !== undefined),
  )
}

/** The lesson before/after this one within its course, for navigation. */
export function adjacentLessons(lessonId: string): {
  readonly previous: Lesson | undefined
  readonly next: Lesson | undefined
} {
  const lesson = findLesson(lessonId)
  if (!lesson) return { previous: undefined, next: undefined }

  const module = findModule(lesson.moduleId)
  if (!module) return { previous: undefined, next: undefined }

  const sequence = lessonsInCourse(module.courseId)
  const index = sequence.findIndex((item) => item.id === lessonId)
  if (index === -1) return { previous: undefined, next: undefined }

  return { previous: sequence[index - 1], next: sequence[index + 1] }
}

/**
 * Course progress as a fraction, from completed lesson ids.
 *
 * Progress is device-local (there is no account), so this is a view helper, not
 * a source of truth. Returning `0` for an empty course rather than `NaN` keeps
 * the progress bar honest.
 */
export function courseProgress(
  courseId: string,
  completedLessonIds: readonly string[],
): { readonly completed: number; readonly total: number; readonly fraction: number } {
  const lessons = lessonsInCourse(courseId)
  const completed = lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length
  const total = lessons.length
  return { completed, total, fraction: total === 0 ? 0 : completed / total }
}
