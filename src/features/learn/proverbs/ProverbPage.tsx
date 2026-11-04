import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconBack, IconChevronRight, IconInfo } from '@/components/ui/icons'
import { NotFoundInline } from '../components/NotFoundInline'
import { ReadAloudPlayer } from '../readAloud/ReadAloudPlayer'
import { findProverb, PROVERB_THEME_LABELS } from './index'
import { ProverbIllustration } from './ProverbIllustration'
import { STUDY_LANGUAGE_LABELS } from '../language'
import type { ContentProvenance } from '../types'

/**
 * Single proverb card.
 *
 * The layout answers, in order: what does it say, what does it literally mean,
 * what does it teach, when would you hear it. That ordering is deliberate — the
 * literal rendering is never skipped, because the distance between the literal
 * and the teaching is most of what a proverb is.
 *
 * The provenance block is not a footnote. It states in plain words whether this
 * came from a published collection, and that review has not happened. Nothing
 * here claims a specific source it cannot produce.
 */
export default function ProverbPage() {
  const { proverbId = '' } = useParams()
  const proverb = findProverb(proverbId)

  if (!proverb) {
    return (
      <NotFoundInline
        title="Proverb not found"
        description="No card has this id. The proverb bank in this build has 72 entries across Yorùbá, Hausa and Igbo."
        backTo="/app/learn/proverbs"
        backLabel="All proverb cards"
      />
    )
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-[0.75rem] text-ink-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/app/learn/proverbs" className="hover:text-ink-900">
              Proverb Cards
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-800">
            {PROVERB_THEME_LABELS[proverb.theme]}
          </li>
        </ol>
      </nav>

      <article className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
        <div className="flex flex-col items-center gap-4 border-b border-paper-200 bg-paper-100 px-5 py-8 sm:flex-row sm:items-center sm:gap-8 sm:px-8">
          <ProverbIllustration
            visual={proverb.visual}
            className="h-[104px] w-auto shrink-0 sm:h-[128px]"
          />
          <div className="min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge tone="neutral">{STUDY_LANGUAGE_LABELS[proverb.language]}</Badge>
              <Badge tone="info">{PROVERB_THEME_LABELS[proverb.theme]}</Badge>
            </div>
            <h1
              lang={proverb.language}
              className="mt-3 text-balance font-serif text-[1.5rem] leading-[1.45] text-ink-900 sm:text-[1.75rem]"
            >
              {proverb.original}
            </h1>
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          <ReadAloudPlayer
            language={proverb.language}
            lines={[{ id: 'proverb', text: proverb.original, kind: 'paragraph' }]}
            unitLabel="line"
          />

          <Section title="Literal meaning">
            <p className="text-[0.9375rem] leading-7 text-ink-800">{proverb.literal}</p>
          </Section>

          <Section title="What it teaches">
            <p className="text-[0.9375rem] leading-7 text-ink-800">{proverb.meaning}</p>
          </Section>

          <Section title="When it is used">
            <p className="text-[0.9375rem] leading-7 text-ink-700">{proverb.context}</p>
          </Section>

          {proverb.variation ? (
            <Section title="Variation">
              <p className="text-[0.9375rem] leading-7 text-ink-700">{proverb.variation}</p>
            </Section>
          ) : null}

          <ProvenanceBlock provenance={proverb.provenance} />
        </div>
      </article>

      <div className="flex flex-wrap items-center gap-2">
        <Link to="/app/learn/proverbs">
          <Button variant="ghost" leadingIcon={<IconBack width={14} height={14} />}>
            All cards
          </Button>
        </Link>
        <Link to="/app/learn/stories" className="ml-auto">
          <Button variant="secondary" trailingIcon={<IconChevronRight width={14} height={14} />}>
            Read a story
          </Button>
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
        {title}
      </h2>
      <div className="mt-1.5">{children}</div>
    </section>
  )
}

/**
 * Provenance and verification, stated plainly.
 *
 * Two separate facts, and they are never merged into one badge: where the text
 * came from, and whether a speaker has checked it. A proverb can be well
 * documented and still unreviewed — that is exactly the state of this bank.
 */
export function ProvenanceBlock({ provenance }: { readonly provenance: ContentProvenance }) {
  const originLabel =
    provenance.provenance === 'documented-traditional'
      ? 'Widely recorded traditional saying'
      : provenance.provenance === 'adaptation'
        ? 'Adapted from a traditional source'
        : 'Written for WAZOBIA'

  const reviewLabel =
    provenance.reviewStatus === 'reviewed'
      ? 'Checked by a native-speaker reviewer'
      : provenance.reviewStatus === 'in-review'
        ? 'Awaiting native-speaker review'
        : 'Not yet reviewed by a native speaker'

  return (
    <div className="rounded-[var(--radius-md)] border border-paper-300 bg-paper-50 p-4">
      <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-500">
        <IconInfo width={13} height={13} />
        Provenance
      </p>
      <dl className="mt-2.5 space-y-1.5 text-[0.8125rem] leading-5">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink-500">Origin:</dt>
          <dd className="text-ink-800">{originLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink-500">Verification:</dt>
          <dd className="text-ink-800">{reviewLabel}</dd>
        </div>
        {provenance.source ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">Source note:</dt>
            <dd className="text-ink-800">{provenance.source}</dd>
          </div>
        ) : null}
        {provenance.region ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">Region:</dt>
            <dd className="text-ink-800">{provenance.region}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
