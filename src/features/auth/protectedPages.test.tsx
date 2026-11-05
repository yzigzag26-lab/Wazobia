import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { AuthProvider } from '@/stores/auth'
import { ProfileProvider } from '@/stores/profile'
import TranslatePage from '@/features/translate/TranslatePage'
import AiPage from '@/features/ai/AiPage'

vi.mock('@/config/env', () => ({
  env: {
    apiOrigin: undefined,
    apiVersion: 'v1',
    supabaseUrl: undefined,
    supabaseAnonKey: undefined,
    isProduction: false,
    appVersion: '0.0.0',
  },
  isSupabaseConfigured: false,
}))

/**
 * Mounting sweep for the two protected pages.
 *
 * Both call `useAuth()`, which throws when the provider is absent. No earlier
 * test rendered either page — the route sweep only asserted the *links* to them —
 * so a missing `AuthProvider` in `App.tsx` would have crashed in a browser while
 * the whole suite stayed green. These cases close that specific gap.
 */

function renderWithProviders(node: React.ReactNode) {
  return render(
    <Tooltip.Provider>
      {/* Same provider order as `App.tsx`: Profile outside Auth. */}
      <ProfileProvider>
        <AuthProvider>{node}</AuthProvider>
      </ProfileProvider>
    </Tooltip.Provider>,
  )
}

describe('protected pages mount signed out', () => {
  it('renders the translate page with a heading', () => {
    renderWithProviders(<TranslatePage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders the AI tutor page with a heading', () => {
    renderWithProviders(<AiPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('claims no identity it does not have', () => {
    renderWithProviders(<TranslatePage />)
    // Nothing on a signed-out page should imply an account exists.
    expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument()
  })
})
