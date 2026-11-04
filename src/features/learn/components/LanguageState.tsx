import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { IconChevronRight, IconGlobe } from '@/components/ui/icons'
import { LanguagePicker } from './LanguagePicker'

/**
 * The two states a Learn pillar can be in when it has no language to show.
 *
 * Both are honest. Neither invents content, and neither assumes English is what
 * the learner meant. The distinction matters:
 *
 *  - **No supported language chosen** (`LanguageNotSelected`): the learner's
 *    onboarding answers did not include Yorùbá, Hausa or Igbo. Offer a picker
 *    right here so the fix is one click away, rather than a trip to Settings.
 *  - **Coming Soon** (`ComingSoon`): a specific language was requested but has
 *    no content in this build. Say which language and why.
 */

export function ComingSoon({ languageName }: { readonly languageName: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-paper-300 bg-paper-100 p-6 sm:p-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start">
        <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-paper-300 bg-white text-ink-500">
          <IconGlobe width={22} height={22} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[1.0625rem] font-semibold text-ink-900">
            {languageName} is coming soon
          </h2>
          <p className="mt-2 max-w-[58ch] text-[0.875rem] leading-6 text-ink-600">
            WAZOBIA Learn does not have {languageName} courses, proverbs or stories in this
            release. Rather than show you placeholder text dressed up as material, this section
            stays empty until the content exists and has been checked by a speaker.
          </p>
          <p className="mt-3 text-[0.8125rem] leading-6 text-ink-500">
            You can study Yorùbá, Hausa or Igbo now — choose one below or in Settings.
          </p>
          <div className="mt-4">
            <LanguagePicker compact />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Shown when the learner has no supported language at all.
 *
 * Deliberately does *not* say "we'll use English for now": English is the
 * bridge language, not an African-language selection.
 */
export function LanguageNotSelected() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-gold-500 bg-gold-100 p-6 sm:p-8">
      <h2 className="text-[1.0625rem] font-semibold text-ink-900">
        Choose a language to study
      </h2>
      <p className="mt-2 max-w-[60ch] text-[0.875rem] leading-6 text-ink-600">
        WAZOBIA Learn teaches Yorùbá, Hausa and Igbo. Your onboarding answers did not name one
        of them, and choosing one on your behalf would put you in a course you did not ask for.
      </p>
      <div className="mt-4">
        <LanguagePicker />
      </div>
      <p className="mt-3 text-[0.8125rem] text-ink-500">
        You can change this at any time in{' '}
        <Link
          to="/app/profile"
          className="font-medium text-forest-800 underline decoration-forest-300 underline-offset-2 hover:decoration-forest-700"
        >
          Profile
        </Link>
        .
      </p>
    </div>
  )
}

/** Small inline link used by pillar index pages. */
export function ChangeLanguageLink({ className }: { readonly className?: string }) {
  return (
    <Link to="/app/profile/preferences" className={className}>
      <Button size="sm" variant="ghost" trailingIcon={<IconChevronRight width={13} height={13} />}>
        Change language
      </Button>
    </Link>
  )
}
