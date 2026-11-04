import { Link } from 'react-router-dom'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconInfo } from '@/components/ui/icons'
import { DESTINATIONS } from '@/config/destinationRegistry'

export default function NotFoundPage() {
  return (
    <div className="py-6">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-400">
        404 — not found
      </p>
      <h1 className="mt-3 font-serif text-[1.75rem] leading-tight tracking-[-0.01em] text-ink-900">
        This page does not exist
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-6 text-ink-600">
        The address you followed is not part of WAZOBIA. These are the eight destinations that are.
      </p>

      <ul className="mt-6 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-paper-300 bg-paper-300 sm:grid-cols-2">
        {DESTINATIONS.map((destination) => (
          <li key={destination.id} className="bg-white">
            <Link
              to={destination.href}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink-800 hover:bg-paper-100"
            >
              <span className="text-ink-400 [&>svg]:size-[18px]">{destination.icon}</span>
              {destination.name}
            </Link>
          </li>
        ))}
      </ul>

      <StateMessage
        className="mt-6"
        tone="info"
        icon={<IconInfo width={18} height={18} />}
        title="Looking for something specific?"
        description="Search across the dictionary and lessons will appear here once the content services are connected."
      />

      <p className="mt-6 text-sm">
        <Link to="/" className="text-forest-700 underline underline-offset-4 hover:text-forest-800">
          Return to the WAZOBIA home page
        </Link>
      </p>
    </div>
  )
}
