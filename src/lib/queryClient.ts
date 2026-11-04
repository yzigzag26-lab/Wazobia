import { QueryClient } from '@tanstack/react-query'
import { WazobiaApiError } from '@/services/client'

/**
 * Shared server-state client.
 *
 * Retry policy is deliberately explicit rather than default: retrying a
 * validation error or a missing endpoint is pointless and makes the interface
 * feel broken. Only transient conditions are retried, twice.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof WazobiaApiError) {
            const retryable: ReadonlyArray<string> = [
              'NETWORK_ERROR',
              'PROVIDER_UNAVAILABLE',
              'INTERNAL_ERROR',
            ]
            if (!retryable.includes(error.code)) return false
          }
          return failureCount < 2
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
