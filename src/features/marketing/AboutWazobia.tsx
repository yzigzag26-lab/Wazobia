/**
 * "About WAZOBIA" — the identity section.
 *
 * Replaces the earlier technical module inventory. This is a marketing surface:
 * it speaks about who WAZOBIA is, what it stands for and how it is built, in
 * professional language. It deliberately carries no build-status badges, no
 * "Explore" links and no engineering vocabulary — those belong inside the
 * application, where each destination already states its own status plainly.
 *
 * No statistics, user counts, testimonials or achievements appear here. Every
 * claim is about purpose, standards or method — things that are true by design
 * rather than by measurement we cannot yet support.
 */

const PRINCIPLES = [
  {
    title: 'Equality at the foundation',
    body: 'Yorùbá, Hausa and Igbo are treated as first-class languages, not as translations of English. Every feature is designed for them first, and English sits beside them as a bridge.',
  },
  {
    title: 'Clarity over confidence',
    body: 'Where WAZOBIA is uncertain — a dialect it does not yet cover, a voice it has not validated — it says so plainly. A language platform earns trust by being specific about what it knows.',
  },
  {
    title: 'Review before publication',
    body: 'Machine assistance can propose; people decide what becomes canonical. Contributions are reviewed by speakers and specialists, and nothing is published automatically.',
  },
  {
    title: 'Consent is not a checkbox',
    body: 'Taking part publicly, contributing to research and allowing use in AI training are separate decisions here. Permission for one is never treated as permission for another.',
  },
] as const

const PILLARS = [
  {
    label: 'Our purpose',
    heading: 'Language tools built for the people who speak them',
    body: 'WAZOBIA exists so that learning, translating and preserving an African language does not require leaving it behind. The platform is designed for learners, families, teachers, writers and researchers — the people who use these languages every day.',
  },
  {
    label: 'Our standard',
    heading: 'A language product held to linguistic standards',
    body: 'Tone marks, orthography and dialect variation are treated as data, not decoration. Correctness is measured per language and per direction of translation, reviewed by native speakers rather than assumed from a single score.',
  },
  {
    label: 'Our responsibility',
    heading: 'Cultural material stays attributed and accountable',
    body: 'Proverbs, folktales and oral histories carry their source, region and rights with them. Communities can request correction, withdrawal or takedown — and those requests are part of the product, not an afterthought.',
  },
] as const

const COMMITMENTS = [
  ['Nigeria first', 'Launched from Nigeria, designed to extend across Africa by adding languages, not rebuilding.'],
  ['Free to begin', 'The core language experience is intended to stay open and usable while the platform grows.'],
  ['Governed data', 'Research access runs on explicit consent, documented provenance and a defined permitted purpose.'],
  ['Accountable design', 'Accessibility, privacy and age-appropriate safeguards are part of the brief, not a later phase.'],
] as const

export function AboutWazobia() {
  return (
    <section
      id="about"
      className="scroll-mt-20 border-t border-paper-200 bg-white"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto w-full max-w-[80rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* ------------------------------------------------------- intro */}
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <p className="text-eyebrow text-forest-700">About WAZOBIA</p>
            <h2
              id="about-heading"
              className="text-display mt-3 text-[2rem] text-ink-900 sm:text-[2.5rem]"
            >
              An African language ecosystem, built with the seriousness the languages deserve.
            </h2>
          </div>

          <div className="space-y-4 text-[0.9375rem] leading-7 text-ink-600">
            <p>
              WAZOBIA is a language technology platform with a single purpose: to make African
              languages fully usable in the digital tools people rely on every day. It brings
              translation, structured learning, pronunciation, a dictionary, moderated community,
              cultural preservation and governed research into one coherent platform rather than
              a set of disconnected tools.
            </p>
            <p>
              The name itself is a Nigerian invitation — <em>wa</em>, <em>zo</em>, <em>bia</em>,{' '}
              <em>ya</em> — come. It reflects how the platform began: three languages arriving
              together, in a country where they are all spoken, read and taught.
            </p>
            <p>
              WAZOBIA is built in Nigeria for Africa. The ambition is continental; the method is
              deliberately careful. Languages are added as reviewed records and validated content,
              never as features switched on before they are ready.
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------- principles */}
        <div className="mt-14">
          <h3 className="text-eyebrow text-ink-500">What we hold to</h3>
          <ul className="mt-5 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-paper-300 sm:grid-cols-2">
            {PRINCIPLES.map((principle, index) => (
              <li key={principle.title} className="bg-white p-5 sm:p-6">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[0.625rem] text-ink-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h4 className="text-[1rem] font-semibold leading-6 text-ink-900">
                    {principle.title}
                  </h4>
                </div>
                <p className="mt-2 text-[0.875rem] leading-6 text-ink-600">{principle.body}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* ------------------------------------------------------- pillars */}
        <div className="mt-14 border-t border-paper-200 pt-12">
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {PILLARS.map((pillar) => (
              <article key={pillar.label}>
                <p className="text-eyebrow text-forest-700">{pillar.label}</p>
                <h3 className="mt-2.5 text-[1.125rem] font-semibold leading-7 text-ink-900">
                  {pillar.heading}
                </h3>
                <p className="mt-2.5 text-[0.875rem] leading-6 text-ink-600">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>

        {/* --------------------------------------------------- commitments */}
        <div className="mt-12 rounded-[var(--radius-lg)] border border-forest-100 bg-forest-50 p-6 sm:p-8">
          <h3 className="text-eyebrow text-forest-700">Our commitments</h3>
          <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {COMMITMENTS.map(([term, definition]) => (
              <div key={term}>
                <dt className="text-[0.875rem] font-semibold text-ink-900">{term}</dt>
                <dd className="mt-1 text-[0.8125rem] leading-6 text-ink-600">{definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
