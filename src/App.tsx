import { QueryClientProvider } from '@tanstack/react-query'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { createQueryClient } from '@/lib/queryClient'
import { LanguagePreferenceProvider } from '@/stores/languagePreference'
import { AuthProvider } from '@/stores/auth'
import { ThemeProvider } from '@/stores/theme'
import { ProfileProvider } from '@/stores/profile'
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
        {/* Auth sits outermost: the application area requires a session, and
            there is no anonymous or guest alternative to fall back to. */}
        <AuthProvider>
          <LanguagePreferenceProvider>
            {/*
              Theme sits outside the router so the palette is applied before any
              route renders — a light flash on a dark-preference device is a bug,
              not a detail.
              Profile sits inside the session because the primary language is
              resolved from the onboarding answers the session owns.
            */}
              <ThemeProvider>
                <ProfileProvider>
                  <RouterProvider router={router} />
                </ProfileProvider>
              </ThemeProvider>
          </LanguagePreferenceProvider>
        </AuthProvider>
      </Tooltip.Provider>
    </QueryClientProvider>
  )
}
