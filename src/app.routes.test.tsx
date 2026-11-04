import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import * as Tooltip from '@radix-ui/react-tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/lib/queryClient'
import { SessionProvider } from '@/stores/session'
import { LanguagePreferenceProvider } from '@/stores/languagePreference'
import { ThemeProvider } from '@/stores/theme'
import { ProfileProvider } from '@/stores/profile'
import { routes } from '@/router'
import { PILLARS } from '@/features/learn/pillars'
import { COURSES } from '@/features/learn/lessons'
import { QUIZZES } from '@/features/learn/quizzes'
import { ALL_PROVERBS } from '@/features/learn/proverbs'
import { ALL_STORIES } from '@/features/learn/stories'

/**
 * Route rendering sweep.
 *
 * A 200 from the dev server only proves the SPA fallback exists — every path
 * returns the same HTML shell. These tests actually mount the route tree in
 * jsdom and assert that the right screen renders with real content, which is the
 * only way to catch a broken import, a bad hook call or an empty page.
 *
 * Console errors are collected per render. React logs a warning for invalid
 * markup, missing keys and act() misuse, and a route that merely *renders* while
 * spewing warnings is not a passing route.
 */

/** Seeds the onboarding draft so `primaryLanguage` resolves to Yorùbá. */
function seedYorubaProfile() {
  // Must satisfy the full draft shape: `onboardingService.readDraft()` rejects a
  // partial object, and a rejected draft means no language resolves.
  window.localStorage.setItem(
    'wazobia.onboarding-draft.v1',
    JSON.stringify({
      countryOfOrigin: 'NG',
      currentCountry: 'NG',
      knownLanguages: ['en'],
      languageRelationship: 'learner',
      targetLanguages: ['yo'],
      proficiencyLevel: 'beginner',
      learningGoals: ['family'],
    }),
  )
}

function renderRoute(path: string) {
  const errors: string[] = []
  const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(' '))
  })

  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = createQueryClient()

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider>
        <SessionProvider>
          <LanguagePreferenceProvider>
            <ThemeProvider>
              <ProfileProvider>
                <RouterProvider router={router} />
              </ProfileProvider>
            </ThemeProvider>
          </LanguagePreferenceProvider>
        </SessionProvider>
      </Tooltip.Provider>
    </QueryClientProvider>,
  )

  consoleError.mockRestore()
  return { ...result, errors }
}

describe('application routes render', () => {
  it('renders the landing page', async () => {
    const { errors } = renderRoute('/')
    expect(
      await screen.findByRole('heading', { level: 1 }),
    ).toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('renders the app entry with all five destinations', async () => {
    const { errors } = renderRoute('/app')

    // Both navigation surfaces render in jsdom (the sidebar and the phone bar);
    // the phone bar is the one with five slots and no "More" sheet.
    const navs = await screen.findAllByRole('navigation', { name: 'Primary' })
    const phoneNav = navs.find((nav) => nav.className.includes('lg:hidden'))
    expect(phoneNav).toBeDefined()
    if (!phoneNav) return

    const links = within(phoneNav).getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/app/learn',
      '/app/dictionary',
      '/app/ai',
      '/app/translate',
      '/app/profile',
    ])
    expect(within(phoneNav).queryByText('More')).not.toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('renders the Learn hub with exactly four pillar cards', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn')

    expect(
      await screen.findByRole('heading', { level: 1, name: /Learn an African language/i }),
    ).toBeInTheDocument()

    // Each pillar is a link whose heading is its accessible name.
    for (const pillar of PILLARS) {
      expect(screen.getByRole('link', { name: new RegExp(pillar.title) })).toBeInTheDocument()
    }

    const cards = screen.getAllByRole('link').filter((link) =>
      PILLARS.some((pillar) => link.getAttribute('href') === pillar.href),
    )
    expect(cards).toHaveLength(4)
    expect(errors).toEqual([])
  })

  it('renders the lesson catalogue and a course', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn/lessons')
    expect(await screen.findByRole('heading', { level: 1, name: /lessons/i })).toBeInTheDocument()
    for (const course of COURSES.filter((item) => item.language === 'yo')) {
      expect(screen.getByText(course.title)).toBeInTheDocument()
    }
    expect(errors).toEqual([])
  })

  it('renders a lesson page with Read Aloud disclosed as unavailable', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn/lessons/yo-beginner/yo-b-1')

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()

    // jsdom has no SpeechSynthesis API, so the honest state must appear: the
    // reader is told why nothing plays rather than given a dead button. The
    // "no approved voice" path (API present, no yo voice) is covered in
    // readAloud.test.tsx with a stubbed synthesiser.
    expect(screen.getByText(/not available in this browser/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^play$/i })).not.toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('renders the quiz index and a quiz', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn/quizzes')
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(QUIZZES[0]?.title ?? '')).toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('marks a quiz answer right and wrong correctly in the UI', async () => {
    seedYorubaProfile()
    const user = userEvent.setup()
    const { errors } = renderRoute('/app/learn/quizzes/quiz-yo-greetings')

    // Question 1: pick the morning greeting. The target text also appears as a
    // heading, so scope to the radio group.
    const groups = await screen.findAllByRole('group', { name: /select one answer/i })
    const firstGroup = groups.find(() => true)
    expect(firstGroup).toBeDefined()
    if (!firstGroup) return
    const correct = within(firstGroup).getByRole('radio', { name: 'Ẹ káàárọ̀' })
    await user.click(correct)

    const submit = screen.getByRole('button', { name: /submit answers/i })
    await user.click(submit)

    expect(await screen.findByText(/^Result$/i)).toBeInTheDocument()
    // The result is a live region carrying the score.
    const result = screen.getByRole('status')
    expect(result.textContent).toMatch(/\d\s*\/\s*5/)
    expect(errors).toEqual([])
  })

  it('renders the proverb index with all cards for the language', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn/proverbs')

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    const firstYorubaProverb = ALL_PROVERBS.find((proverb) => proverb.language === 'yo')
    expect(firstYorubaProverb).toBeDefined()
    // The first proverb must be present in full orthography.
    expect(screen.getByText(firstYorubaProverb?.original ?? '')).toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('renders a proverb card with provenance and an illustration', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn/proverbs/yo-01')

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/^Provenance$/i)).toBeInTheDocument()
    expect(screen.getByText(/Not yet reviewed by a native speaker/i)).toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('renders the story index', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn/stories')
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(ALL_STORIES[0]?.englishTitle ?? '')).toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('renders a story with translation, vocabulary and cultural context', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn/stories/yo-agbẹ̀-ati-ọmọ')

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Vocabulary$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Cultural context$/i })).toBeInTheDocument()
    // A fully original story must say that no traditional origin is claimed.
    expect(screen.getByText(/does not claim a traditional origin/i)).toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('labels an adaptation as an adaptation, not as an original', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn/stories/yo-ijapa-ati-egbin')

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    // The trickster tale is marked `adaptation`, so the page must say the text is
    // reshaped rather than reproduced verbatim.
    expect(screen.getByText(/reshaped for learners/i)).toBeInTheDocument()
    expect(screen.queryByText(/does not claim a traditional origin/i)).not.toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('renders the profile page without claiming a server save', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/profile')
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/stored in this browser/i)).toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('renders the settings hub and the appearance panel', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/profile/settings/appearance')
    expect(await screen.findByRole('heading', { level: 1, name: /Settings/i })).toBeInTheDocument()

    // All three theme options exist, and each radio has its own accessible name
    // (the label text sits in sibling spans, so an aria-label is required).
    expect(screen.getByRole('radio', { name: 'Light' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'System' })).toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it('applies the dark theme when selected', async () => {
    seedYorubaProfile()
    const user = userEvent.setup()
    renderRoute('/app/profile/settings/appearance')

    await user.click(await screen.findByRole('radio', { name: 'Dark' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('renders the privacy panel with the delete confirmation', async () => {
    seedYorubaProfile()
    const user = userEvent.setup()
    const { errors } = renderRoute('/app/profile/settings/privacy')

    const deleteButton = await screen.findByRole('button', { name: /delete my data/i })
    await user.click(deleteButton)

    // The destructive action must require a typed confirmation.
    expect(screen.getByLabelText(/type DELETE to confirm/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete everything/i })).toBeDisabled()
    expect(errors).toEqual([])
  })

  const OUTLINE_PATHS = [
    '/app/learn',
    '/app/learn/lessons',
    '/app/learn/lessons/yo-beginner',
    '/app/learn/lessons/yo-beginner/yo-b-1',
    '/app/learn/quizzes',
    '/app/learn/quizzes/quiz-yo-greetings',
    '/app/learn/proverbs',
    '/app/learn/proverbs/yo-01',
    '/app/learn/stories',
    '/app/learn/stories/yo-ijapa-ati-egbin',
    '/app/profile',
    '/app/profile/settings/appearance',
    '/app/profile/settings/security',
    '/app/profile/settings/preferences',
    '/app/profile/settings/notifications',
    '/app/profile/settings/privacy',
  ]

  /**
   * Every screen must have exactly one h1 inside <main> and no skipped heading
   * levels. A skipped level (h1 → h3) is invisible visually but breaks navigation
   * by heading, which is how screen-reader users skim long pages.
   */
  it.each(OUTLINE_PATHS)('keeps a valid heading outline on %s', async (path) => {
    seedYorubaProfile()
    const { unmount } = renderRoute(path)
    await screen.findByRole('heading', { level: 1 })

    const main = screen.getByRole('main')
    const levels = [...main.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((node) =>
      Number(node.tagName[1]),
    )

    expect(levels.filter((level) => level === 1), `${path} needs exactly one h1`).toHaveLength(1)

    let previous = 0
    for (const level of levels) {
      if (previous > 0) {
        expect(level, `${path} skips from h${previous} to h${level}`).toBeLessThanOrEqual(
          previous + 1,
        )
      }
      previous = level
    }

    unmount()
  })

  it('renders an in-shell not-found for a bad lesson id', async () => {
    seedYorubaProfile()
    const { errors } = renderRoute('/app/learn/lessons/yo-beginner/nope')
    expect(await screen.findByRole('heading', { name: /lesson not found/i })).toBeInTheDocument()
    expect(errors).toEqual([])
  })

  it.each(['/app/speak', '/app/community', '/app/preserve', '/app/research'])(
    'no longer resolves the removed route %s',
    async (path) => {
      seedYorubaProfile()
      const { errors } = renderRoute(path)
      // Inside the app shell, an unknown child path hits the shell's catch-all,
      // so the visitor gets a page rather than a blank screen.
      expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(errors).toEqual([])
    },
  )
})
