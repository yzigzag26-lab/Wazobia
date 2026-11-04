import { useProfile } from '@/hooks/useProfile'
import { STUDY_LANGUAGES, STUDY_LANGUAGE_LABELS } from '../language'
import { cn } from '@/utils/cn'
import { IconCheck } from '@/components/ui/icons'

export interface LanguagePickerProps {
  readonly compact?: boolean
  readonly className?: string
}

/**
 * Radio-style language chooser for the three study languages.
 *
 * This is *not* the onboarding question repeated. Onboarding asks what the
 * learner wants to learn; this control shows up only when that answer produced
 * no usable language, or in Settings when the learner wants to switch. It is
 * therefore never shown to a learner who already has a language.
 *
 * Real radio inputs (visually hidden, with the label as the hit area) rather
 * than buttons, so arrow keys and screen readers behave the way they should.
 */
export function LanguagePicker({ compact = false, className }: LanguagePickerProps) {
  const { primaryLanguage, setPrimaryLanguage } = useProfile()

  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="sr-only">Language to study</legend>
      <div
        className={cn(
          'grid gap-2',
          compact ? 'sm:grid-cols-3' : 'sm:grid-cols-3',
        )}
      >
        {STUDY_LANGUAGES.map((code) => {
          const checked = primaryLanguage === code
          return (
            <label
              key={code}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border px-3 py-2.5',
                'transition-colors duration-100',
                checked
                  ? 'border-forest-600 bg-forest-50 text-ink-900'
                  : 'border-paper-300 bg-white text-ink-700 hover:border-ink-400',
              )}
            >
              <input
                type="radio"
                name="study-language"
                value={code}
                checked={checked}
                onChange={() => setPrimaryLanguage(code)}
                aria-label={STUDY_LANGUAGE_LABELS[code]}
                className="size-4 shrink-0 accent-[var(--color-forest-700)]"
              />
              <span lang={code} className="font-serif text-[0.9375rem] leading-6">
                {STUDY_LANGUAGE_LABELS[code]}
              </span>
              {checked ? (
                <IconCheck width={14} height={14} className="ml-auto text-forest-700" />
              ) : null}
            </label>
          )
        })}
      </div>
      {compact ? null : (
        <p className="mt-2.5 text-[0.75rem] leading-5 text-ink-400">
          Saved in this browser only — WAZOBIA has no account service yet.
        </p>
      )}
    </fieldset>
  )
}
