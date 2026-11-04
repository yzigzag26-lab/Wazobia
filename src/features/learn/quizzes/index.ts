import type { ProficiencyLevel, Quiz, StudyLanguage } from '../types'
import { HAUSA_QUIZZES } from './hausa-quizzes'
import { IGBO_QUIZZES } from './igbo-quizzes'
import { STORY_QUIZZES } from './story-quizzes'
import { YORUBA_QUIZZES } from './yoruba-quizzes'

/**
 * Quiz bank.
 *
 * Two kinds live here, deliberately in one array: course quizzes (attached to a
 * lesson via `lessonId`) and story comprehension quizzes (attached via
 * `Story.comprehensionQuizIds`). The difference is only which surface links to
 * them, so they share one lookup and one player.
 */
export const QUIZZES: readonly Quiz[] = [
  ...YORUBA_QUIZZES,
  ...HAUSA_QUIZZES,
  ...IGBO_QUIZZES,
  ...STORY_QUIZZES,
]

export function quizzesFor(language: StudyLanguage): readonly Quiz[] {
  return QUIZZES.filter((quiz) => quiz.language === language)
}

export function findQuiz(id: string): Quiz | undefined {
  return QUIZZES.find((quiz) => quiz.id === id)
}

export function quizForLesson(lessonId: string): Quiz | undefined {
  return QUIZZES.find((quiz) => quiz.lessonId === lessonId)
}

export function findQuizzes(ids: readonly string[]): readonly Quiz[] {
  return ids
    .map((id) => findQuiz(id))
    .filter((quiz): quiz is Quiz => quiz !== undefined)
}

export const QUIZ_KIND_LABELS: Readonly<Record<Quiz['questions'][number]['kind'], string>> = {
  'multiple-choice': 'Multiple choice',
  matching: 'Matching',
  'sentence-completion': 'Sentence completion',
  translation: 'Translation',
  listening: 'Listening',
  grammar: 'Grammar',
  ordering: 'Ordering',
  vocabulary: 'Vocabulary',
}

export const LEVELS: readonly ProficiencyLevel[] = ['beginner', 'intermediate', 'advanced']
