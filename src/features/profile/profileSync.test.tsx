import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as Tooltip from '@radix-ui/react-tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createQueryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/stores/auth'
import { ProfileProvider } from '@/stores/profile'
import { LanguagePreferenceProvider } from '@/stores/languagePreference'
import { ThemeProvider } from '@/stores/theme'
import ProfilePage from './ProfilePage'

/**
 * The profile page must show the ACCOUNT, and save to it.
 *
 * ## The bug these tests pin
 *
 * A signed-in user saw "No username set" and "No email set" on their own
 * profile. Their account had both. The page rendered `ProfileProvider`, which is
 * `localStorage` under `wazobia.profile.v1` — a key the registration form never
 * wrote. Worse, the edit form saved *into that same store* and then said
 * "saved", so the page reported success for a write that reached no account.
 *
 * Both halves are tested here: reading the account, and writing to it.
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

const ACCOUNT = {
  id: '586cc68a-9dfc-4e5e-9a33-13f0ffed97f1',
  display_name: 'Zigzag Y',
  username: 'zigzag',
  preferred_language: 'yo',
  email: 'yzigzag26@gmail.com',
  roles: ['learner', 'reviewer'],
  created_at: '2026-11-04T22:52:10.000Z',
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

interface Recorded {
  readonly method: string
  readonly url: string
  readonly body: unknown
}

/** Stub the API, recording every call so writes can be asserted. */
function mockApi(options: { patchStatus?: number; patchBody?: unknown } = {}): Recorded[] {
  const calls: Recorded[] = []

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined
    calls.push({ method, url, body })

    if (url.includes('/api/v1/users/me')) {
      if (method === 'PATCH') {
        const status = options.patchStatus ?? 200
        if (status !== 200) {
          // A real API always sends a full error envelope on a 4xx. Omitting
          // `error` here would make the client dereference undefined and throw a
          // TypeError instead of the structured error the form renders.
          return jsonResponse(
            status,
            options.patchBody ?? {
              success: false,
              error: {
                code: status === 409 ? 'CONFLICT' : 'INTERNAL_ERROR',
                message: status === 409 ? 'That username is already taken.' : 'Server error.',
                request_id: 'req_patch',
              },
            },
          )
        }
        const patch = body as { display_name?: string; username?: string }
        return jsonResponse(200, {
          success: true,
          data: { ...ACCOUNT, ...patch },
          request_id: 'req_patch',
        })
      }
      return jsonResponse(200, { success: true, data: ACCOUNT, request_id: 'req_get' })
    }
    return jsonResponse(200, { success: true, data: {}, request_id: 'req_other' })
  })

  return calls
}

function seedSession(): void {
  window.localStorage.setItem(
    'wazobia.auth-session.v1',
    JSON.stringify({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: Date.now() + 3_600_000,
      userId: ACCOUNT.id,
      email: ACCOUNT.email,
    }),
  )
}

function renderProfile() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <Tooltip.Provider>
        <ProfileProvider>
          <AuthProvider>
            <LanguagePreferenceProvider>
              <ThemeProvider>
                <MemoryRouter initialEntries={['/app/profile']}>
                  <Routes>
                    <Route path="/app/profile" element={<ProfilePage />} />
                    <Route path="/app/profile/settings" element={<h1>Settings</h1>} />
                    <Route path="/app/profile/settings/preferences" element={<h1>Prefs</h1>} />
                  </Routes>
                </MemoryRouter>
              </ThemeProvider>
            </LanguagePreferenceProvider>
          </AuthProvider>
        </ProfileProvider>
      </Tooltip.Provider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  seedSession()
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('profile reads the account', () => {
  it('shows the display name and username from /users/me', async () => {
    mockApi()
    renderProfile()

    expect(await screen.findByText('Zigzag Y')).toBeInTheDocument()
    expect(await screen.findByText('@zigzag')).toBeInTheDocument()

    // The exact symptom being fixed.
    expect(screen.queryByText(/No username set/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/No email set/i)).not.toBeInTheDocument()
  })

  it('shows the email from the verified session', async () => {
    mockApi()
    renderProfile()
    expect(await screen.findByText('yzigzag26@gmail.com')).toBeInTheDocument()
  })

  it('does not claim the details are browser-local', async () => {
    mockApi()
    renderProfile()
    await screen.findByText('Zigzag Y')

    expect(screen.queryByText(/stored in this browser/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/nothing is uploaded/i)).not.toBeInTheDocument()
  })

  it('pre-fills the form from the account rather than leaving it blank', async () => {
    mockApi()
    renderProfile()

    const name = await screen.findByLabelText(/full name/i)
    expect(name).toHaveValue('Zigzag Y')

    const username = screen.getByLabelText(/username/i)
    expect(username).toHaveValue('zigzag')
  })

  it('renders an unset username honestly when the account has none', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(200, {
        success: true,
        data: { ...ACCOUNT, username: null },
        request_id: 'req_get',
      }),
    )
    renderProfile()

    expect(await screen.findByText(/No username set/i)).toBeInTheDocument()
    // Scoped to the identity header: the form has an "@" adornment on its
    // username field, so a bare /^@/ query would match that instead.
    expect(screen.queryByText('@', { selector: 'p' })).not.toBeInTheDocument()
  })
})

describe('profile saves to the account', () => {
  it('PATCHes the change to /users/me', async () => {
    const calls = mockApi()
    const user = userEvent.setup()
    renderProfile()

    const name = await screen.findByLabelText(/full name/i)
    await user.clear(name)
    await user.type(name, 'Adaeze Okonkwo')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      const patch = calls.find((call) => call.method === 'PATCH')
      expect(patch).toBeDefined()
      expect(patch?.body).toEqual({ display_name: 'Adaeze Okonkwo' })
    })
  })

  it('sends the username in lower case', async () => {
    const calls = mockApi()
    const user = userEvent.setup()
    renderProfile()

    const username = await screen.findByLabelText(/username/i)
    await user.clear(username)
    await user.type(username, 'Ada.Okonkwo')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      const patch = calls.find((call) => call.method === 'PATCH')
      expect(patch?.body).toEqual({ username: 'ada.okonkwo' })
    })
  })

  it('reports that the change was saved to the account', async () => {
    mockApi()
    const user = userEvent.setup()
    renderProfile()

    const name = await screen.findByLabelText(/full name/i)
    await user.clear(name)
    await user.type(name, 'New Name')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/Details saved to your account/i)).toBeInTheDocument()
  })

  it('tells the user when the username is already taken', async () => {
    // Only the database can answer this, which is why the form cannot pretend
    // an availability check exists.
    mockApi({ patchStatus: 409 })
    const user = userEvent.setup()
    renderProfile()

    const username = await screen.findByLabelText(/username/i)
    await user.clear(username)
    await user.type(username, 'taken')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/already taken/i)).toBeInTheDocument()
    // And it must not claim success.
    expect(screen.queryByText(/Details saved to your account/i)).not.toBeInTheDocument()
  })

  it('does not claim success when the server rejects the change', async () => {
    mockApi({ patchStatus: 500 })
    const user = userEvent.setup()
    renderProfile()

    const name = await screen.findByLabelText(/full name/i)
    await user.clear(name)
    await user.type(name, 'Nobody')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/were not saved/i)).toBeInTheDocument()
    expect(screen.queryByText(/Details saved to your account/i)).not.toBeInTheDocument()
  })

  it('does not write to localStorage instead of the account', async () => {
    const calls = mockApi()
    const user = userEvent.setup()
    renderProfile()

    const name = await screen.findByLabelText(/full name/i)
    await user.clear(name)
    await user.type(name, 'Local Only')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(calls.some((call) => call.method === 'PATCH')).toBe(true)
    })

    // The device-local store may mirror the name for Learn surfaces, but the
    // save must not be *only* that. A PATCH is the proof it left the device.
    const local = window.localStorage.getItem('wazobia.profile.v1')
    if (local !== null) {
      expect(JSON.parse(local)).not.toEqual({ fullName: 'Local Only' })
    }
  })

  it('validates the username format before sending it', async () => {
    const calls = mockApi()
    const user = userEvent.setup()
    renderProfile()

    const username = await screen.findByLabelText(/username/i)
    await user.clear(username)
    await user.type(username, 'ab')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/3–24 characters/i)).toBeInTheDocument()
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false)
  })

  it('disables the save button when nothing has changed', async () => {
    mockApi()
    renderProfile()

    await screen.findByLabelText(/full name/i)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
  })
})
