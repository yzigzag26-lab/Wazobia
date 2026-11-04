import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconAlert } from '@/components/ui/icons'

/**
 * Top-level route error boundary. Any unexpected rendering failure lands here
 * rather than showing a blank screen.
 */
export default function RouteErrorPage() {
  const error = useRouteError()

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error'

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-400">
        WAZOBIA — unexpected error
      </p>
      <h1 className="mt-3 font-serif text-2xl text-ink-900">This page could not be displayed</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600">
        Something failed while rendering. Nothing has been lost, and no data was submitted.
      </p>

      <StateMessage
        className="mt-6"
        tone="error"
        icon={<IconAlert width={18} height={18} />}
        title="Technical detail"
        description={
          <code className="font-mono text-xs break-words">{detail}</code>
        }
      />

      <p className="mt-6 text-sm">
        <Link
          to="/"
          className="text-forest-700 underline underline-offset-4 hover:text-forest-800"
          reloadDocument
        >
          Return to the WAZOBIA home page
        </Link>
      </p>
    </div>
  )
}
