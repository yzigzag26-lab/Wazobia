import { BRIDGE_LANGUAGE, TARGET_LANGUAGES } from '@/config/languages'

/**
 * Launch languages.
 *
 * Every sample string is ordinary, attested vocabulary — greetings and simple
 * phrases. Nothing here is machine-translated for decoration, and nothing is
 * presented as reviewed dictionary content.
 *
 * The key typography demonstration: `Ẹ káàrọ̀` (E + dot below + acute accents)
 * and `Ụtụtụ ọma` (U with dot below, dot-below + acute) render from the verified
 * serif face — see docs/design/typography.md.
 */
const LANGUAGE_SAMPLES: Record<string, { greeting: string; phrase: string; note: string }> = {
  yo: {
    greeting: 'Ẹ káàrọ̀',
    phrase: 'Ṣé àlàáfíà ni?',
    note: 'Tone marks change meaning: ọkọ̀ (vehicle) and ọkọ (husband) are different words.',
  },
  ha: {
    greeting: 'Ina kwana',
    phrase: 'Yaya lafiya?',
    note: 'Hooked letters ɓ ɗ ƙ ƴ are distinct letters, not decorations on b d k y.',
  },
  ig: {
    greeting: 'Ụtụtụ ọma',
    phrase: 'Kedu ka ị mere?',
    note: 'Dotted vowels ị ọ ụ and the ṅ digraph carry meaning across Igbo dialects.',
  },
}

export function LanguageSection() {
  return (
    <section
      id="languages"
      className="scroll-mt-20 border-t border-paper-200 bg-paper-50"
      aria-labelledby="languages-heading"
    >
      <div className="mx-auto w-full max-w-[80rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <p className="text-eyebrow text-forest-700">Launch languages</p>
            <h2 id="languages-heading" className="text-display mt-3 text-[2rem] text-ink-900 sm:text-[2.5rem]">
              Three languages, launched together.
            </h2>
            <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-7 text-ink-600">
              Yorùbá, Hausa and Igbo are treated as equals from the first day — not as translations
              of English. English is available throughout as a bridge language for explanations and
              for anyone starting out.
            </p>

            <div className="mt-7 inline-flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-paper-300 bg-white px-3.5 py-2.5">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Bridge
              </span>
              <span className="text-sm font-medium text-ink-800">{BRIDGE_LANGUAGE.nativeName}</span>
              <span aria-hidden="true" className="text-paper-400">
                ·
              </span>
              <span className="text-xs text-ink-500">
                Supports explanations — it is not the target of the language programme.
              </span>
            </div>
          </div>

          <ul className="grid gap-4">
            {TARGET_LANGUAGES.map((language) => {
              const sample = LANGUAGE_SAMPLES[language.code]
              if (!sample) return null
              return (
                <li
                  key={language.code}
                  className="rounded-[var(--radius-md)] border border-paper-300 bg-white p-5 sm:p-6"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 lang={language.code} className="font-serif text-xl text-ink-900">
                      {language.nativeName}
                    </h3>
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-400">
                      {language.code}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-paper-200 pt-4">
                    <p lang={language.code} className="font-serif text-[1.25rem] text-forest-800">
                      {sample.greeting}
                    </p>
                    <p lang={language.code} className="font-serif text-[1.0625rem] text-ink-600">
                      {sample.phrase}
                    </p>
                  </div>

                  <p className="mt-2.5 text-xs leading-5 text-ink-500">{sample.note}</p>
                </li>
              )
            })}
          </ul>
        </div>

        <p className="mt-10 max-w-[70ch] border-t border-paper-300 pt-6 text-xs leading-6 text-ink-500">
          Additional African languages are added as language records, dialects and reviewed content —
          not by redesigning the platform. Yorùbá tone marks and Hausa/Igbo Unicode characters are
          preserved through storage, search, rendering and export.
        </p>
      </div>
    </section>
  )
}
