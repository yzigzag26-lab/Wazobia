import { useProfile } from '@/hooks/useProfile'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { LanguageNotSelected } from './components/LanguageState'
import { PILLARS } from './pillars'
import { PillarCard } from './components/PillarCard'
import { STUDY_LANGUAGE_LABELS } from './language'

/**
 * WAZOBIA Learn hub.
 *
 * The whole of Learn is four cards, in a fixed order. No carousel, no
 * "explore further" rail, no fifth module smuggled in as a promotion: the
 * brief says exactly four, and adding a fifth would make the information
 * architecture a lie.
 *
 * The language is never asked for here. It comes from onboarding, via the
 * profile context. If it is unsupported, every pillar shows Coming Soon and
 * this page says so once, at the top, instead of pretending.
 */
export default function LearnPage() {
  const { primaryLanguage } = useProfile()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<span>WAZOBIA Learn</span>}
        title="Learn an African language properly"
        description={
          primaryLanguage
            ? `Studying ${STUDY_LANGUAGE_LABELS[primaryLanguage]}. Four ways in: work through the course, check yourself with a quiz, learn a proverb, read a story.`
            : 'Four ways into the language you are studying: work through the course, check yourself with a quiz, learn a proverb, read a story.'
        }
        actions={
          primaryLanguage ? (
            <Badge tone="accent" withDot>
              {STUDY_LANGUAGE_LABELS[primaryLanguage]}
            </Badge>
          ) : null
        }
      />

      {!primaryLanguage ? <LanguageNotSelected /> : null}

      <section aria-labelledby="learn-pillars-heading">
        <h2 id="learn-pillars-heading" className="sr-only">
          Learning experiences
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <PillarCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </section>

      <p className="max-w-[62ch] text-[0.8125rem] leading-6 text-ink-500">
        Progress and saved cards are kept in this browser only. WAZOBIA Learn has no
        account sync yet, so signing in on another device will not carry them across.
      </p>
    </div>
  )
}
