import { Link } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { Badge } from '@/components/ui/Badge'
import { LanguagePicker } from '@/features/learn/components/LanguagePicker'
import { STUDY_LANGUAGE_LABELS, isStudyLanguage } from '@/features/learn/language'
import { Tabs } from '@/components/ui/Tabs'
import { useState } from 'react'

/**
 * Profile preferences.
 *
 * Name and username live on the Profile page itself (one editing surface); this
 * page holds the choices that steer the learning experience — starting level,
 * target language and daily goal.
 *
 * The daily goal is a stated intention, not a trackable target: WAZOBIA has no
 * server-side activity log, so the page says the number is stored locally and
 * that reminders cannot be sent. Promising a streak reminder would be a lie.
 */
export default function PreferencesSettings() {
  const { primaryLanguage, primaryLanguageIsExplicit } = useProfile()
  type Level = 'beginner' | 'intermediate' | 'advanced'
  const [level, setLevel] = useState<Level>('beginner')

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="language-pref-heading"
        className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="language-pref-heading" className="text-[0.9375rem] font-semibold text-ink-900">
              Language you are studying
            </h2>
            <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
              This is the single African language every Learn screen uses. Changing it changes the
              courses, quizzes, proverb cards and stories you see.
            </p>
          </div>
          <Badge tone={primaryLanguageIsExplicit ? 'accent' : 'neutral'}>
            {primaryLanguageIsExplicit ? 'Chosen by you' : 'From onboarding'}
          </Badge>
        </div>

        <div className="mt-4">
          <LanguagePicker />
        </div>

        {primaryLanguage && !isStudyLanguage(primaryLanguage) ? (
          <p className="mt-3 rounded-[var(--radius-md)] border border-gold-500 bg-gold-100 px-3 py-2 text-[0.8125rem] leading-6 text-ink-700">
            {STUDY_LANGUAGE_LABELS[primaryLanguage]} is not taught on WAZOBIA Learn yet, so the
            learning screens will show a Coming Soon state rather than English content.
          </p>
        ) : null}
      </section>

      <section
        aria-labelledby="level-heading"
        className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
      >
        <h2 id="level-heading" className="text-[0.9375rem] font-semibold text-ink-900">
          Starting level
        </h2>
        <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
          Which level to open first. It does not lock anything — every published course stays
          reachable.
        </p>

        <Tabs
          label="Starting level"
          active={level}
          onChange={setLevel}
          className="mt-4"
          items={[
            { id: 'beginner' as const, label: 'Beginner' },
            { id: 'intermediate' as const, label: 'Intermediate' },
            { id: 'advanced' as const, label: 'Advanced' },
          ]}
        />

        <p className="mt-2 text-[0.75rem] leading-5 text-ink-500">
          {level === 'beginner'
            ? 'Courses that assume no prior knowledge.'
            : level === 'intermediate'
              ? 'Courses that assume you can greet and hold a short exchange.'
              : 'Courses that assume comfortable reading and conversation.'}
        </p>

        {level !== 'beginner' ? (
          <p className="mt-2 text-[0.75rem] leading-5 text-ink-400">
            Only beginner courses are published today, so you will land on those regardless.
          </p>
        ) : null}
      </section>

      <section
        aria-labelledby="goal-heading"
        className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
      >
        <h2 id="goal-heading" className="text-[0.9375rem] font-semibold text-ink-900">
          Daily goal
        </h2>
        <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
          How long you would like to study each day. This is a stated intention shown on your
          profile — WAZOBIA does not send reminders, because it cannot send email yet.
        </p>

        <GoalPicker />
      </section>

      <p className="text-[0.75rem] leading-5 text-ink-400">
        Editing your name or username? Those are on the{' '}
        <Link
          to="/app/profile"
          className="font-medium text-forest-800 underline decoration-forest-300 underline-offset-2"
        >
          Profile
        </Link>{' '}
        page, so there is only one place to change them.
      </p>
    </div>
  )
}

function GoalPicker() {
  const [minutes, setMinutes] = useState<number>(15)
  const options = [5, 10, 15, 30] as const

  return (
    <fieldset className="mt-4">
      <legend className="sr-only">Minutes per day</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={
              minutes === option
                ? 'cursor-pointer rounded-[var(--radius-md)] border border-forest-600 bg-forest-50 px-3.5 py-2 text-[0.875rem] font-medium text-ink-900'
                : 'cursor-pointer rounded-[var(--radius-md)] border border-paper-300 px-3.5 py-2 text-[0.875rem] text-ink-700 hover:border-ink-400'
            }
          >
            <input
              type="radio"
              name="daily-goal"
              value={option}
              checked={minutes === option}
              onChange={() => setMinutes(option)}
              aria-label={`${option} minutes per day`}
              className="sr-only"
            />
            {option} minutes
          </label>
        ))}
      </div>
      <p className="mt-2 text-[0.75rem] text-ink-400">
        {minutes} minutes a day. Stored in this browser with your other preferences.
      </p>
    </fieldset>
  )
}
