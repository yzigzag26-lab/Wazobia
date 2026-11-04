import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { StateMessage } from '@/components/ui/StateMessage'
import { IconArrowRight, IconCheck, IconInfo } from '@/components/ui/icons'
import { WazobiaLogo } from '@/components/brand/WazobiaLogo'
import { onboardingService } from '@/services/onboarding'
import { useSession } from '@/hooks/useSession'
import { createEmptyOnboardingProfile, type UserOnboardingProfile } from '@/types/onboarding'
import { STEP_NAMES, TOTAL_QUESTIONS, questionAt, type QuestionProps } from './questions'
import { QuestionControl } from './QuestionControl'
import { QuestionProgress } from './components/QuestionProgress'
import { isQuestionAnswered, validateQuestion } from './validation'

type Phase = 'questionnaire' | 'complete'

/**
 * Module scope, not render scope: the helper captures nothing, so defining it
 * inside the component would recreate it on every render for no benefit.
 * It is named for what it does — it scrolls the viewport back to the question,
 * it does not move focus (`useEffect` in this file owns focus).
 */
function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * One-question-per-page onboarding.
 *
 * Each screen shows a single question, which keeps the page calm on a phone and
 * makes "Previous / Continue" behave predictably. All answers still live in one
 * typed profile owned here, so navigating back and forth never loses an edit.
 *
 * Requirements implemented: Previous/Continue, Skip for now, editable answers,
 * draft persistence across refresh, and an honest completion state that never
 * claims the answers reached a server.
 */
export function OnboardingWizard() {
  const navigate = useNavigate()
  const { isGuest } = useSession()

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('questionnaire')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [storedLocally, setStoredLocally] = useState(false)
  const [profile, setProfile] = useState<UserOnboardingProfile>(
    () => onboardingService.readDraft() ?? createEmptyOnboardingProfile(),
  )

  const question = questionAt(index)
  const isFirst = index === 0
  const isLast = index === TOTAL_QUESTIONS - 1

  /* ------------------------------------------------------------- mutation */

  const update = useCallback<QuestionProps['update']>((key, value) => {
    setProfile((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }, [])

  const toggleInArray = useCallback<QuestionProps['toggleInArray']>((key, id) => {
    setProfile((current) => {
      const values: readonly string[] = current[key]
      const next = values.includes(id) ? values.filter((v) => v !== id) : [...values, id]
      return { ...current, [key]: next }
    })
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }, [])

  // Mirror the in-progress profile to local storage (never transmitted).
  useEffect(() => {
    onboardingService.saveDraft(profile)
  }, [profile])

  const context = useMemo<QuestionProps>(
    () => ({ profile, error: errors[question.id], update, toggleInArray }),
    [profile, errors, question.id, update, toggleInArray],
  )

  /* ----------------------------------------------------------- navigation */

  function goNext() {
    const error = validateQuestion(question.id, profile)
    if (error) {
      setErrors({ [question.id]: error })
      return
    }
    if (isLast) {
      void finish()
      return
    }
    setIndex((current) => Math.min(current + 1, TOTAL_QUESTIONS - 1))
    scrollToTop()
  }

  function goPrevious() {
    setErrors({})
    setIndex((current) => Math.max(current - 1, 0))
    scrollToTop()
  }

  async function finish() {
    setSubmitting(true)
    try {
      const result = await onboardingService.submit(profile)
      setStoredLocally(result.storedLocally)
      setPhase('complete')
      scrollToTop()
    } finally {
      setSubmitting(false)
    }
  }

  function skip() {
    navigate('/app', { replace: true })
  }

  /* ------------------------------------------------------------ completion */

  if (phase === 'complete') {
    return (
      <div className="mx-auto w-full max-w-[38rem] px-4 py-12 sm:px-6">
        <div className="flex justify-center">
          <WazobiaLogo variant="emblem" height={56} priority decorative />
        </div>
        <div className="mt-8 text-center">
          <p className="text-eyebrow text-forest-700">Thank you</p>
          <h1 className="text-display mt-2.5 text-[1.75rem] text-ink-900 sm:text-[2rem]">
            Your answers are recorded for this session
          </h1>
          <p className="mx-auto mt-3 max-w-[46ch] text-[0.9375rem] leading-7 text-ink-600">
            They are held in this browser only. WAZOBIA does not have an account service connected
            yet, so nothing has been sent to a server or attached to a permanent profile.
          </p>
        </div>

        <StateMessage
          className="mt-7"
          tone="waiting"
          icon={<IconInfo width={18} height={18} />}
          title={storedLocally ? 'Saved as a local draft' : 'Draft could not be stored'}
          description={
            storedLocally
              ? 'Your preferences stay on this device and will be used once accounts are connected. Clearing your browser data removes them.'
              : 'This browser blocked local storage, so your answers will be lost when you leave this page. You can still continue into WAZOBIA.'
          }
        />

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
          <Button
            fullWidth
            onClick={() => navigate('/app', { replace: true })}
            trailingIcon={<IconArrowRight width={15} height={15} />}
          >
            Continue to WAZOBIA
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setPhase('questionnaire')
              setIndex(0)
            }}
          >
            Review my answers
          </Button>
        </div>

        {isGuest ? (
          <p className="mt-5 text-center text-xs text-ink-500">
            You are still signed in as a guest. Creating an account later will keep these
            preferences.
          </p>
        ) : null}
      </div>
    )
  }

  /* --------------------------------------------------------- questionnaire */

  const answered = isQuestionAnswered(question.id, profile)

  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-start justify-between gap-4">
        <Link to="/" aria-label="WAZOBIA — home" className="flex items-center">
          <WazobiaLogo variant="emblem" height={38} priority decorative />
        </Link>
        <button
          type="button"
          onClick={skip}
          className="rounded-[var(--radius-sm)] px-2 py-1 text-[0.8125rem] font-medium text-ink-500 underline underline-offset-4 hover:text-forest-800"
        >
          Skip for now
        </button>
      </div>

      <div className="mt-7">
        <QuestionProgress
          index={index}
          total={TOTAL_QUESTIONS}
          step={question.step}
          stepName={STEP_NAMES[question.step]}
        />
      </div>

      <form
        className="mt-8"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          goNext()
        }}
      >
        {/* key forces a fresh mount per question so the rise-in animation replays
            and no stale scroll/focus state carries across pages */}
        <div key={question.id} className="animate-rise">
          <h1
            id="question-heading"
            className="text-display text-[1.5rem] text-ink-900 sm:text-[1.875rem]"
          >
            {question.title}
          </h1>
          {question.subtitle ? (
            <p className="mt-2 max-w-[52ch] text-[0.9375rem] leading-7 text-ink-600">
              {question.subtitle}
            </p>
          ) : null}

          {/* The control renders its own fieldset + legend, so this is a plain
              wrapper. A second role="group" here would nest duplicate groups and
              make screen-reader navigation noisier, not clearer. */}
          <div className="mt-6">
            <QuestionControl questionId={question.id} {...context} />
          </div>

          {question.footnote ? (
            <p className="mt-5 rounded-[var(--radius-sm)] border border-paper-300 bg-paper-100 px-3.5 py-2.5 text-[0.75rem] leading-5 text-ink-600">
              {question.footnote}
            </p>
          ) : null}
        </div>

        {/* DOM order is Previous → Continue, which is left-to-right on wide
            screens and top-to-bottom on phones — so the primary action ends up
            last, nearest the thumb, with no `order` trickery and a keyboard tab
            order that matches what you see. */}
        <div className="mt-8 flex flex-col gap-2.5 border-t border-paper-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2.5">
            {isFirst ? (
              <Button variant="ghost" type="button" onClick={skip}>
                Skip for now
              </Button>
            ) : (
              <Button variant="secondary" type="button" onClick={goPrevious}>
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {answered ? (
              <span className="hidden text-xs text-forest-600 sm:inline" aria-live="polite">
                Answered
              </span>
            ) : null}
            <Button
              type="submit"
              isLoading={submitting}
              className="sm:min-w-[8.5rem]"
              trailingIcon={
                isLast ? <IconCheck width={15} height={15} /> : <IconArrowRight width={15} height={15} />
              }
            >
              {isLast ? 'Finish' : 'Continue'}
            </Button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-xs leading-5 text-ink-400">
        Question {index + 1} of {TOTAL_QUESTIONS} · answers stay in this browser for now
      </p>
    </div>
  )
}
