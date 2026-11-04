import { Link } from 'react-router-dom'
import { WazobiaLogo } from '@/components/brand/WazobiaLogo'
import { IconArrowRight } from '@/components/ui/icons'
import { useSession } from '@/hooks/useSession'

/** Greetings used as the hero's language gesture — attested, ordinary greetings. */
const GREETINGS = [
  { code: 'yo', native: 'Ẹ káàrọ̀', name: 'Yorùbá', gloss: 'Good morning' },
  { code: 'ha', native: 'Ina kwana', name: 'Hausa', gloss: 'Good morning' },
  { code: 'ig', native: 'Ụtụtụ ọma', name: 'Igbo', gloss: 'Good morning' },
] as const

export function Hero() {
  const { isGuest, startGuestSession } = useSession()

  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      {/* One soft radial brand glow behind the emblem. No gradient washes. */}
      <div aria-hidden="true" className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-[520px]" />

      <div className="relative mx-auto w-full max-w-[80rem] px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* ------------------------------------------------------- copy */}
          <div className="min-w-0 animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-forest-100 bg-forest-50 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-forest-700">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-lime-400" />
              Nigeria first · Yorùbá · Hausa · Igbo
            </p>

            <h1 id="hero-heading" className="text-display mt-5 text-[2.75rem] text-ink-900 sm:text-[3.5rem] lg:text-[4rem]">
              Africa speaks.
              <br />
              <span className="text-forest-700">Let&rsquo;s understand</span>
              <br />
              every voice.
            </h1>

            <p className="mt-6 max-w-[52ch] text-[1.0625rem] leading-8 text-ink-600">
              Discover, learn and experience African languages through intelligent translation,
              interactive learning, pronunciation and cultural preservation.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/app"
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-button)] bg-forest-800 px-5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-forest-900"
              >
                Explore WAZOBIA
                <IconArrowRight width={16} height={16} />
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-11 items-center rounded-[var(--radius-button)] border border-paper-400 bg-white px-5 text-[0.9375rem] font-medium text-ink-800 transition-colors hover:border-forest-600 hover:text-forest-800"
              >
                Create free account
              </Link>
            </div>

            <p className="mt-4 text-[0.9375rem] text-ink-500">
              {isGuest ? (
                <Link to="/app" className="font-medium text-forest-700 underline underline-offset-4 hover:text-forest-800">
                  You are browsing as a guest — open the app
                </Link>
              ) : (
                <>
                  Not ready to sign up?{' '}
                  <Link
                    to="/app"
                    onClick={startGuestSession}
                    className="font-medium text-forest-700 underline underline-offset-4 hover:text-forest-800"
                  >
                    Continue as guest
                  </Link>{' '}
                  — no account needed.
                </>
              )}
            </p>

            {/* Language gesture */}
            <dl className="mt-10 grid max-w-lg gap-4 border-t border-paper-300 pt-6 sm:grid-cols-3">
              {GREETINGS.map((greeting) => (
                <div key={greeting.code}>
                  <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
                    {greeting.name}
                  </dt>
                  <dd lang={greeting.code} className="mt-1.5 font-serif text-[1.0625rem] leading-tight text-ink-900">
                    {greeting.native}
                  </dd>
                  <dd className="mt-0.5 text-[0.6875rem] text-ink-400">{greeting.gloss}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* --------------------------------------------------- logo card */}
          <div className="min-w-0 animate-rise [animation-delay:120ms]">
            <div className="relative rounded-[var(--radius-lg)] border border-paper-200 bg-white p-6 shadow-[0_18px_48px_-28px_rgb(4_36_15_/_0.28)] sm:p-9">
              <WazobiaLogo variant="lockup" height={320} priority className="mx-auto w-full max-w-[400px]" />
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-paper-200 pt-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  {brandWords}
                </p>
                <p className="text-[0.6875rem] uppercase tracking-[0.1em] text-ink-400">
                  Nigeria · Since 2026
                </p>
              </div>
            </div>
            <p className="mt-3 text-center text-[0.6875rem] text-ink-400">
              The official WAZOBIA identity
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const brandWords = 'The African Language Ecosystem'
