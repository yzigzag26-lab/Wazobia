import type { ReactNode } from 'react'
import {
  IconLessons,
  IconProverb,
  IconQuiz,
  IconStory,
} from '@/components/ui/icons'

/**
 * The four Learn pillars.
 *
 * These are *not* destinations. Navigation is five destinations (Learn,
 * Dictionary, AI, Translate, Profile); Learn itself contains exactly four
 * experiences. Keeping this list here — rather than in the destination registry
 * — is what stops Learn from quietly re-acquiring a second level of "navigation"
 * that duplicates the sidebar.
 *
 * Order is fixed and meaningful: study → test → read culture → read narrative.
 */

export type PillarId = 'lessons' | 'quizzes' | 'proverbs' | 'stories'

export interface Pillar {
  readonly id: PillarId
  readonly title: string
  readonly description: string
  readonly href: string
  readonly icon: ReactNode
  /** The line of real content behind the card, so the card is not empty talk. */
  readonly meta: string
}

export const PILLARS: readonly Pillar[] = [
  {
    id: 'lessons',
    title: 'Lessons',
    description:
      'Structured courses at beginner, intermediate and advanced level — vocabulary, grammar, sentence construction and listening, with progress that is kept on this device.',
    href: '/app/learn/lessons',
    icon: <IconLessons width={22} height={22} />,
    meta: 'Language → Course → Module → Lesson',
  },
  {
    id: 'quizzes',
    title: 'Quizzes',
    description:
      'Check what you have learned: multiple choice, matching, sentence completion, translation, grammar and vocabulary recognition — each with an explanation of the answer.',
    href: '/app/learn/quizzes',
    icon: <IconQuiz width={22} height={22} />,
    meta: 'Every question explained',
  },
  {
    id: 'proverbs',
    title: 'Proverb Cards',
    description:
      'Collected sayings with their literal meaning, an explanation, when they are used, and the theme they belong to — 24 per language.',
    href: '/app/learn/proverbs',
    icon: <IconProverb width={22} height={22} />,
    meta: '72 proverbs across three languages',
  },
  {
    id: 'stories',
    title: 'African Stories',
    description:
      'Folktales, traditional tales, and stories of everyday life — with an English translation, vocabulary, expressions, cultural context and a stated moral.',
    href: '/app/learn/stories',
    icon: <IconStory width={22} height={22} />,
    meta: '12 stories, documentation stated',
  },
]

export function findPillar(id: string): Pillar | undefined {
  return PILLARS.find((pillar) => pillar.id === id)
}
