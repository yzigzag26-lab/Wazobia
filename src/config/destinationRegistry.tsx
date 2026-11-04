import {
  IconAi,
  IconDictionary,
  IconLearn,
  IconProfile,
  IconTranslate,
} from '@/components/ui/icons'
import type { Destination } from './destinations'

/**
 * The five approved WAZOBIA destinations, in product order.
 *
 * Every navigation surface — desktop sidebar, phone bottom bar, phone "More"
 * sheet, marketing footer, application entry grid and page titles — derives
 * from this array. There is exactly one place to add, rename or re-order a
 * destination.
 *
 * `status` is deliberately honest. `learn` is `available` because its lessons,
 * quizzes, proverbs and stories are real, reviewed client-side content rather
 * than a placeholder. The three utilities stay `awaiting-backend` because their
 * value depends on services that do not exist yet. Nothing here is `planned`
 * today, but the status remains part of the model for future destinations.
 */
export const DESTINATIONS: readonly Destination[] = [
  {
    id: 'learn',
    name: 'WAZOBIA Learn',
    shortName: 'Learn',
    href: '/app/learn',
    summary: 'Lessons, quizzes, proverb cards and African stories.',
    status: 'available',
    tier: 'primary',
    icon: <IconLearn />,
    primaryMobile: true,
  },
  {
    id: 'dictionary',
    name: 'WAZOBIA Dictionary',
    shortName: 'Dictionary',
    href: '/app/dictionary',
    summary: 'Search words and phrases with tone marks, senses and examples.',
    status: 'awaiting-backend',
    tier: 'utility',
    icon: <IconDictionary />,
    primaryMobile: true,
  },
  {
    id: 'ai',
    name: 'WAZOBIA AI',
    shortName: 'AI',
    href: '/app/ai',
    summary: 'Ask about African languages, culture, grammar and meaning.',
    status: 'awaiting-backend',
    tier: 'utility',
    icon: <IconAi />,
    primaryMobile: true,
  },
  {
    id: 'translate',
    name: 'WAZOBIA Translate',
    shortName: 'Translate',
    href: '/app/translate',
    summary: 'Translate between Yorùbá, Hausa, Igbo and English with context.',
    status: 'awaiting-backend',
    tier: 'utility',
    icon: <IconTranslate />,
    primaryMobile: true,
  },
  {
    id: 'profile',
    name: 'Profile',
    shortName: 'Profile',
    href: '/app/profile',
    summary: 'Your details, language preferences, appearance and security.',
    status: 'available',
    tier: 'account',
    icon: <IconProfile />,
    primaryMobile: true,
  },
] as const

/**
 * Destinations shown in the phone bottom bar.
 *
 * With five destinations they now all fit: the bar renders exactly one item per
 * destination and needs no "More" surface. This constant is kept (rather than
 * deleted) because the bar is still a filtered view of the registry, and adding
 * a sixth destination later should not silently overflow the bar.
 */
export const PRIMARY_MOBILE_DESTINATIONS: readonly Destination[] = DESTINATIONS.filter(
  (destination) => destination.primaryMobile,
)

/** Destinations only reachable from the phone "More" sheet. Empty today. */
export const SECONDARY_MOBILE_DESTINATIONS: readonly Destination[] = DESTINATIONS.filter(
  (destination) => !PRIMARY_MOBILE_DESTINATIONS.includes(destination),
)

export function findDestinationByPath(pathname: string): Destination | undefined {
  return DESTINATIONS.find(
    (destination) => pathname === destination.href || pathname.startsWith(`${destination.href}/`),
  )
}

export function findDestinationById(id: string): Destination | undefined {
  return DESTINATIONS.find((destination) => destination.id === id)
}

export const STATUS_LABELS = {
  available: 'Available',
  'awaiting-backend': 'In development',
  planned: 'Planned',
} as const

export const STATUS_TONE = {
  available: 'approved',
  'awaiting-backend': 'pending',
  planned: 'neutral',
} as const
