/**
 * "Why African languages matter" + preservation.
 *
 * Deliberately free of statistics. The brief forbids invented numbers, and any
 * credible claim about speaker counts would need sourcing WAZOBIA does not yet
 * have. These paragraphs make qualitative points only.
 */
const PILLARS = [
  {
    title: 'Meaning lives in the marks',
    body: 'In Yorùbá, tone marks are not accents added for appearance \u2014 they carry meaning. Drop them and words collapse into each other. Preserving them is a data requirement, not a styling choice.',
  },
  {
    title: 'Dialects are not errors',
    body: 'Regional variation is legitimate. Where WAZOBIA cannot represent a dialect faithfully, it says so instead of picking one form and presenting it as universal.',
  },
  {
    title: 'Preservation needs provenance',
    body: 'A proverb carries a source, a region, a speaker and a set of rights. WAZOBIA keeps those attached, so cultural material is credited rather than extracted.',
  },
] as const

export function WhyItMatters() {
  return (
    <section
      id="why"
      className="scroll-mt-20 border-t border-paper-200 bg-white"
      aria-labelledby="why-heading"
    >
      <div className="mx-auto w-full max-w-[80rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-eyebrow text-forest-700">Why it matters</p>
            <h2 id="why-heading" className="text-display mt-3 text-[2rem] text-ink-900 sm:text-[2.5rem]">
              A language held only in speech is one generation from being lost.
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-7 text-ink-600">
              African languages are spoken by hundreds of millions of people and remain
              under-represented in the digital tools most people now use every day. WAZOBIA is built
              to close that gap without flattening the languages to fit the technology.
            </p>
          </div>

          <ul className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-paper-300">
            {PILLARS.map((pillar) => (
              <li key={pillar.title} className="bg-white p-5 sm:p-6">
                <h3 className="text-[1rem] font-semibold text-ink-900">{pillar.title}</h3>
                <p className="mt-2 text-[0.875rem] leading-6 text-ink-600">{pillar.body}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Preservation feature block */}
        <div
          id="preserve"
          className="mt-14 grid scroll-mt-20 gap-8 rounded-[var(--radius-lg)] border border-forest-100 bg-forest-50 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          <div>
            <p className="text-eyebrow text-forest-700">Learning &amp; preservation</p>
            <h3 className="text-display mt-2.5 text-[1.625rem] text-ink-900 sm:text-[1.875rem]">
              Preserve what a dictionary cannot hold.
            </h3>
            <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-7 text-ink-600">
              Proverbs, folktales, oral histories and regional vocabulary live alongside the
              dictionary — each with its original form, meaning, context, region, source and rights.
              A speaker&rsquo;s recording and its transcript are kept as separate but linked assets,
              so the record stays honest.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-1">
            {[
              ['Original form', 'Kept verbatim'],
              ['Context', 'Region & dialect'],
              ['Rights', 'Community-held'],
              ['Review', 'Human-approved'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-forest-700">
                  {k}
                </dt>
                <dd className="mt-0.5 text-sm text-ink-700">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
