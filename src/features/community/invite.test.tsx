import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as Tooltip from '@radix-ui/react-tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createQueryClient } from '@/lib/queryClient'
import { SessionProvider } from '@/stores/session'
import { LanguagePreferenceProvider } from '@/stores/languagePreference'
import { ThemeProvider } from '@/stores/theme'
import { ProfileProvider } from '@/stores/profile'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { CommunityInviteModal } from './CommunityInviteModal'
import { WHATSAPP_COMMUNITY_URL } from './whatsapp'

/**
 * The community invitation rules, as tests.
 *
 * The brief is unusually specific here — after registration, after verification,
 * after onboarding, once, never on a normal login, never forced on a guest — and
 * every one of those is a behavioural claim that can silently rot. These tests
 * hold the two that are testable without an auth backend: the exact link, and
 * that the modal is not rendered by the app at any ordinary route.
 */

function Harness({ children }: { readonly children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createQueryClient()}>
      <Tooltip.Provider>
        <SessionProvider>
          <LanguagePreferenceProvider>
            <ThemeProvider>
              <ProfileProvider>
                <MemoryRouter>{children}</MemoryRouter>
              </ProfileProvider>
            </ThemeProvider>
          </LanguagePreferenceProvider>
        </SessionProvider>
      </Tooltip.Provider>
    </QueryClientProvider>
  )
}

describe('community invitation', () => {
  it('uses the exact approved WhatsApp link', () => {
    expect(WHATSAPP_COMMUNITY_URL).toBe(
      'https://chat.whatsapp.com/JXitlMIAkOw9xNkk6Z6wOy?s=sw&p=a&mlu=4&ilr=4&iam=2',
    )
  })

  it('titles itself as specified and offers both actions', async () => {
    render(
      <Harness>
        <CommunityInviteModal open onJoin={() => {}} onSkip={() => {}} />
      </Harness>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Join the WAZOBIA Community' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Join WhatsApp Community/i })).toHaveAttribute(
      'href',
      WHATSAPP_COMMUNITY_URL,
    )
    expect(screen.getByRole('button', { name: /Skip for now/i })).toBeInTheDocument()
  })

  it('opens the link in a new tab without leaking the referrer', async () => {
    render(
      <Harness>
        <CommunityInviteModal open onJoin={() => {}} onSkip={() => {}} />
      </Harness>,
    )
    const link = await screen.findByRole('link', { name: /Join WhatsApp Community/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noreferrer')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('treats Skip as a first-class action, not a trap', async () => {
    const onSkip = vi.fn()
    const user = userEvent.setup()
    render(
      <Harness>
        <CommunityInviteModal open onJoin={() => {}} onSkip={onSkip} />
      </Harness>,
    )

    await user.click(await screen.findByRole('button', { name: /Skip for now/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('renders nothing when it is not open', () => {
    render(
      <Harness>
        <CommunityInviteModal open={false} onJoin={() => {}} onSkip={() => {}} />
      </Harness>,
    )
    expect(screen.queryByRole('heading', { name: 'Join the WAZOBIA Community' })).toBeNull()
  })

  it('is not present on the onboarding questionnaire itself', async () => {
    // The invitation belongs to the *completion* step, after the answers are
    // submitted — not to the first question.
    render(
      <Harness>
        <Routes>
          <Route path="/" element={<OnboardingWizard />} />
          <Route path="/app" element={<p>app</p>} />
        </Routes>
      </Harness>,
    )

    // The questionnaire renders its first question; no invitation yet.
    expect(screen.queryByRole('heading', { name: 'Join the WAZOBIA Community' })).toBeNull()
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('heading', { name: 'Join the WAZOBIA Community' })).toBeNull()
  })
})
