const STEPS = [
  {
    step: '01',
    title: 'Ask in your own language',
    body: 'Start with Yorùbá, Hausa, Igbo or English. The platform responds in the language you chose, not in English by default.',
  },
  {
    step: '02',
    title: 'Built on reviewed knowledge',
    body: 'Answers draw on WAZOBIA\u2019s own reviewed dictionary, lessons and cultural records — and every answer is labelled as either reviewed content or an AI suggestion.',
  },
  {
    step: '03',
    title: 'Practise until it sticks',
    body: 'Lessons, listening exercises and Read Aloud give you something to work with — with a clear notice whenever a language has no approved voice yet.',
  },
  {
    step: '04',
    title: 'Add what you know',
    body: 'Speakers and communities contribute proverbs, folktales and regional vocabulary. Contributions are reviewed by people, never published automatically.',
  },
] as const

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-paper-200 bg-forest-900 text-paper-50"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto w-full max-w-[80rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-[54ch]">
          <p className="text-eyebrow text-gold-500">How WAZOBIA works</p>
          <h2 id="how-heading" className="text-display mt-3 text-[2rem] sm:text-[2.5rem]">
            Language technology with a human review path.
          </h2>
          <p className="mt-4 text-[0.9375rem] leading-7 text-paper-200/85">
            Generated text and human-reviewed knowledge are different things, and WAZOBIA never
            blurs them. That distinction is the whole design.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-forest-700 bg-forest-700 sm:grid-cols-2">
          {STEPS.map((item) => (
            <li key={item.step} className="bg-forest-900 p-6 sm:p-7">
              <span className="font-mono text-[0.6875rem] tracking-[0.12em] text-gold-500">
                {item.step}
              </span>
              <h3 className="mt-3 text-[1.0625rem] font-semibold text-paper-50">{item.title}</h3>
              <p className="mt-2 text-[0.875rem] leading-6 text-paper-200/75">{item.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-6 border-t border-forest-700 pt-8 sm:grid-cols-3">
          {[
            { k: 'Provenance', v: 'Every answer labelled as AI-generated or reviewed.' },
            { k: 'Consent', v: 'Publication, research and AI-training permission are separate.' },
            { k: 'Community', v: 'Speakers can correct and enrich what the platform knows.' },
          ].map((item) => (
            <div key={item.k}>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-gold-500">
                {item.k}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-paper-200/80">{item.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
