import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconChevronRight, IconLock, IconUser } from '@/components/ui/icons'
import { STUDY_LANGUAGE_LABELS } from '@/features/learn/language'
import { findLanguage } from '@/config/languages'
import { ProfileForm } from './ProfileForm'

/**
 * Profile.
 *
 * One screen, four groups: who you are, the language you are studying, your
 * learning preferences, and the way into Settings.
 *
 * Identity comes from the ACCOUNT (`/users/me`), not from the device-local
 * store. The local store used to feed this header, which is why a signed-in user
 * saw "No username set" and "No email set" while their account plainly had both:
 * the page was reading a localStorage entry that registration never wrote.
 *
 * Onboarding answers genuinely are device-local — there is no server table for
 * them — and the page says so rather than implying they follow the account.
 */
export default function ProfilePage() {
  const { profile } = useAuth()
  const { onboarding, primaryLanguage, primaryLanguageIsExplicit } = useProfile()

  const displayName = profile?.display_name.trim() || 'Your account'
  const initial = displayName.charAt(0).toUpperCase()
  const username = profile?.username ?? null
  const email = profile?.email ?? null

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={<span>Profile</span>}
        title="Your profile"
        description="Your name, username and language come from your account, so they follow you to any device you sign in on."
        actions={
          <Link to="/app/profile/settings">
            <Button variant="secondary" leadingIcon={<IconLock width={14} height={14} />}>
              Settings
            </Button>
          </Link>
        }
      />

      {/* ----------------------------------------------------------- identity */}
      <section aria-labelledby="identity-heading" className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6">
        <h2 id="identity-heading" className="sr-only">
          Identity
        </h2>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full border border-paper-300 bg-paper-100 text-[1.375rem] font-semibold text-forest-800"
          >
            {profile?.display_name.trim() ? initial : <IconUser width={22} height={22} />}
          </span>

          <div className="min-w-0">
            <p className="text-[1.125rem] font-semibold leading-6 text-ink-900">{displayName}</p>
            <p className="mt-0.5 text-[0.875rem] text-ink-500">
              {username === null ? (
                <span className="text-ink-400">No username set</span>
              ) : (
                <span>@{username}</span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* The address comes from the verified session, so it is a fact
                  rather than a claim. "Unverified" would be wrong: Supabase
                  confirmed it at sign-up, and there is no verification email to
                  send because none is needed. */}
              <Badge tone="neutral">{email === null ? 'No email on file' : 'Email confirmed'}</Badge>
              {/* No "guest" badge: the app area requires an account, so there
                  is no such session to describe. */}
              <Badge tone="neutral">Signed in</Badge>
            </div>
          </div>
        </div>

        {email === null ? null : (
          <p className="mt-3 text-[0.75rem] leading-5 text-ink-400">{email}</p>
        )}
      </section>

      {/* ---------------------------------------------------------- the form */}
      <ProfileForm />

      {/* --------------------------------------------------------- languages */}
      <section aria-labelledby="languages-heading" className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="languages-heading" className="text-[0.9375rem] font-semibold text-ink-900">
              Languages
            </h2>
            <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
              Your primary language drives every Learn screen. It came from your onboarding
              answers unless you changed it here.
            </p>
          </div>
          <Link to="/app/profile/settings/preferences" className="shrink-0">
            <Button size="sm" variant="ghost" trailingIcon={<IconChevronRight width={13} height={13} />}>
              Change
            </Button>
          </Link>
        </div>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Studying
            </dt>
            <dd className="mt-1 text-[0.9375rem] text-ink-900">
              {primaryLanguage ? (
                <span lang={primaryLanguage}>{STUDY_LANGUAGE_LABELS[primaryLanguage]}</span>
              ) : (
                <span className="text-ink-500">Not selected</span>
              )}
            </dd>
            <dd className="mt-0.5 text-[0.75rem] text-ink-400">
              {primaryLanguage
                ? primaryLanguageIsExplicit
                  ? 'You chose this'
                  : 'Inferred from your onboarding answers'
                : 'Choose one in Preferences'}
            </dd>
          </div>

          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Onboarding answers
            </dt>
            <dd className="mt-1 text-[0.9375rem] text-ink-900">
              {onboarding ? 'Completed' : 'Not completed'}
            </dd>
            <dd className="mt-0.5 text-[0.75rem] text-ink-400">
              {onboarding
                ? 'Held in this browser only'
                : 'You can finish it any time — it is not required'}
            </dd>
          </div>
        </dl>

        {onboarding?.knownLanguages?.length || onboarding?.targetLanguages?.length ? (
          <div className="mt-4 border-t border-paper-200 pt-3">
            <p className="text-[0.75rem] leading-5 text-ink-500">
              {onboarding?.knownLanguages?.length
                ? `Languages you said you know: ${onboarding.knownLanguages
                    .map((code) => findLanguage(code)?.nativeName ?? code)
                    .join(', ')}.`
                : ''}{' '}
              {onboarding?.targetLanguages?.length
                ? `Languages you said you want to learn: ${onboarding.targetLanguages
                    .map((code) => findLanguage(code)?.nativeName ?? code)
                    .join(', ')}.`
                : ''}
            </p>
          </div>
        ) : null}
      </section>

      {/* --------------------------------------------------------- settings */}
      <section aria-labelledby="settings-heading" className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6">
        <h2 id="settings-heading" className="text-[0.9375rem] font-semibold text-ink-900">
          Settings
        </h2>
        <p className="mt-1 text-[0.8125rem] leading-6 text-ink-600">
          Appearance, security, preferences, privacy and notifications.
        </p>
        <div className="mt-4">
          <Link to="/app/profile/settings">
            <Button variant="secondary" trailingIcon={<IconChevronRight width={13} height={13} />}>
              Open settings
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
