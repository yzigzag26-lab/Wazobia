import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconInfo } from '@/components/ui/icons'
import { DESTINATIONS, STATUS_LABELS, STATUS_TONE, findDestinationById } from '@/config/moduleLookup'
import type { DestinationStatus } from '@/config/destinations'
import { cn } from '@/utils/cn'

export interface CapabilityGroup {
  /** Group label, taken from the blueprint's module description. */
  readonly heading: string
  readonly items: readonly string[]
}

export interface EndpointContractRef {
  readonly method: 'GET' | 'POST'
  readonly path: string
  readonly purpose: string
}

export interface ModuleScaffoldProps {
  readonly destinationId: string
  readonly lead: string
  readonly capabilities: readonly CapabilityGroup[]
  readonly contracts: readonly EndpointContractRef[]
  /** Phase in which this module is scheduled to be built. */
  readonly phase: string
  /** Optional groundwork rendered above the contracts panel. */
  readonly children?: ReactNode
  readonly statusOverride?: DestinationStatus
}

/**
 * Shared layout for a destination that is structured but not yet connected.
 *
 * Blueprint §4 gives each module real responsibilities. This scaffold renders
 * those responsibilities so the product's scope is visible and reviewable,
 * while the contracts panel states exactly what the frontend needs from the
 * backend. It deliberately contains no simulated feature output.
 */
export function ModuleScaffold({
  destinationId,
  lead,
  capabilities,
  contracts,
  phase,
  children,
  statusOverride,
}: ModuleScaffoldProps) {
  const destination = findDestinationById(destinationId)
  if (!destination) {
    throw new Error(`ModuleScaffold: unknown destination "${destinationId}"`)
  }
  const status = statusOverride ?? destination.status

  return (
    <div>
      <PageHeader
        eyebrow={
          <>
            <span>{phase}</span>
            <span aria-hidden="true" className="text-paper-400">
              /
            </span>
            <Badge tone={STATUS_TONE[status]} withDot>
              {STATUS_LABELS[status]}
            </Badge>
          </>
        }
        title={destination.name}
        description={lead}
      />

      {children}

      <div className={cn('mt-8 grid gap-8', contracts.length > 0 && 'lg:grid-cols-[1.15fr_1fr]')}>
        {/* Planned capabilities — the module's real product scope */}
        <section aria-labelledby="capabilities-heading">
          <h2
            id="capabilities-heading"
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-500"
          >
            Scope for this destination
          </h2>
          <div className="mt-4 space-y-6">
            {capabilities.map((group) => (
              <div key={group.heading}>
                <h3 className="text-[0.8125rem] font-semibold text-ink-900">{group.heading}</h3>
                <ul className="mt-2 space-y-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2.5 text-[0.84375rem] leading-6 text-ink-600"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-ink-400"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Backend dependencies */}
        {contracts.length > 0 ? (
          <aside aria-labelledby="contracts-heading">
            <h2
              id="contracts-heading"
              className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-500"
            >
              Required backend contracts
            </h2>
            <ul className="mt-4 divide-y divide-paper-200 overflow-hidden rounded-[var(--radius-md)] border border-paper-300 bg-white">
              {contracts.map((contract) => (
                <li key={`${contract.method} ${contract.path}`} className="px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-[2px] border border-paper-300 bg-paper-100 px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold tracking-wide text-ink-700">
                      {contract.method}
                    </span>
                    <code className="truncate font-mono text-[0.75rem] text-ink-800">
                      {contract.path}
                    </code>
                    <span className="ml-auto shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-gold-700">
                      pending
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-ink-500">{contract.purpose}</p>
                </li>
              ))}
            </ul>

            <StateMessage
              className="mt-4"
              tone="waiting"
              icon={<IconInfo width={17} height={17} />}
              title="Not connected"
              description="This destination is structured and reachable, but its data services do not exist yet. It will show live content only when those endpoints respond — never sample or placeholder data."
            />
          </aside>
        ) : null}
      </div>

      <nav
        aria-label="Other destinations"
        className="mt-10 border-t border-paper-200 pt-5 text-xs text-ink-400"
      >
        {DESTINATIONS.length} destinations · {phase}
      </nav>
    </div>
  )
}
