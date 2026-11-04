import { Link, useNavigate } from 'react-router-dom'
import { StateMessage } from '@/components/ui/StateMessage'
import { Button } from '@/components/ui/Button'
import { IconArrowRight, IconInfo } from '@/components/ui/icons'
import { DestinationCard } from '@/components/layout/DestinationCard'
import { DESTINATIONS } from '@/config/destinationRegistry'
import { useSession } from '@/hooks/useSession'
import { TARGET_LANGUAGES } from '@/config/languages'
import { useLanguagePreference } from '@/hooks/useLanguagePreference'

/**
 * Application entry (`/app`).
 *
 * Reachable by a guest, an anonymous visitor or a future signed-in account. When
 * nobody is in a session, it offers guest access rather than bouncing the
 * visitor to a login wall — the brief requires guest access to work immediately.
 */
export default function AppEntryPage() {
  const { isGuest, startGuestSession } = useSession()
  const { language } = useLanguagePreference()
  const navigate = useNavigate()

  return (
    <div>
      <header className="border-b border-paper-200 pb-6">
        <p className="text-eyebrow text-ink-500">
          {isGuest ? 'Guest session' : 'Application'}
        </p>
        <h1 className="text-display mt-2.5 text-[1.75rem] text-ink-900 sm:text-[2.125rem]">
          {isGuest ? 'Welcome, guest.' : 'Welcome to WAZOBIA.'}
        </h1>
        <p className="mt-2.5 max-w-[58ch] text-[0.9375rem] leading-7 text-ink-600">
          {isGuest
            ? 'You can move through every public part of the platform. Anything that would need an account — saved progress, favourites, contributions — is switched off and labelled as such.'
            : 'Choose a destination to begin, or continue as a guest to explore without an account.'}
        </p>

        {!isGuest ? (
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button
              onClick={() => {
                startGuestSession()
                navigate('/app', { replace: true })
              }}
              leadingIcon={<IconArrowRight width={15} height={15} />}
            >
              Continue as guest
            </Button>
            <Link
              to="/signup"
              className="inline-flex h-10 items-center rounded-[var(--radius-button)] border border-paper-400 bg-white px-4 text-sm font-medium text-ink-800 hover:border-forest-600 hover:text-forest-800"
            >
              Create free account
            </Link>
          </div>
        ) : null}
      </header>

      <section className="mt-8" aria-labelledby="app-destinations">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="app-destinations" className="text-eyebrow text-ink-500">
            Destinations
          </h2>
          <p className="text-xs text-ink-500">
            Language preference: <span lang={language.code} className="font-serif">{language.nativeName}</span>
          </p>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {DESTINATIONS.map((destination) => (
            <li key={destination.id}>
              <DestinationCard destination={destination} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2" aria-label="Session status">
        <StateMessage
          tone="waiting"
          icon={<IconInfo width={18} height={18} />}
          title="What guests can and cannot do"
          description={
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Browse public pages and open every destination.</li>
              <li>Nothing is saved to an account — no progress, favourites or contributions.</li>
              <li>No moderation, review or administrative actions are available.</li>
            </ul>
          }
        />
        <div className="rounded-[var(--radius-md)] border border-paper-300 bg-white p-5">
          <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
            Launch languages
          </h3>
          <ul className="mt-3 space-y-2">
            {TARGET_LANGUAGES.map((item) => (
              <li key={item.code} className="flex items-baseline justify-between gap-3">
                <span lang={item.code} className="font-serif text-[0.9375rem] text-ink-900">
                  {item.nativeName}
                </span>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-400">
                  {item.code}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-paper-200 pt-3 text-xs leading-5 text-ink-500">
            Every destination currently states its own build status. Nothing here is simulated.
          </p>
        </div>
      </section>
    </div>
  )
}
