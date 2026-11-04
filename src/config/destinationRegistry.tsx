import {
  IconAi,
  IconCommunity,
  IconDictionary,
  IconLearn,
  IconPreserve,
  IconResearch,
  IconSpeak,
  IconTranslate,
} from '@/components/ui/icons'
import type { Destination } from './destinations'

/**
 * The eight approved WAZOBIA destinations (blueprint §4).
 *
 * Every navigation surface — desktop sidebar, phone bottom bar, phone "More"
 * sheet, command/search palette, page metadata — derives from this array.
 * There is exactly one place to add, rename or re-order a destination.
 *
 * `status` is deliberately honest. It describes what actually exists today, so
 * no navigation item can imply a working feature that is not built. Update it
 * only when the corresponding phase ships.
 */
export const DESTINATIONS: readonly Destination[] = [
  {
    id: 'ai',
    name: 'WAZOBIA AI',
    shortName: 'AI',
    href: '/app/ai',
    summary: 'Ask about African languages, culture, grammar and meaning.',
    status: 'awaiting-backend',
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
    icon: <IconTranslate />,
    primaryMobile: true,
  },
  {
    id: 'learn',
    name: 'WAZOBIA Learn',
    shortName: 'Learn',
    href: '/app/learn',
    summary: 'Structured courses, vocabulary, listening and Read Aloud.',
    status: 'awaiting-backend',
    icon: <IconLearn />,
    primaryMobile: true,
  },
  {
    id: 'speak',
    name: 'WAZOBIA Speak',
    shortName: 'Speak',
    href: '/app/speak',
    summary: 'Listen to reference pronunciation and practise your own.',
    status: 'awaiting-backend',
    icon: <IconSpeak />,
    primaryMobile: false,
  },
  {
    id: 'dictionary',
    name: 'WAZOBIA Dictionary',
    shortName: 'Dictionary',
    href: '/app/dictionary',
    summary: 'Search words and phrases with tone marks, senses and examples.',
    status: 'awaiting-backend',
    icon: <IconDictionary />,
    primaryMobile: true,
  },
  {
    id: 'community',
    name: 'WAZOBIA Community',
    shortName: 'Community',
    href: '/app/community',
    summary: 'Moderated discussion, language exchange and Q&A with speakers.',
    status: 'planned',
    icon: <IconCommunity />,
    primaryMobile: false,
  },
  {
    id: 'preserve',
    name: 'WAZOBIA Preserve',
    shortName: 'Preserve',
    href: '/app/preserve',
    summary: 'Proverbs, folktales and oral histories, kept with their provenance.',
    status: 'planned',
    icon: <IconPreserve />,
    primaryMobile: false,
  },
  {
    id: 'research',
    name: 'WAZOBIA Research & AI Data',
    shortName: 'Research',
    href: '/app/research',
    summary: 'Governed datasets, benchmarks and research requests.',
    status: 'planned',
    icon: <IconResearch />,
    primaryMobile: false,
  },
] as const

/** Destinations shown in the phone bottom bar. Capped at four by design. */
export const PRIMARY_MOBILE_DESTINATIONS: readonly Destination[] = DESTINATIONS.filter(
  (destination) => destination.primaryMobile,
).slice(0, 4)

/** Destinations reachable from the phone "More" sheet. */
export const SECONDARY_MOBILE_DESTINATIONS: readonly Destination[] = DESTINATIONS.filter(
  (destination) => !PRIMARY_MOBILE_DESTINATIONS.includes(destination),
)

export function findDestinationByPath(pathname: string): Destination | undefined {
  return DESTINATIONS.find(
    (destination) => pathname === destination.href || pathname.startsWith(`${destination.href}/`),
  )
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
