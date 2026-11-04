import { Spinner } from '@/components/ui/Spinner'

/** Loading state for a code-split route. */
export function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2.5 text-sm text-ink-500">
      <Spinner size={15} />
      <span>Loading…</span>
    </div>
  )
}
