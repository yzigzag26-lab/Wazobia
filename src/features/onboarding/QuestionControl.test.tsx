import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuestionControl } from './QuestionControl'
import { createEmptyOnboardingProfile } from '@/types/onboarding'

/**
 * The "not yet on WAZOBIA" notice on the target-language question.
 *
 * This exists because the notice was a `<p role="status">` and the a11y lint
 * ruleset (restored in this phase) prefers the element whose role is implicit:
 * `<output>` is `status` plus a form-result semantic, and it needs no `role`
 * attribute. The rendered behaviour is what these assertions pin down — the
 * notice appears, is announced politely, and disappears when nothing is
 * unavailable — so a future refactor cannot silently drop the announcement.
 */
const profileWith = (targetLanguages: readonly string[]) => ({
  ...createEmptyOnboardingProfile(),
  targetLanguages,
}) as ReturnType<typeof createEmptyOnboardingProfile>

function renderControl(targetLanguages: readonly string[]) {
  const update = vi.fn()
  const toggleInArray = vi.fn()
  render(
    <QuestionControl
      questionId="targetLanguages"
      profile={profileWith(targetLanguages)}
      error={undefined}
      update={update}
      toggleInArray={toggleInArray}
    />,
  )
  return { update, toggleInArray }
}

describe('onboarding — unavailable target languages', () => {
  it('says nothing when every choice is available today', () => {
    renderControl(['yo', 'ha', 'ig'])
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('announces a single unavailable choice politely', () => {
    renderControl(['yo', 'sw'])
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('One of your choices is not available on WAZOBIA yet.')
    // Still honest about what happens next: interest recorded, no lessons.
    expect(status).toHaveTextContent(/no lessons exist for those languages today/i)
  })

  it('counts multiple unavailable choices', () => {
    renderControl(['sw', 'am', 'zu'])
    expect(screen.getByRole('status')).toHaveTextContent(
      '3 of your choices are not available on WAZOBIA yet.',
    )
  })

  it('renders the notice as an <output> element, not a role-patched paragraph', () => {
    renderControl(['sw'])
    // `output` has an implicit status role; asserting the tag keeps the fix in
    // place rather than letting it drift back to `<p role="status">`.
    expect(screen.getByRole('status').tagName).toBe('OUTPUT')
  })

  it('marks unavailable options with a badge so the choice is legible before selecting', () => {
    renderControl([])
    expect(screen.getAllByText('Not yet on WAZOBIA').length).toBeGreaterThan(0)
  })

  it('selects a language by clicking its card', async () => {
    const user = userEvent.setup()
    const { toggleInArray } = renderControl([])
    await user.click(screen.getByText('Kiswahili'))
    expect(toggleInArray).toHaveBeenCalledWith('targetLanguages', 'sw')
  })
})
