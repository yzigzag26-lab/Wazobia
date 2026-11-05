import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/stores/auth'
import { LanguagePreferenceProvider } from '@/stores/languagePreference'
import { ThemeProvider } from '@/stores/theme'
import { ProfileProvider } from '@/stores/profile'
import { RequireAuth } from './RequireAuth'

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
 * Guest access was removed, so `/app/*` must not render without a session.
 *
 * These cases exist because the removal is easy to regress: adding a route
 * outside the `RequireAuth` wrapper, or treating the `loading` state as
 * `signed-in`, would silently restore anonymous access to the whole app.
 */

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Tooltip.Provider>
        <AuthProvider>
          <LanguagePreferenceProvider>
            <ThemeProvider>
              <ProfileProvider>
                <Routes>
                  <Route path="/login" element={<p>Sign in page</p>} />
                  <Route
                    path="/app"
                    element={
                      <RequireAuth>
                        <p>Protected application</p>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/app/learn"
                    element={
                      <RequireAuth>
                        <p>Protected lesson hub</p>
                      </RequireAuth>
                    }
                  />
                </Routes>
              </ProfileProvider>
            </ThemeProvider>
          </LanguagePreferenceProvider>
        </AuthProvider>
      </Tooltip.Provider>
    </MemoryRouter>,
  )
}

function seedSession(overrides: Record<string, unknown> = {}) {
  window.localStorage.setItem(
    'wazobia.auth-session.v1',
    JSON.stringify({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      expiresAt: Date.now() + 3_600_000,
      userId: 'test-user',
      email: 'ada@example.com',
      ...overrides,
    }),
  )
}

afterEach(() => {
  window.localStorage.clear()
})

describe('RequireAuth', () => {
  it('sends a signed-out visitor to the sign-in page', async () => {
    renderAt('/app')

    // The protected content must never appear, not even briefly.
    expect(await screen.findByText('Sign in page')).toBeInTheDocument()
    expect(screen.queryByText('Protected application')).not.toBeInTheDocument()
  })

  it('gates a nested route as well as the index', async () => {
    renderAt('/app/learn')

    expect(await screen.findByText('Sign in page')).toBeInTheDocument()
    expect(screen.queryByText('Protected lesson hub')).not.toBeInTheDocument()
  })

  it('renders the children when a session is stored', async () => {
    seedSession()
    renderAt('/app')

    expect(await screen.findByText('Protected application')).toBeInTheDocument()
  })

  it('does not treat an expired session as signed in', async () => {
    // A stale token in storage is not a session. Rendering the app for it would
    // show a shell whose every request 401s.
    seedSession({ expiresAt: Date.now() - 1_000 })
    renderAt('/app')

    expect(await screen.findByText('Sign in page')).toBeInTheDocument()
    expect(screen.queryByText('Protected application')).not.toBeInTheDocument()
  })

  it('does not treat a corrupt session as signed in', async () => {
    window.localStorage.setItem('wazobia.auth-session.v1', '{not json')
    renderAt('/app')

    expect(await screen.findByText('Sign in page')).toBeInTheDocument()
  })

  it('offers no guest or anonymous escape hatch', async () => {
    renderAt('/app')
    await screen.findByText('Sign in page')

    // The words that used to appear on every public surface.
    expect(screen.queryByText(/continue as guest/i)).not.toBeInTheDocument()
  })
})
