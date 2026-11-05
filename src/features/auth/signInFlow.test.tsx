import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as Tooltip from '@radix-ui/react-tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createQueryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/stores/auth'
import { LanguagePreferenceProvider } from '@/stores/languagePreference'
import { ThemeProvider } from '@/stores/theme'
import { ProfileProvider } from '@/stores/profile'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { LoginForm } from './LoginForm'

/**
 * End-to-end sign-in, in jsdom.
 *
 * The reported symptom was "it loads but never takes me to the dashboard". That
 * is a claim about what happens *after* credentials are accepted, and it is not
 * covered by any unit test: `authClient` can be perfect, `signIn` can resolve,
 * and the app can still fail to navigate. These cases follow the form through
 * the redirect and assert the protected page is what the user actually sees.
 */

vi.mock('@/config/env', () => ({
  env: {
    apiOrigin: undefined,
    apiVersion: 'v1',
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
    isProduction: false,
    appVersion: '0.0.0',
  },
  isSupabaseConfigured: true,
}))

const ACCESS_TOKEN = 'header.payload.signature'
const NOW = Date.now()

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function tokenPayload(): Record<string, unknown> {
  return {
    access_token: ACCESS_TOKEN,
    refresh_token: 'refresh-token',
    expires_in: 3600,
    user: { id: 'user-1', email: 'ada@example.com' },
  }
}

function profilePayload(): Record<string, unknown> {
  return {
    id: 'user-1',
    display_name: 'Adaeze Okonkwo',
    preferred_language: 'yo',
    roles: ['learner', 'reviewer'],
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

/**
 * Routes Supabase Auth and the WAZOBIA API by URL.
 *
 * Note the `/api/` branch: `/users/me` is called straight after sign-in. If that
 * endpoint 404s or hangs, the session is still valid — the profile is cosmetic —
 * and the user must still reach the app.
 */
function mockNetwork(options: { profileFails?: boolean } = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)

    if (url.includes('/auth/v1/token')) {
      return jsonResponse(200, tokenPayload())
    }
    if (url.includes('/api/v1/users/me')) {
      if (options.profileFails === true) {
        return jsonResponse(500, { success: false, error: { code: 'INTERNAL_ERROR' } })
      }
      return jsonResponse(200, {
        success: true,
        data: profilePayload(),
        request_id: 'req_test',
      })
    }
    if (url.includes('/auth/v1/logout')) {
      return jsonResponse(200, {})
    }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

function renderApp() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <Tooltip.Provider>
        <AuthProvider>
          <LanguagePreferenceProvider>
            <ThemeProvider>
              <ProfileProvider>
                <MemoryRouter initialEntries={['/login']}>
                  <Routes>
                    <Route path="/login" element={<LoginForm />} />
                    <Route
                      path="/app"
                      element={
                        <RequireAuth>
                          <h1>Dashboard</h1>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/app/learn"
                      element={
                        <RequireAuth>
                          <h1>Learn hub</h1>
                        </RequireAuth>
                      }
                    />
                  </Routes>
                </MemoryRouter>
              </ProfileProvider>
            </ThemeProvider>
          </LanguagePreferenceProvider>
        </AuthProvider>
      </Tooltip.Provider>
    </QueryClientProvider>,
  )
}

async function submitCredentials() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/email or username/i), 'ada@example.com')
  await user.type(screen.getByLabelText(/^password$/i), 'correct1A')
  await user.click(screen.getByRole('button', { name: /^log in$/i }))
}

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('sign-in flow', () => {
  it('reaches the dashboard after a successful sign-in', async () => {
    mockNetwork()
    renderApp()
    await submitCredentials()

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('does not get stuck on the form', async () => {
    mockNetwork()
    renderApp()
    await submitCredentials()

    await screen.findByRole('heading', { name: 'Dashboard' })
    // The submit button must not remain in its "Signing in…" state.
    expect(screen.queryByRole('button', { name: /signing in/i })).not.toBeInTheDocument()
  })

  it('reaches the app even when the profile request fails', async () => {
    // A failed /users/me must not trap the user on the login form: the session
    // is valid, and the profile is a decoration on top of it. This is the
    // failure mode that would look like "signs in but never arrives".
    mockNetwork({ profileFails: true })
    renderApp()
    await submitCredentials()

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('never hangs the form when the network request stalls', async () => {
    /*
     * The reported symptom, reproduced: `fetch` has no default timeout, so a
     * host that accepts the connection and never answers leaves the promise
     * pending forever and the button on "Signing in…". The request must abort
     * and surface an error the user can act on.
     *
     * Fake timers are not needed — `AbortSignal.timeout` is real; the promise
     * below simply never settles, which is exactly the condition.
     */
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise<Response>(() => undefined),
    )
    renderApp()
    await submitCredentials()

    expect(
      await screen.findByText(/did not respond|could not reach/i, undefined, { timeout: 20_000 }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  }, 25_000)

  it('reaches the app even when the profile request hangs', async () => {
    /*
     * `signIn` awaits `fetchProfile`, and the redirect happens after it
     * resolves. If `/users/me` never settles, the user is authenticated but
     * never navigated — "loads but never takes me to the dashboard". The
     * profile fetch is bounded, so navigation must still happen.
     */
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes('/auth/v1/token')) return jsonResponse(200, tokenPayload())
      if (url.includes('/api/v1/users/me')) {
        return new Promise<Response>(() => undefined)
      }
      return jsonResponse(200, {})
    })

    renderApp()
    await submitCredentials()

    // `signIn` resolves now, because the profile call is aborted by its own
    // timeout rather than awaited forever.
    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }, { timeout: 15_000 }),
    ).toBeInTheDocument()
  }, 25_000)

  it('shows the server error and stays put on bad credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' }),
    )
    renderApp()
    await submitCredentials()

    expect(await screen.findByText(/could not sign you in/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('keeps the user on the form when the network is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('failed to fetch'))
    renderApp()
    await submitCredentials()

    expect(await screen.findByText(/could not reach the sign-in service/i)).toBeInTheDocument()
  })

  it('persists the session so a reload does not ask again', async () => {
    mockNetwork()
    renderApp()
    await submitCredentials()
    await screen.findByRole('heading', { name: 'Dashboard' })

    const stored = window.localStorage.getItem('wazobia.auth-session.v1')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(String(stored)) as { expiresAt: number; accessToken: string }
    expect(parsed.accessToken).toBe(ACCESS_TOKEN)
    expect(parsed.expiresAt).toBeGreaterThan(NOW)
  })

  it('returns to the page that redirected the user here', async () => {
    mockNetwork()
    const user = userEvent.setup()

    render(
      <QueryClientProvider client={createQueryClient()}>
        <Tooltip.Provider>
          <AuthProvider>
            <LanguagePreferenceProvider>
              <ThemeProvider>
                <ProfileProvider>
                  <MemoryRouter
                    initialEntries={[
                      { pathname: '/login', state: { from: '/app/learn' } },
                    ]}
                  >
                    <Routes>
                      <Route path="/login" element={<LoginForm />} />
                      <Route
                        path="/app/learn"
                        element={
                          <RequireAuth>
                            <h1>Learn hub</h1>
                          </RequireAuth>
                        }
                      />
                    </Routes>
                  </MemoryRouter>
                </ProfileProvider>
              </ThemeProvider>
            </LanguagePreferenceProvider>
          </AuthProvider>
        </Tooltip.Provider>
      </QueryClientProvider>,
    )

    await user.type(screen.getByLabelText(/email or username/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'correct1A')
    await user.click(screen.getByRole('button', { name: /^log in$/i }))

    expect(await screen.findByRole('heading', { name: 'Learn hub' })).toBeInTheDocument()
  })
})
