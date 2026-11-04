import { QueryClientProvider } from '@tanstack/react-query'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { createQueryClient } from '@/lib/queryClient'
import { LanguagePreferenceProvider } from '@/stores/languagePreference'
import { SessionProvider } from '@/stores/session'
import { router } from '@/router'

/**
 * Application root: providers only, no layout.
 *
 * Shell and navigation live inside the router so that future authenticated and
 * public route groups can adopt different shells without touching this file.
 */
export function App() {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider delayDuration={400} skipDelayDuration={200}>
        <SessionProvider>
          <LanguagePreferenceProvider>
            <RouterProvider router={router} />
          </LanguagePreferenceProvider>
        </SessionProvider>
      </Tooltip.Provider>
    </QueryClientProvider>
  )
}
