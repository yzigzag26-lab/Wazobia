import { Link } from 'react-router-dom'
import { useSession } from '@/hooks/useSession'

export function FinalCta() {
  const { isGuest, startGuestSession } = useSession()

  return (
    <section className="border-t border-paper-200 bg-paper-100" aria-labelledby="cta-heading">
      <div className="mx-auto w-full max-w-[80rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
            <div className="p-7 sm:p-10">
              <p className="text-eyebrow text-forest-700">Start now</p>
              <h2 id="cta-heading" className="text-display mt-3 text-[1.875rem] text-ink-900 sm:text-[2.375rem]">
                Africa speaks. Come and understand it.
              </h2>
              <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-7 text-ink-600">
                Explore the platform today as a guest, or create an account to keep your progress
                when accounts go live.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex h-11 items-center rounded-[var(--radius-button)] bg-brand-800 px-5 text-[0.9375rem] font-medium text-on-brand transition-colors hover:bg-brand-900"
                >
                  Create free account
                </Link>
                <Link
                  to="/app"
                  onClick={startGuestSession}
                  className="inline-flex h-11 items-center rounded-[var(--radius-button)] border border-paper-400 bg-white px-5 text-[0.9375rem] font-medium text-ink-800 transition-colors hover:border-forest-600 hover:text-forest-800"
                >
                  {isGuest ? 'Continue to app' : 'Continue as guest'}
                </Link>
              </div>

              <p className="mt-4 text-xs text-ink-500">
                Guest access is stored only in this browser and grants no account privileges.
              </p>
            </div>

            {/* Gold accent panel — the logo's highlight colour, used as a surface. */}
            <div className="relative flex flex-col justify-center gap-4 border-t border-gold-300 bg-gold-100 p-7 sm:p-10 lg:border-l lg:border-t-0">
              <p className="font-serif text-[1.375rem] leading-snug text-forest-900">
                Learn.
                <br />
                Understand.
                <br />
                Translate.
              </p>
              <p className="text-[0.8125rem] leading-6 text-forest-800">
                Three languages at launch. A foundation designed to carry every African language
                that follows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
