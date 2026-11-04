import { LANGUAGES, type LanguageCode } from '@/config/languages'
import { useLanguagePreference } from '@/hooks/useLanguagePreference'
import { cn } from '@/utils/cn'

export interface LanguageSwitcherProps {
  /** `compact` shows codes only — used in the collapsed sidebar. */
  readonly variant?: 'full' | 'compact'
  readonly id: string
  readonly className?: string
}

/**
 * Language preference control.
 *
 * Every option lists the endonym first because the African languages are
 * first-class, with the English name as secondary information. Options are
 * always rendered with full orthography (Yorùbá, Igbo, not "Yoruba, Igbo") so
 * that the product itself demonstrates correct rendering.
 */
export function LanguageSwitcher({ variant = 'full', id, className }: LanguageSwitcherProps) {
  const { code, setLanguageCode } = useLanguagePreference()
  const isCompact = variant === 'compact'

  return (
    <div className={cn('min-w-0', className)}>
      <label
        htmlFor={id}
        className={cn(
          'mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-ink-400',
          isCompact && 'sr-only',
        )}
      >
        Language
      </label>
      <div className="relative">
        <select
          id={id}
          value={code}
          onChange={(event) => setLanguageCode(event.target.value as LanguageCode)}
          className={cn(
            'w-full appearance-none rounded-[var(--radius-sm)] border border-paper-300 bg-white',
            'font-serif text-ink-900 hover:border-ink-400',
            'focus-visible:border-forest-600',
            isCompact ? 'h-9 pl-1 pr-6 text-xs' : 'h-9 pl-2.5 pr-8 text-sm',
          )}
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code} lang={language.code}>
              {isCompact
                ? language.code.toUpperCase()
                : language.role === 'bridge'
                  ? `${language.nativeName} — bridge`
                  : `${language.nativeName} · ${language.englishName}`}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-ink-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}
